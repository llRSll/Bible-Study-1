-- Add isPublic field to the studies table
ALTER TABLE public.studies
ADD COLUMN "isPublic" BOOLEAN NOT NULL DEFAULT true;

-- Add an index for faster querying of public studies
CREATE INDEX idx_studies_is_public ON public.studies ("isPublic");

-- Add migration comment
COMMENT ON COLUMN public.studies."isPublic" IS 'Indicates whether the study is publicly viewable by other users';