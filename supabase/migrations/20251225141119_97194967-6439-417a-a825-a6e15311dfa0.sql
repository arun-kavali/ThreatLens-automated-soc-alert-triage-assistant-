-- Create enum for alert severity
CREATE TYPE public.alert_severity AS ENUM ('Low', 'Medium', 'High', 'Critical');

-- Create enum for alert status
CREATE TYPE public.alert_status AS ENUM ('New', 'Reviewed', 'Correlated');

-- Create enum for incident severity
CREATE TYPE public.incident_severity AS ENUM ('Low', 'Medium', 'High', 'Critical');

-- Create enum for incident status
CREATE TYPE public.incident_status AS ENUM ('Open', 'In Progress', 'Resolved', 'Closed');

-- Create alerts table
CREATE TABLE public.alerts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  timestamp TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  source_system TEXT NOT NULL,
  alert_type TEXT NOT NULL,
  severity alert_severity NOT NULL DEFAULT 'Medium',
  raw_log JSONB,
  risk_score INTEGER CHECK (risk_score >= 0 AND risk_score <= 100),
  ai_analysis TEXT,
  ai_used BOOLEAN NOT NULL DEFAULT false,
  status alert_status NOT NULL DEFAULT 'New',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create incidents table
CREATE TABLE public.incidents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  severity incident_severity NOT NULL DEFAULT 'Medium',
  status incident_status NOT NULL DEFAULT 'Open',
  incident_reason TEXT,
  auto_created BOOLEAN NOT NULL DEFAULT false,
  ai_summary TEXT,
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create alert_incident_map table (junction table for correlation)
CREATE TABLE public.alert_incident_map (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  alert_id UUID REFERENCES public.alerts(id) ON DELETE CASCADE NOT NULL,
  incident_id UUID REFERENCES public.incidents(id) ON DELETE CASCADE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE (alert_id, incident_id)
);

-- Enable RLS on all tables
ALTER TABLE public.alerts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.incidents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.alert_incident_map ENABLE ROW LEVEL SECURITY;

-- RLS Policies for alerts
CREATE POLICY "Authenticated users can view alerts"
ON public.alerts
FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Admins can insert alerts"
ON public.alerts
FOR INSERT
TO authenticated
WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update alerts"
ON public.alerts
FOR UPDATE
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete alerts"
ON public.alerts
FOR DELETE
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- RLS Policies for incidents
CREATE POLICY "Authenticated users can view incidents"
ON public.incidents
FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Admins can insert incidents"
ON public.incidents
FOR INSERT
TO authenticated
WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update incidents"
ON public.incidents
FOR UPDATE
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete incidents"
ON public.incidents
FOR DELETE
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- RLS Policies for alert_incident_map
CREATE POLICY "Authenticated users can view alert_incident_map"
ON public.alert_incident_map
FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Admins can insert alert_incident_map"
ON public.alert_incident_map
FOR INSERT
TO authenticated
WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete alert_incident_map"
ON public.alert_incident_map
FOR DELETE
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- Add triggers for updated_at
CREATE TRIGGER update_alerts_updated_at
  BEFORE UPDATE ON public.alerts
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_incidents_updated_at
  BEFORE UPDATE ON public.incidents
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();