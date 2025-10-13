# 🔧 Fix Database Constraint Error

## The Problem

Your Supabase `profiles` table has a check constraint on `subscription_tier` that doesn't allow the values `'basic'` or `'premium'`.

**Error:**
```
new row for relation "profiles" violates check constraint "profiles_subscription_tier_check"
```

This means your database has an old constraint that only allows certain values (probably just `'free'`), but our code is trying to set it to `'basic'`.

---

## The Fix (2 minutes)

### Step 1: Open Supabase SQL Editor

1. Go to your Supabase Dashboard
2. Click **SQL Editor** in the left sidebar
3. Click **New Query**

### Step 2: Run This SQL

Copy and paste this into the SQL Editor:

```sql
-- Drop the old constraint
ALTER TABLE profiles 
DROP CONSTRAINT IF EXISTS profiles_subscription_tier_check;

-- Add new constraint with correct values
ALTER TABLE profiles 
ADD CONSTRAINT profiles_subscription_tier_check 
CHECK (subscription_tier IN ('free', 'basic', 'premium'));
```

### Step 3: Click **RUN**

You should see: `Success. No rows returned`

---

## Now Try the Fix Tool Again

1. Go back to: http://localhost:3000/fix-subscription
2. Click **"Fix Subscription Now"**
3. It should work now! ✅

---

## What This Does

The SQL command:
1. **Drops** the old constraint (that was too restrictive)
2. **Adds** a new constraint that allows: `'free'`, `'basic'`, `'premium'`

This matches what our Stripe integration expects.

---

## Why This Happened

When you first created the `profiles` table, you probably added `subscription_tier` with a constraint like:

```sql
CHECK (subscription_tier = 'free')
```

or

```sql
CHECK (subscription_tier IN ('free'))
```

This only allowed the value `'free'`. Our Stripe integration needs to also allow `'basic'` and `'premium'`.

---

## Verify It Worked

After running the SQL, you can verify the constraint was updated:

```sql
SELECT conname, pg_get_constraintdef(oid) 
FROM pg_constraint 
WHERE conrelid = 'profiles'::regclass 
  AND contype = 'c'
  AND conname = 'profiles_subscription_tier_check';
```

You should see:
```
CHECK ((subscription_tier = ANY (ARRAY['free'::text, 'basic'::text, 'premium'::text])))
```

---

## Alternative: Remove Constraint Entirely (Not Recommended)

If you want to remove the constraint entirely (not recommended):

```sql
ALTER TABLE profiles 
DROP CONSTRAINT IF EXISTS profiles_subscription_tier_check;
```

But it's better to keep the constraint with the correct values to prevent invalid data.

---

## Next Steps

After fixing the constraint:
1. ✅ Run the fix tool: http://localhost:3000/fix-subscription
2. ✅ Your subscription should update successfully
3. ✅ Go to your profile page and see your tier!

🎉 Done!

