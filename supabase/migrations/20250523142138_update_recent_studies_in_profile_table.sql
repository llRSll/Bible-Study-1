-- First, create a temporary column to store the new JSONB data
ALTER TABLE public.profiles 
ADD COLUMN temp_recent_studies JSONB DEFAULT '[]'::jsonb;

-- Migrate existing data: For each profile, convert their recent_studies array
-- to the new JSONB format, using current timestamp for lastReadTime
DO $$
DECLARE
    profile_record RECORD;
    study_id TEXT;
    study_json JSONB;
    new_recent_studies JSONB := '[]'::jsonb;
BEGIN
    FOR profile_record IN SELECT id, recent_studies FROM public.profiles WHERE recent_studies IS NOT NULL AND array_length(recent_studies, 1) > 0 LOOP
        new_recent_studies := '[]'::jsonb;
        
        FOREACH study_id IN ARRAY profile_record.recent_studies LOOP
            -- Create a JSON object for each study with current timestamp
            study_json := jsonb_build_object(
                'studyId', study_id,
                'lastReadTime', now()
            );
            
            -- Add to the new array
            new_recent_studies := new_recent_studies || study_json;
        END LOOP;
        
        -- Update the profile with the new JSONB data
        UPDATE public.profiles
        SET temp_recent_studies = new_recent_studies
        WHERE id = profile_record.id;
    END LOOP;
END $$;

-- Drop the old column and rename the temporary one - FIXED: Split into separate statements
ALTER TABLE public.profiles DROP COLUMN recent_studies;
ALTER TABLE public.profiles RENAME COLUMN temp_recent_studies TO recent_studies;

-- Create index for faster access to recent studies data
CREATE INDEX idx_profiles_recent_studies ON public.profiles USING GIN (recent_studies);

-- Add migration comment
COMMENT ON COLUMN public.profiles."recent_studies" IS 'JSONB array of recently viewed studies with format: [{"studyId": "uuid", "lastReadTime": "timestamp"}, ...]';