
-- Drop restrictive INSERT policies on alerts
DROP POLICY IF EXISTS "Admins can insert alerts" ON public.alerts;
DROP POLICY IF EXISTS "Alert sources can insert alerts" ON public.alerts;

-- Recreate as PERMISSIVE (default)
CREATE POLICY "Admins can insert alerts"
ON public.alerts FOR INSERT
TO authenticated
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Alert sources can insert alerts"
ON public.alerts FOR INSERT
TO authenticated
WITH CHECK (has_role(auth.uid(), 'alert_source'::app_role));

-- Also fix SELECT so alert_source users can read their own inserted alerts (needed for .select() after insert)
DROP POLICY IF EXISTS "Analysts and admins can view alerts" ON public.alerts;

CREATE POLICY "Authenticated users can view alerts"
ON public.alerts FOR SELECT
TO authenticated
USING (
  has_role(auth.uid(), 'admin'::app_role) 
  OR has_role(auth.uid(), 'analyst'::app_role)
  OR has_role(auth.uid(), 'alert_source'::app_role)
);

-- Fix UPDATE to allow service-level updates (for edge function analyze-alert)
DROP POLICY IF EXISTS "Admins can update alerts" ON public.alerts;

CREATE POLICY "Admins can update alerts"
ON public.alerts FOR UPDATE
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role));

-- Fix DELETE
DROP POLICY IF EXISTS "Admins can delete alerts" ON public.alerts;

CREATE POLICY "Admins can delete alerts"
ON public.alerts FOR DELETE
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role));

-- Fix alert_incident_map policies to be permissive
DROP POLICY IF EXISTS "Admins can delete alert_incident_map" ON public.alert_incident_map;
DROP POLICY IF EXISTS "Admins can insert alert_incident_map" ON public.alert_incident_map;
DROP POLICY IF EXISTS "Analysts and admins can view alert_incident_map" ON public.alert_incident_map;

CREATE POLICY "Admins can delete alert_incident_map"
ON public.alert_incident_map FOR DELETE
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can insert alert_incident_map"
ON public.alert_incident_map FOR INSERT
TO authenticated
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Analysts and admins can view alert_incident_map"
ON public.alert_incident_map FOR SELECT
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'analyst'::app_role));

-- Fix incidents policies to be permissive
DROP POLICY IF EXISTS "Admins can delete incidents" ON public.incidents;
DROP POLICY IF EXISTS "Admins can insert incidents" ON public.incidents;
DROP POLICY IF EXISTS "Admins can update incidents" ON public.incidents;
DROP POLICY IF EXISTS "Analysts and admins can view incidents" ON public.incidents;
DROP POLICY IF EXISTS "Analysts can update incidents" ON public.incidents;

CREATE POLICY "Admins can delete incidents"
ON public.incidents FOR DELETE TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can insert incidents"
ON public.incidents FOR INSERT TO authenticated
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can update incidents"
ON public.incidents FOR UPDATE TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Analysts and admins can view incidents"
ON public.incidents FOR SELECT TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'analyst'::app_role));

CREATE POLICY "Analysts can update incidents"
ON public.incidents FOR UPDATE TO authenticated
USING (has_role(auth.uid(), 'analyst'::app_role))
WITH CHECK (has_role(auth.uid(), 'analyst'::app_role));

-- Fix incident_activity policies to be permissive
DROP POLICY IF EXISTS "Admins can insert incident_activity" ON public.incident_activity;
DROP POLICY IF EXISTS "Analysts and admins can view incident_activity" ON public.incident_activity;
DROP POLICY IF EXISTS "Analysts can insert own incident_activity" ON public.incident_activity;

CREATE POLICY "Admins can insert incident_activity"
ON public.incident_activity FOR INSERT TO authenticated
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Analysts and admins can view incident_activity"
ON public.incident_activity FOR SELECT TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'analyst'::app_role));

CREATE POLICY "Analysts can insert own incident_activity"
ON public.incident_activity FOR INSERT TO authenticated
WITH CHECK (has_role(auth.uid(), 'analyst'::app_role) AND (user_id = auth.uid()));

-- Fix profiles policies to be permissive
DROP POLICY IF EXISTS "Admins can view all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Users can insert their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can view their own profile" ON public.profiles;

CREATE POLICY "Admins can view all profiles"
ON public.profiles FOR SELECT TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Users can insert their own profile"
ON public.profiles FOR INSERT TO authenticated
WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can update their own profile"
ON public.profiles FOR UPDATE TO authenticated
USING (auth.uid() = id);

CREATE POLICY "Users can view their own profile"
ON public.profiles FOR SELECT TO authenticated
USING (auth.uid() = id);

-- Fix user_roles policies to be permissive
DROP POLICY IF EXISTS "Admins can view all roles" ON public.user_roles;
DROP POLICY IF EXISTS "Users can view their own role" ON public.user_roles;

CREATE POLICY "Admins can view all roles"
ON public.user_roles FOR SELECT TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Users can view their own role"
ON public.user_roles FOR SELECT TO authenticated
USING (auth.uid() = user_id);
