-- Schedule: Every 5 minutes - Auto-process alerts and run correlation engine
SELECT cron.schedule(
  'process-alerts-every-5-min',
  '*/5 * * * *',
  $$
  SELECT net.http_post(
    url := 'https://ptohzzgcexxwuxukjiuz.supabase.co/functions/v1/process-alerts',
    headers := '{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InB0b2h6emdjZXh4d3V4dWtqaXV6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjY2NDI1MTcsImV4cCI6MjA4MjIxODUxN30.Nrj0SyUzbU8KMe4NvvIVhqYfM_Ugrc79EuRAn3yCKW8"}'::jsonb,
    body := '{}'::jsonb
  ) AS request_id;
  $$
);

-- Schedule: Daily at midnight UTC - Generate system health summary
SELECT cron.schedule(
  'health-summary-daily',
  '0 0 * * *',
  $$
  SELECT net.http_post(
    url := 'https://ptohzzgcexxwuxukjiuz.supabase.co/functions/v1/health-summary',
    headers := '{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InB0b2h6emdjZXh4d3V4dWtqaXV6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjY2NDI1MTcsImV4cCI6MjA4MjIxODUxN30.Nrj0SyUzbU8KMe4NvvIVhqYfM_Ugrc79EuRAn3yCKW8"}'::jsonb,
    body := '{}'::jsonb
  ) AS request_id;
  $$
);