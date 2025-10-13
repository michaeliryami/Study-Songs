-- Add tokens system to profiles table
-- Run this in Supabase SQL Editor

-- 1. Add tokens column
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS current_tokens INTEGER DEFAULT 30;

-- 2. Add tokens_reset_date for monthly resets
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS tokens_reset_date TIMESTAMP WITH TIME ZONE DEFAULT NULL;

-- 3. Add index for faster queries
CREATE INDEX IF NOT EXISTS idx_profiles_current_tokens 
ON profiles(current_tokens);

-- 4. Set initial tokens for existing users based on their subscription tier
UPDATE profiles 
SET 
  current_tokens = CASE 
    WHEN subscription_tier = 'free' THEN 30
    WHEN subscription_tier = 'basic' THEN 300
    WHEN subscription_tier = 'premium' THEN 999999  -- Unlimited
    ELSE 30
  END,
  tokens_reset_date = CASE 
    WHEN subscription_tier IN ('basic', 'premium') THEN 
      DATE_TRUNC('month', CURRENT_DATE) + INTERVAL '1 month'  -- Next month
    ELSE NULL
  END;

-- 5. Create function to reset monthly tokens
CREATE OR REPLACE FUNCTION reset_monthly_tokens()
RETURNS void AS $$
BEGIN
  -- Reset tokens for basic and premium users on the 1st of each month
  UPDATE profiles 
  SET 
    current_tokens = CASE 
      WHEN subscription_tier = 'basic' THEN 300
      WHEN subscription_tier = 'premium' THEN 999999
      ELSE current_tokens  -- Don't change free users
    END,
    tokens_reset_date = DATE_TRUNC('month', CURRENT_DATE) + INTERVAL '1 month'
  WHERE 
    subscription_tier IN ('basic', 'premium') 
    AND (tokens_reset_date IS NULL OR tokens_reset_date <= CURRENT_DATE);
END;
$$ LANGUAGE plpgsql;

-- 6. Create a scheduled job to run monthly (optional - you can also call this manually)
-- Note: Supabase doesn't have built-in cron, but you can:
-- 1. Call this function manually on the 1st of each month
-- 2. Set up a cron job on your server
-- 3. Use a service like GitHub Actions to call your API endpoint

-- 7. Verify the setup
SELECT 
  id,
  email,
  subscription_tier,
  current_tokens,
  tokens_reset_date
FROM profiles
LIMIT 5;

-- Success! Your tokens system is ready.
-- Free users: 30 tokens (no reset)
-- Basic users: 300 tokens (resets monthly)
-- Premium users: 999999 tokens (unlimited)
