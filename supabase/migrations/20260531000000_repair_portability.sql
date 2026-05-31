-- Dynamic triggers and cron jobs setup to remove hardcoded credentials

-- 1. Redefine public.auto_process_alert to dynamically fetch supabase url and service role key
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
  IF supabase_url IS NOT NULL AND service_key IS NOT NULL THEN
    BEGIN
      PERFORM net.http_post(
        url := supabase_url || '/functions/v1/analyze-alert',
        headers := jsonb_build_object(
          'Content-Type', 'application/json',
          'Authorization', 'Bearer ' || service_key
        ),
        body := jsonb_build_object(
          'alert', row_to_json(NEW)
        )
      );
    EXCEPTION WHEN OTHERS THEN
      -- Silently fail - cron job will handle unprocessed alerts
      NULL;
    END;
  END IF;
  
  RETURN NEW;
END;
$function$;

-- 2. Create dynamic cron triggers wrapper functions
CREATE OR REPLACE FUNCTION public.trigger_process_alerts()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  supabase_url text;
  service_key text;
BEGIN
  supabase_url := current_setting('app.settings.supabase_url', true);
  service_key := current_setting('app.settings.service_role_key', true);
  
  IF supabase_url IS NOT NULL AND service_key IS NOT NULL THEN
    BEGIN
      PERFORM net.http_post(
        url := supabase_url || '/functions/v1/process-alerts',
        headers := jsonb_build_object(
          'Content-Type', 'application/json',
          'Authorization', 'Bearer ' || service_key
        ),
        body := '{}'::jsonb
      );
    EXCEPTION WHEN OTHERS THEN
      NULL;
    END;
  END IF;
END;
$$;

CREATE OR REPLACE FUNCTION public.trigger_health_summary()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  supabase_url text;
  service_key text;
BEGIN
  supabase_url := current_setting('app.settings.supabase_url', true);
  service_key := current_setting('app.settings.service_role_key', true);
  
  IF supabase_url IS NOT NULL AND service_key IS NOT NULL THEN
    BEGIN
      PERFORM net.http_post(
        url := supabase_url || '/functions/v1/health-summary',
        headers := jsonb_build_object(
          'Content-Type', 'application/json',
          'Authorization', 'Bearer ' || service_key
        ),
        body := '{}'::jsonb
      );
    EXCEPTION WHEN OTHERS THEN
      NULL;
    END;
  END IF;
END;
$$;

-- 3. Reschedule cron jobs dynamically if pg_cron exists
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_namespace WHERE nspname = 'cron') THEN
    BEGIN
      PERFORM cron.unschedule('process-alerts-every-5-min');
    EXCEPTION WHEN OTHERS THEN
      NULL;
    END;
    
    BEGIN
      PERFORM cron.unschedule('health-summary-daily');
    EXCEPTION WHEN OTHERS THEN
      NULL;
    END;

    PERFORM cron.schedule(
      'process-alerts-every-5-min',
      '*/5 * * * *',
      'SELECT public.trigger_process_alerts();'
    );

    PERFORM cron.schedule(
      'health-summary-daily',
      '0 0 * * *',
      'SELECT public.trigger_health_summary();'
    );
  END IF;
END;
$$;
