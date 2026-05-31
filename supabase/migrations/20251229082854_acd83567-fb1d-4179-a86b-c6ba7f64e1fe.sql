-- =====================================================
-- SECURITY FIX: Prevent Role Self-Escalation
-- =====================================================

-- 1. Drop the vulnerable INSERT policy that allows users to insert ANY role
DROP POLICY IF EXISTS "Users can insert their own role on signup" ON public.user_roles;

-- 2. Create a SECURITY DEFINER function to safely assign default role
-- This ensures users can ONLY be assigned 'analyst' role on signup
CREATE OR REPLACE FUNCTION public.assign_default_role(_user_id UUID)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Only insert 'analyst' role by default - never allow admin self-assignment
  INSERT INTO public.user_roles (user_id, role)
  VALUES (_user_id, 'analyst')
  ON CONFLICT (user_id) DO NOTHING;
END;
$$;

-- 3. Add unique constraint to prevent multiple roles per user
ALTER TABLE public.user_roles DROP CONSTRAINT IF EXISTS user_roles_user_id_role_key;
ALTER TABLE public.user_roles ADD CONSTRAINT one_role_per_user UNIQUE (user_id);

-- 4. Modify handle_new_user trigger to automatically assign analyst role
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Insert profile
  INSERT INTO public.profiles (id, email, display_name)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data ->> 'display_name', split_part(NEW.email, '@', 1))
  );
  
  -- Automatically assign analyst role (never trust client-side role selection)
  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, 'analyst')
  ON CONFLICT (user_id) DO NOTHING;
  
  RETURN NEW;
END;
$$;

-- 5. Create admin-only function for promoting users to admin
CREATE OR REPLACE FUNCTION public.promote_to_admin(_target_user_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Only allow if caller is already an admin
  IF NOT public.has_role(auth.uid(), 'admin') THEN
    RAISE EXCEPTION 'Only admins can promote users to admin';
  END IF;
  
  UPDATE public.user_roles
  SET role = 'admin'
  WHERE user_id = _target_user_id;
  
  RETURN FOUND;
END;
$$;

-- =====================================================
-- SECURITY FIX: Tighten RLS policies for alerts/incidents
-- =====================================================

-- Drop overly permissive policies
DROP POLICY IF EXISTS "Authenticated users can view alerts" ON public.alerts;
DROP POLICY IF EXISTS "Authenticated users can view incidents" ON public.incidents;
DROP POLICY IF EXISTS "Authenticated users can view alert_incident_map" ON public.alert_incident_map;

-- Create role-based policies for alerts (only analysts and admins can view)
CREATE POLICY "Analysts and admins can view alerts"
ON public.alerts
FOR SELECT
TO authenticated
USING (
  public.has_role(auth.uid(), 'admin')
  OR public.has_role(auth.uid(), 'analyst')
);

-- Create role-based policies for incidents
CREATE POLICY "Analysts and admins can view incidents"
ON public.incidents
FOR SELECT
TO authenticated
USING (
  public.has_role(auth.uid(), 'admin')
  OR public.has_role(auth.uid(), 'analyst')
);

-- Create role-based policies for alert_incident_map
CREATE POLICY "Analysts and admins can view alert_incident_map"
ON public.alert_incident_map
FOR SELECT
TO authenticated
USING (
  public.has_role(auth.uid(), 'admin')
  OR public.has_role(auth.uid(), 'analyst')
);