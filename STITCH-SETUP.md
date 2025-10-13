# Audio Stitching Setup

## ✅ What Was Done

Fixed the audio stitching feature to store stitched audio URLs in a dedicated `stitch` column in the `sets` table.

## 🔧 Database Setup Required

Run this SQL in your Supabase SQL Editor:

```sql
-- Add stitch column to sets table
ALTER TABLE sets 
ADD COLUMN IF NOT EXISTS stitch TEXT;

-- Add comment to explain the column
COMMENT ON COLUMN sets.stitch IS 'URL of the stitched audio file (all jingles combined into one MP3)';
```

## 📝 How It Works

1. **Premium users** see a green "Stitch All" button next to "Download MP3"
2. Click "Stitch All" to combine all jingles into one continuous MP3
3. Audio is uploaded to Supabase Storage (`audio-files` bucket)
4. URL is saved to the `stitch` column in the `sets` table
5. Button changes to "Download Stitch" after stitching is complete
6. Click "Download Stitch" to download the combined MP3

## 🎯 Features

- ✅ Premium-only feature
- ✅ Combines all jingles in a study set into one MP3
- ✅ Stores permanently in Supabase Storage
- ✅ Simple button interface
- ✅ Automatic re-stitching if needed
- ✅ Download functionality

## 🗂️ Database Schema

```
sets table:
  - id (integer)
  - subject (text)
  - jingles (jsonb) - array of jingle objects
  - stitch (text) - URL of stitched audio file
  - created_by (uuid)
  - created_at (timestamp)
```

## 🔍 Files Modified

1. `/app/api/stitch-audio/route.ts` - API endpoint for stitching
2. `/app/components/FlashcardPlayer.tsx` - UI and download functionality
3. `add-stitch-column.sql` - SQL script to add the column

## 🚀 Testing

1. Run the SQL script in Supabase
2. Create a study set with multiple jingles
3. Open the study set (as a premium user)
4. Click "Stitch All" button
5. Wait for stitching to complete
6. Click "Download Stitch" to download the combined MP3

## 💡 Notes

- Only premium users can stitch audio
- Free and basic users won't see the stitch button
- Stitched audio is stored permanently
- Can re-stitch if needed (overwrites previous stitch)

