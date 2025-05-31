-- Create daily_verses table
CREATE TABLE IF NOT EXISTS daily_verses (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    reference TEXT NOT NULL,
    text TEXT NOT NULL,
    translation TEXT NOT NULL,
    copyright TEXT,
    date DATE NOT NULL UNIQUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Add RLS policies
ALTER TABLE daily_verses ENABLE ROW LEVEL SECURITY;

-- Allow anyone to read daily verses
CREATE POLICY "Allow public read access to daily verses"
    ON daily_verses
    FOR SELECT
    TO public
    USING (true);

-- Only allow authenticated users to insert/update daily verses
CREATE POLICY "Allow authenticated users to insert daily verses"
    ON daily_verses
    FOR INSERT
    TO authenticated
    WITH CHECK (true);

CREATE POLICY "Allow authenticated users to update daily verses"
    ON daily_verses
    FOR UPDATE
    TO authenticated
    USING (true)
    WITH CHECK (true);

-- Create index on date for faster lookups
CREATE INDEX IF NOT EXISTS daily_verses_date_idx ON daily_verses (date);

-- Add trigger for updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = TIMEZONE('utc'::text, NOW());
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_daily_verses_updated_at
    BEFORE UPDATE ON daily_verses
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column(); 