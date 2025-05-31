-- Add first_login column to profiles table
ALTER TABLE public.profiles
ADD COLUMN first_login BOOLEAN DEFAULT TRUE;

-- Update existing profiles to have first_login set to false
-- since they have already logged in before
UPDATE public.profiles
SET first_login = FALSE;

-- Update the handle_new_user function to set first_login to true for new users
CREATE OR REPLACE FUNCTION public.handle_new_user() 
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, saved_studies, recent_studies, first_login)
  VALUES (NEW.id, NEW.email, '{}', '{}', TRUE);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER; 