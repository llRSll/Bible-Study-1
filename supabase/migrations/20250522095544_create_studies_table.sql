-- Create studies table
CREATE TABLE public.studies (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title TEXT NOT NULL,
  verses TEXT[] NOT NULL,
  context TEXT,
  insights JSONB,
  application TEXT,
  category TEXT,
  read_time TEXT,
  related_questions JSONB,
  user_id UUID REFERENCES auth.users(id) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create a trigger to update the updated_at column
CREATE OR REPLACE FUNCTION public.update_modified_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_studies_updated_at
BEFORE UPDATE ON public.studies
FOR EACH ROW
EXECUTE FUNCTION public.update_modified_column();

-- Add row level security (RLS) policies
ALTER TABLE public.studies ENABLE ROW LEVEL SECURITY;

-- Create policy to allow users to see only their own studies
CREATE POLICY "Users can view their own studies"
  ON public.studies
  FOR SELECT
  USING (auth.uid() = user_id);

-- Create policy to allow users to insert their own studies
CREATE POLICY "Users can insert their own studies"
  ON public.studies
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Create policy to allow users to update their own studies
CREATE POLICY "Users can update their own studies"
  ON public.studies
  FOR UPDATE
  USING (auth.uid() = user_id);

-- Create policy to allow users to delete their own studies
CREATE POLICY "Users can delete their own studies"
  ON public.studies
  FOR DELETE
  USING (auth.uid() = user_id);