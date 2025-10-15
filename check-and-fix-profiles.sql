-- Check current profiles table schema
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns
WHERE table_name = 'profiles'
ORDER BY ordinal_position;

-- Add missing columns if they don't exist
DO $$ 
BEGIN
    -- Add stripe_customer_id if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'profiles' AND column_name = 'stripe_customer_id'
    ) THEN
        ALTER TABLE profiles ADD COLUMN stripe_customer_id TEXT;
        CREATE INDEX IF NOT EXISTS idx_profiles_stripe_customer_id ON profiles(stripe_customer_id);
    END IF;

    -- Add stripe_subscription_id if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'profiles' AND column_name = 'stripe_subscription_id'
    ) THEN
        ALTER TABLE profiles ADD COLUMN stripe_subscription_id TEXT;
        CREATE INDEX IF NOT EXISTS idx_profiles_stripe_subscription_id ON profiles(stripe_subscription_id);
    END IF;

    -- Add email column if it doesn't exist (should exist from auth)
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'profiles' AND column_name = 'email'
    ) THEN
        ALTER TABLE profiles ADD COLUMN email TEXT;
        CREATE INDEX IF NOT EXISTS idx_profiles_email ON profiles(email);
    END IF;

    -- Add updated_at if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'profiles' AND column_name = 'updated_at'
    ) THEN
        ALTER TABLE profiles ADD COLUMN updated_at TIMESTAMPTZ DEFAULT NOW();
    END IF;
END $$;

-- Verify the additions
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'profiles' 
  AND column_name IN ('stripe_customer_id', 'stripe_subscription_id', 'email', 'subscription_tier', 'current_tokens', 'updated_at')
ORDER BY column_name;

-- Check for any profiles with subscription data
SELECT 
    id,
    email,
    subscription_tier,
    stripe_customer_id,
    stripe_subscription_id,
    current_tokens
FROM profiles
ORDER BY created_at DESC
LIMIT 10;

