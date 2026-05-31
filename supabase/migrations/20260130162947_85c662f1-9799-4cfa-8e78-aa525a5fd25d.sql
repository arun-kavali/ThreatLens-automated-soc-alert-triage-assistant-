-- Add resolved_at timestamp to incidents table
ALTER TABLE public.incidents 
ADD COLUMN IF NOT EXISTS resolved_at timestamp with time zone;

-- Create incident_activity table for logging actions
CREATE TABLE public.incident_activity (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  incident_id uuid REFERENCES public.incidents(id) ON DELETE CASCADE NOT NULL,
  user_id uuid NOT NULL,
  action_type text NOT NULL,
  action_label text NOT NULL,
  is_demo boolean NOT NULL DEFAULT true,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  metadata jsonb DEFAULT '{}'::jsonb
);

-- Enable RLS on incident_activity
ALTER TABLE public.incident_activity ENABLE ROW LEVEL SECURITY;

-- Only analysts and admins can view activity
CREATE POLICY "Analysts and admins can view incident_activity"
ON public.incident_activity FOR SELECT
USING (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'analyst'));

-- Only analysts can insert activity (perform actions)
CREATE POLICY "Analysts can insert incident_activity"
ON public.incident_activity FOR INSERT
WITH CHECK (has_role(auth.uid(), 'analyst'));

-- Create index for faster lookups
CREATE INDEX idx_incident_activity_incident_id ON public.incident_activity(incident_id);

-- Update incidents RLS: Allow analysts to update incidents (for resolving)
CREATE POLICY "Analysts can update incidents"
ON public.incidents FOR UPDATE
USING (has_role(auth.uid(), 'analyst'))
WITH CHECK (has_role(auth.uid(), 'analyst'));