-- Add header_url column to profiles table
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS header_url TEXT;

-- Add comment explaining the column
COMMENT ON COLUMN profiles.header_url IS 'URL of the user''s profile header image'; 