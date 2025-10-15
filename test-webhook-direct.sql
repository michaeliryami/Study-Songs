-- Direct SQL test to verify database can accept subscription IDs
-- Run this in Supabase SQL Editor

-- 1. Check current state of a test user
SELECT 
    id,
    email,
    subscription_tier,
    stripe_customer_id,
    stripe_subscription_id,
    created_at,
    updated_at
FROM profiles
WHERE email = 'YOUR_TEST_EMAIL@example.com';  -- Replace with your test email

-- 2. Try a direct update with test values (to see if column accepts data)
UPDATE profiles
SET 
    subscription_tier = 'premium',
    stripe_customer_id = 'cus_TEST123',
    stripe_subscription_id = 'sub_TEST123',
    updated_at = NOW()
WHERE email = 'YOUR_TEST_EMAIL@example.com';  -- Replace with your test email

-- 3. Verify the update worked
SELECT 
    id,
    email,
    subscription_tier,
    stripe_customer_id,
    stripe_subscription_id,
    updated_at
FROM profiles
WHERE email = 'YOUR_TEST_EMAIL@example.com';  -- Replace with your test email

-- 4. If it worked, check if there are any triggers or constraints
SELECT 
    trigger_name, 
    event_manipulation, 
    action_statement
FROM information_schema.triggers
WHERE event_object_table = 'profiles';

-- 5. Check for any column constraints
SELECT
    conname AS constraint_name,
    contype AS constraint_type,
    pg_get_constraintdef(oid) AS constraint_definition
FROM pg_constraint
WHERE conrelid = 'profiles'::regclass;

-- 6. Check actual column definitions
SELECT 
    column_name,
    data_type,
    character_maximum_length,
    is_nullable,
    column_default
FROM information_schema.columns
WHERE table_name = 'profiles'
    AND column_name IN ('stripe_customer_id', 'stripe_subscription_id', 'subscription_tier')
ORDER BY ordinal_position;

