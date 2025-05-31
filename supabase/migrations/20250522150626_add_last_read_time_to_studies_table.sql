-- Add lastReadTime column to studies table
ALTER TABLE public.studies 
ADD COLUMN "lastReadTime" TIMESTAMP WITH TIME ZONE DEFAULT NULL;

-- Create an index on lastReadTime for better performance when sorting
CREATE INDEX studies_last_read_time_idx ON public.studies ("lastReadTime");

-- Add a comment to explain the purpose of the column
COMMENT ON COLUMN public.studies."lastReadTime" IS 'Timestamp when the user last viewed this study';