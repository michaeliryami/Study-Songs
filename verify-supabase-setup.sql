-- Verify and Fix Supabase Setup for Stripe Integration
-- Run this in Supabase SQL Editor to ensure everything is correct

-- 1. Check if columns exist (this will show you what you have)
SELECT column_name, data_type, column_default 
FROM information_schema.columns 
WHERE table_name = 'profiles' 
  AND column_name IN ('subscription_tier', 'stripe_customer_id', 'stripe_subscription_id', 'email', 'id');

-- 2. Add missing columns if they don't exist
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS subscription_tier TEXT DEFAULT 'free';

ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS stripe_customer_id TEXT;

ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS stripe_subscription_id TEXT;

-- 3. Add index on stripe_customer_id for faster webhook lookups
CREATE INDEX IF NOT EXISTS idx_profiles_stripe_customer_id 
ON profiles(stripe_customer_id);

-- 4. Add index on email for faster lookups
CREATE INDEX IF NOT EXISTS idx_profiles_email 
ON profiles(email);

-- 5. Verify the setup
SELECT 
  id,
  email,
  subscription_tier,
  stripe_customer_id,
  stripe_subscription_id
FROM profiles
LIMIT 5;

-- 6. Show all users with active subscriptions (for debugging)
SELECT 
  id,
  email,
  subscription_tier,
  stripe_customer_id,
  stripe_subscription_id,
  created_at
FROM profiles
WHERE subscription_tier != 'free'
ORDER BY created_at DESC;

-- Success! Your database is ready for Stripe integration.

