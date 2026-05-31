
-- Table to store external database connections (admin-only)
CREATE TABLE public.db_connections (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  connection_url_encrypted text NOT NULL,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'connected', 'failed', 'disabled')),
  last_tested_at timestamptz,
  last_sync_at timestamptz,
  last_error text,
  alerts_table_name text NOT NULL DEFAULT 'alerts',
  sync_interval_minutes integer NOT NULL DEFAULT 5,
  is_active boolean NOT NULL DEFAULT true,
  created_by uuid NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.db_connections ENABLE ROW LEVEL SECURITY;

-- Only admins can manage DB connections
CREATE POLICY "Admins can view db_connections"
ON public.db_connections FOR SELECT TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can insert db_connections"
ON public.db_connections FOR INSERT TO authenticated
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can update db_connections"
ON public.db_connections FOR UPDATE TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can delete db_connections"
ON public.db_connections FOR DELETE TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role));

-- Track which alerts were ingested from external DBs to prevent duplicates
CREATE TABLE public.external_alert_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  connection_id uuid NOT NULL REFERENCES public.db_connections(id) ON DELETE CASCADE,
  external_alert_id text NOT NULL,
  local_alert_id uuid REFERENCES public.alerts(id) ON DELETE SET NULL,
  ingested_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(connection_id, external_alert_id)
);

ALTER TABLE public.external_alert_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view external_alert_log"
ON public.external_alert_log FOR SELECT TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can insert external_alert_log"
ON public.external_alert_log FOR INSERT TO authenticated
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- Trigger for updated_at on db_connections
CREATE TRIGGER update_db_connections_updated_at
BEFORE UPDATE ON public.db_connections
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();
