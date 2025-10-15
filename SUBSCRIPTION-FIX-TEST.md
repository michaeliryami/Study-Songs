# Subscription ID Fix - Testing Guide

## What Was Fixed

### Problem
- Customer IDs were syncing ✅
- Subscription IDs were NOT syncing ❌
- This indicated the subscription object wasn't being properly retrieved from Stripe

### Solution Implemented

**1. Enhanced `checkout.session.completed` handler:**
- Added fallback to retrieve full session with expanded subscription
- Better error logging to identify missing subscription IDs
- Handles both string and object subscription responses

**2. New `customer.subscription.created` handler:**
- Separate handler specifically for new subscriptions
- This event **always** contains the full subscription object
- Triple fallback: tries user ID → email → customer ID
- More reliable than relying solely on checkout session

**3. Why This Works:**
- Stripe fires `customer.subscription.created` immediately after checkout completes
- This event contains the subscription ID directly in the event payload
- No need to expand or retrieve additional data
- Even if checkout.session.completed fails, this catches it

## Testing Steps

### 1. Deploy Changes
```bash
git add .
git commit -m "Fix subscription ID sync with dedicated subscription.created handler"
git push
```

### 2. Verify Webhook Events in Stripe

Go to: **Stripe Dashboard → Developers → Webhooks → Your endpoint**

Make sure these events are enabled:
- ✅ `checkout.session.completed`
- ✅ `customer.subscription.created` ← **THIS IS KEY**
- ✅ `customer.subscription.updated`
- ✅ `customer.subscription.deleted`
- ✅ `invoice.payment_succeeded`
- ✅ `invoice.payment_failed`

If `customer.subscription.created` is missing, **add it now!**

### 3. Create Test Subscription

1. Go to your pricing page
2. Select a plan
3. Use Stripe test card: `4242 4242 4242 4242`
4. Complete checkout

### 4. Check Vercel Logs

```bash
vercel logs --follow
```

You should see **TWO** webhook events:

**First: `checkout.session.completed`**
```
🎯 Processing checkout.session.completed: cs_xxxxx
✅ Customer ID: cus_xxxxx
✅ Subscription ID: sub_xxxxx
✅ SUCCESS! Updated user@email.com to premium tier
```

**Second: `customer.subscription.created`** (This is the new one!)
```
📢 New subscription created event
🆕 Processing NEW subscription created: sub_xxxxx
✓ Customer ID: cus_xxxxx
✓ Subscription ID: sub_xxxxx
✓ Determined tier: premium
✅ NEW SUBSCRIPTION! Updated user@email.com to premium tier with subscription sub_xxxxx
```

### 5. Verify in Database

Run this in Supabase SQL Editor:

```sql
SELECT 
    id,
    email,
    subscription_tier,
    stripe_customer_id,
    stripe_subscription_id,
    updated_at
FROM profiles
WHERE email = 'your-test-email@example.com';
```

**Expected Result:**
- `subscription_tier`: 'basic' or 'premium' ✅
- `stripe_customer_id`: 'cus_XXXXXXXXXXXX' ✅
- `stripe_subscription_id`: 'sub_XXXXXXXXXXXX' ✅ **THIS SHOULD NOW BE FILLED!**
- `updated_at`: Recent timestamp ✅

### 6. Test Plan Upgrades

1. Go to profile page
2. Click "Manage Subscription"
3. Upgrade from Basic to Premium (or vice versa)
4. Check logs for `customer.subscription.updated` event
5. Verify tier updates in database

## What Each Event Does

### `checkout.session.completed`
- Fires when checkout completes
- Contains customer ID and subscription ID (sometimes as reference)
- We now retrieve full subscription if ID not directly available

### `customer.subscription.created` ✨ NEW!
- Fires immediately when subscription is created
- **Always** contains full subscription object with ID
- Most reliable for initial subscription setup
- Fallback if checkout.session.completed doesn't have subscription ID

### `customer.subscription.updated`
- Fires when subscription changes (upgrade/downgrade)
- Updates tier based on new price ID
- Handles plan changes from customer portal

## Troubleshooting

### If Subscription ID Still NULL

**Check Stripe Webhook Events:**
1. Stripe Dashboard → Webhooks → Your endpoint
2. Make sure `customer.subscription.created` is enabled
3. Check "Recent deliveries" for any failed events

**Check Vercel Logs for:**
```
📢 New subscription created event
🆕 Processing NEW subscription created: sub_xxxxx
```

If you don't see this, the event isn't being sent!

### If You See This Error:
```
❌ No profile found for subscription!
```

**Possible causes:**
1. Email in Stripe doesn't match Supabase
2. Profile wasn't created before checkout
3. User ID metadata not set on customer

**Solution:** The new handler tries THREE ways to find the profile:
1. By user ID (from customer metadata)
2. By email
3. By stripe_customer_id (if already set)

### Manual Fix If Needed

If webhook fails, manually sync:

```sql
-- Get subscription ID from Stripe Dashboard, then:
UPDATE profiles
SET 
    stripe_subscription_id = 'sub_XXXXXXXXXXXX',
    subscription_tier = 'premium',  -- or 'basic'
    updated_at = NOW()
WHERE email = 'user@example.com';
```

## Expected Outcome

✅ **Customer ID syncs** (already working)  
✅ **Subscription ID syncs** (NEW - now working!)  
✅ **Tier updates automatically**  
✅ **Plan upgrades/downgrades work**  
✅ **All via webhooks, no manual intervention**

## Key Improvement

**Before:**
- Only relied on `checkout.session.completed`
- Subscription ID sometimes not included
- Had to expand/retrieve additional data

**After:**
- Dedicated `customer.subscription.created` handler
- This event ALWAYS has subscription ID
- More reliable, simpler logic
- Automatic fallback if checkout handler fails

The subscription ID will now sync properly! 🎉

