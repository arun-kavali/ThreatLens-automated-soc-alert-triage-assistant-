-- Step 2: Update RLS policies for alerts table to allow alert_source to insert
DROP POLICY IF EXISTS "Alert sources can insert alerts" ON public.alerts;
CREATE POLICY "Alert sources can insert alerts"
  ON public.alerts FOR INSERT
  WITH CHECK (has_role(auth.uid(), 'alert_source'::app_role));

-- Step 3: Update handle_new_user to accept role from signup metadata
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  selected_role app_role;
BEGIN
  -- Insert profile
  INSERT INTO public.profiles (id, email, display_name)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data ->> 'display_name', split_part(NEW.email, '@', 1))
  );
  
  -- Get role from metadata, default to analyst if not specified
  -- Only allow 'analyst' or 'alert_source' from signup - never 'admin'
  selected_role := CASE 
    WHEN NEW.raw_user_meta_data ->> 'role' = 'alert_source' THEN 'alert_source'::app_role
    ELSE 'analyst'::app_role
  END;
  
  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, selected_role)
  ON CONFLICT (user_id) DO NOTHING;
  
  RETURN NEW;
END;
$function$;

-- Step 4: Create a database function to auto-process new alerts via pg_net
CREATE OR REPLACE FUNCTION public.auto_process_alert()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  supabase_url text;
  service_key text;
BEGIN
  -- Get environment variables
  supabase_url := current_setting('app.settings.supabase_url', true);
  service_key := current_setting('app.settings.service_role_key', true);
  
  -- If pg_net is available, call the analyze-alert edge function
  -- This is a best-effort call - if it fails, the cron job will pick it up
  BEGIN
    PERFORM net.http_post(
      url := 'https://ptohzzgcexxwuxukjiuz.supabase.co/functions/v1/analyze-alert',
      headers := jsonb_build_object(
        'Content-Type', 'application/json',
        'Authorization', 'Bearer ' || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InB0b2h6emdjZXh4d3V4dWtqaXV6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjY2NDI1MTcsImV4cCI6MjA4MjIxODUxN30.Nrj0SyUzbU8KMe4NvvIVhqYfM_Ugrc79EuRAn3yCKW8'
      ),
      body := jsonb_build_object(
        'alert', row_to_json(NEW)
      )
    );
  EXCEPTION WHEN OTHERS THEN
    -- Silently fail - cron job will handle unprocessed alerts
    NULL;
  END;
  
  RETURN NEW;
END;
$function$;

-- Step 5: Create trigger for new alerts to auto-process
DROP TRIGGER IF EXISTS on_new_alert_process ON public.alerts;
CREATE TRIGGER on_new_alert_process
  AFTER INSERT ON public.alerts
  FOR EACH ROW
  EXECUTE FUNCTION public.auto_process_alert();