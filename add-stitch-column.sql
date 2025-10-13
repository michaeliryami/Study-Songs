-- Add stitch column to sets table for storing stitched audio URL
ALTER TABLE sets 
ADD COLUMN IF NOT EXISTS stitch TEXT;

-- Add comment to explain the column
COMMENT ON COLUMN sets.stitch IS 'URL of the stitched audio file (all jingles combined into one MP3)';

