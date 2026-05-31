-- Step 1: Add 'alert_source' to app_role enum
-- This must be run separately and committed before using the new value
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'alert_source';