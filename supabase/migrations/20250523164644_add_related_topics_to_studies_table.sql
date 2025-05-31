-- Add relatedTopics field as an array of strings to the studies table
ALTER TABLE public.studies
ADD COLUMN "relatedTopics" TEXT[] NOT NULL DEFAULT '{}';

-- Create a GIN index for efficient searches by topic
CREATE INDEX idx_studies_related_topics ON public.studies USING GIN ("relatedTopics");

-- Add migration comment
COMMENT ON COLUMN public.studies."relatedTopics" IS 'Array of topics related to the study for improved filtering and search capabilities';