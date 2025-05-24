-- This migration handles the specific error by forcibly removing problematic policies
-- The error occurs due to a policy with old/new references which isn't allowed in RLS policies

-- Drop the specific policy causing the issue
DO $$
BEGIN
  -- First check if the policy exists to avoid unnecessary errors
  IF EXISTS (
    SELECT 1 FROM pg_policy 
    WHERE polname = 'Users can update likes on any public study'
    AND polrelid = 'public.studies'::regclass
  ) THEN
    EXECUTE 'DROP POLICY "Users can update likes on any public study" ON public.studies';
  END IF;
END
$$; 