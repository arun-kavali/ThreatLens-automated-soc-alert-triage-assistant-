
-- Enable pg_net extension for HTTP calls from triggers
CREATE EXTENSION IF NOT EXISTS pg_net WITH SCHEMA extensions;

-- Create the trigger on alerts table to auto-process new alerts
CREATE TRIGGER on_alert_inserted
  AFTER INSERT ON public.alerts
  FOR EACH ROW
  EXECUTE FUNCTION public.auto_process_alert();
