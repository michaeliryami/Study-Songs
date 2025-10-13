-- Supabase Audio Storage Setup Script
-- Run this in your Supabase SQL Editor

-- 1. Create the audio files bucket
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'audio-files',
  'audio-files',
  true, -- Make bucket public for easy access
  10485760, -- 10MB file size limit
  ARRAY['audio/mpeg', 'audio/mp3', 'audio/wav', 'audio/ogg']
);

-- 2. Create policy to allow authenticated users to upload audio files
CREATE POLICY "Allow authenticated users to upload audio files" ON storage.objects
FOR INSERT WITH CHECK (
  bucket_id = 'audio-files' 
  AND auth.role() = 'authenticated'
);

-- 3. Create policy to allow authenticated users to update their own audio files
CREATE POLICY "Allow users to update their own audio files" ON storage.objects
FOR UPDATE USING (
  bucket_id = 'audio-files' 
  AND auth.role() = 'authenticated'
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- 4. Create policy to allow public read access to audio files
CREATE POLICY "Allow public read access to audio files" ON storage.objects
FOR SELECT USING (bucket_id = 'audio-files');

-- 5. Create policy to allow users to delete their own audio files
CREATE POLICY "Allow users to delete their own audio files" ON storage.objects
FOR DELETE USING (
  bucket_id = 'audio-files' 
  AND auth.role() = 'authenticated'
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- 6. Optional: Create a function to clean up old audio files (run periodically)
CREATE OR REPLACE FUNCTION cleanup_old_audio_files()
RETURNS void AS $$
BEGIN
  -- Delete files older than 30 days that are not referenced in the sets table
  DELETE FROM storage.objects 
  WHERE bucket_id = 'audio-files' 
  AND created_at < NOW() - INTERVAL '30 days'
  AND id NOT IN (
    SELECT DISTINCT jsonb_array_elements_text(
      jsonb_path_query_array(jingles, '$[*].supabaseAudioUrl')
    )::text
    FROM sets
    WHERE jingles IS NOT NULL
  );
END;
$$ LANGUAGE plpgsql;

-- 7. Create an index on the sets table for better performance when querying audio URLs
CREATE INDEX IF NOT EXISTS idx_sets_jingles_gin ON sets USING gin (jingles);

-- Note: The audio files will be stored with the following path structure:
-- audio-files/{user_id}/{timestamp}_{filename}.mp3
-- This allows for user-specific organization and easy cleanup
