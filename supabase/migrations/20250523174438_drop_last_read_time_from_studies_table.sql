-- Remove the lastReadTime column from studies table as it's now tracked per-user in profiles
-- First, ensure there are no constraints or dependencies on this column
ALTER TABLE public.studies 
DROP COLUMN IF EXISTS "lastReadTime";

-- Add a migration comment to document the change
COMMENT ON TABLE public.studies IS 'Study read times are now tracked per-user in the profiles.recent_studies JSONB field';