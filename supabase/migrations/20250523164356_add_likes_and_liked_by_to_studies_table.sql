-- Add likes and likedBy fields to the studies table
ALTER TABLE public.studies
ADD COLUMN "likes" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN "likedBy" UUID[] NOT NULL DEFAULT '{}';

-- Add an index for faster querying of popular studies
CREATE INDEX idx_studies_likes ON public.studies ("likes" DESC);

-- Add migration comment
COMMENT ON COLUMN public.studies."likes" IS 'Counter for the number of likes a study has received';
COMMENT ON COLUMN public.studies."likedBy" IS 'Array of user IDs who have liked this study';