-- Fix: Ensure analysts can only insert incident_activity records for themselves
-- Drop the existing permissive insert policy
DROP POLICY IF EXISTS "Analysts can insert incident_activity" ON public.incident_activity;

-- Create a more secure insert policy that verifies user_id matches authenticated user
CREATE POLICY "Analysts can insert own incident_activity" 
ON public.incident_activity 
FOR INSERT 
TO authenticated
WITH CHECK (
  has_role(auth.uid(), 'analyst'::app_role) 
  AND user_id = auth.uid()
);

-- Also allow admins to insert activity records (for system/automated actions)
CREATE POLICY "Admins can insert incident_activity" 
ON public.incident_activity 
FOR INSERT 
TO authenticated
WITH CHECK (
  has_role(auth.uid(), 'admin'::app_role)
);