# Stripe Webhook Debugging Guide

## Issue: Subscription IDs Not Syncing to Database

### Symptoms
- Stripe subscription completes successfully
- Database `subscription_tier` not updating
- `stripe_customer_id` and `stripe_subscription_id` remain NULL

## Step 1: Verify Database Schema

Run the SQL script to check and fix your profiles table:

```bash
# In Supabase SQL Editor, run:
check-and-fix-profiles.sql
```

**Required columns:**
- `stripe_customer_id` (TEXT)
- `stripe_subscription_id` (TEXT)
- `subscription_tier` (TEXT with check constraint)
- `email` (TEXT, indexed)
- `current_tokens` (INTEGER)
- `updated_at` (TIMESTAMPTZ)

## Step 2: Check Webhook Configuration

### Verify Webhook Secret
1. Go to Stripe Dashboard → Developers → Webhooks
2. Click on your webhook endpoint
3. Copy the **Signing secret**
4. Verify it matches your `.env.local` and Vercel environment variables:
   ```
   STRIPE_WEBHOOK_SECRET=whsec_xxxxxxxxxxxxx
   ```

### Required Webhook Events
Make sure these events are enabled:
- ✅ `checkout.session.completed`
- ✅ `customer.subscription.created`
- ✅ `customer.subscription.updated`
- ✅ `customer.subscription.deleted`
- ✅ `invoice.payment_succeeded`
- ✅ `invoice.payment_failed`

## Step 3: Check Webhook Logs

### In Stripe Dashboard
1. Go to **Developers → Webhooks**
2. Click on your webhook endpoint
3. Check **Recent deliveries**
4. Look for failed deliveries or error responses

### Common Errors
- **401 Unauthorized**: Webhook secret mismatch
- **500 Internal Server Error**: Database or API error
- **No response**: Webhook URL incorrect or server down

## Step 4: Check Vercel Logs

```bash
# View real-time logs
vercel logs --follow

# Or in Vercel Dashboard:
# Project → Deployments → [Latest] → Runtime Logs
```

Look for:
- ✅ `🎯 Processing checkout.session.completed:`
- ✅ `✅ SUCCESS! Updated [email] to [tier] tier`
- ❌ `❌ Error updating profile after checkout:`
- ❌ `❌ No profile found to update!`

## Step 5: Test Webhook Locally

### Using Stripe CLI

```bash
# Install Stripe CLI
brew install stripe/stripe-cli/stripe

# Login
stripe login

# Forward webhooks to local server
stripe listen --forward-to localhost:3000/api/webhooks/stripe

# In another terminal, trigger a test event
stripe trigger checkout.session.completed
```

### Check Console Output
You should see detailed logs in your terminal:
```
🎯 Processing checkout.session.completed: cs_test_xxx
Session metadata: { supabase_user_id: 'xxx', user_email: 'xxx' }
Customer ID: cus_xxx
Subscription ID: sub_xxx
📧 Checkout completed for user@email.com
Determined tier: premium
✅ SUCCESS! Updated user@email.com to premium tier
```

## Step 6: Verify Environment Variables

### Required in Vercel

```bash
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJxxx
SUPABASE_SERVICE_ROLE_KEY=eyJxxx
STRIPE_SECRET_KEY=sk_live_xxx or sk_test_xxx
STRIPE_WEBHOOK_SECRET=whsec_xxx
NEXT_PUBLIC_STRIPE_BASIC_MONTHLY_PRICE_ID=price_xxx
NEXT_PUBLIC_STRIPE_BASIC_YEARLY_PRICE_ID=price_xxx
NEXT_PUBLIC_STRIPE_PREMIUM_MONTHLY_PRICE_ID=price_xxx
NEXT_PUBLIC_STRIPE_PREMIUM_YEARLY_PRICE_ID=price_xxx
```

### Common Issues
- ❌ Using test keys in production
- ❌ Wrong webhook secret (test vs live)
- ❌ Missing price IDs
- ❌ Service role key not set

## Step 7: Check Supabase RLS Policies

The webhook uses the **service role key** which bypasses RLS, but verify policies allow updates:

```sql
-- Check current policies
SELECT * FROM pg_policies WHERE tablename = 'profiles';

-- Service role should bypass RLS, but if issues persist:
ALTER TABLE profiles DISABLE ROW LEVEL SECURITY;
-- Test webhook
-- Then re-enable:
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
```

## Step 8: Manual Verification Query

After a subscription, run this in Supabase SQL Editor:

```sql
-- Check if profile exists
SELECT id, email, subscription_tier, stripe_customer_id, stripe_subscription_id
FROM profiles
WHERE email = 'your-test-email@example.com';

-- Check if customer ID matches Stripe
SELECT id, email, stripe_customer_id, stripe_subscription_id
FROM profiles
WHERE stripe_customer_id = 'cus_XXXXXXXXXXXX';
```

## Step 9: Common Issues & Solutions

### Issue: Profile Not Found
**Symptoms:** `❌ No profile found to update!`

**Solutions:**
1. Check if user completed sign-up (profile created)
2. Verify email in Stripe matches Supabase auth email
3. Check if `supabase_user_id` metadata is set in checkout session

### Issue: Stripe IDs Not Saving
**Symptoms:** IDs remain NULL even though logs show success

**Solutions:**
1. Run `check-and-fix-profiles.sql` to add missing columns
2. Check column data types (should be TEXT, not UUID)
3. Verify no database triggers blocking updates

### Issue: Tier Not Updating
**Symptoms:** Tier remains 'free' after subscription

**Solutions:**
1. Verify price IDs in environment variables match Stripe
2. Check webhook receives `customer.subscription.updated` event
3. Ensure check constraint allows 'basic' and 'premium' values

## Step 10: Force Sync (Emergency Fix)

If webhook fails, manually sync from Stripe:

```bash
# POST to sync endpoint with user email
curl -X POST https://your-domain.com/api/sync-subscription \
  -H "Content-Type: application/json" \
  -d '{"email": "user@example.com"}'
```

Or use the profile page "Sync Subscription" button (if implemented).

## Debugging Checklist

- [ ] Database has all required columns
- [ ] Webhook secret is correct in environment variables
- [ ] Webhook endpoint is reachable (check Stripe dashboard)
- [ ] All required events are enabled in Stripe
- [ ] Price IDs match in environment variables
- [ ] Service role key is set and valid
- [ ] Vercel logs show webhook processing
- [ ] Profile exists in database before checkout
- [ ] Email in Stripe matches email in Supabase
- [ ] RLS policies allow updates (or service role bypasses)
- [ ] No database constraints blocking tier values

## Quick Test

1. **Create test subscription** in Stripe test mode
2. **Check Stripe webhook logs** for delivery success
3. **Check Vercel logs** for processing success
4. **Query Supabase** for updated profile
5. If any step fails, investigate that specific area

## Need More Help?

Check the webhook handler code at:
- `/app/api/webhooks/stripe/route.ts` - Main webhook logic
- `/app/api/create-checkout-session/route.ts` - Checkout creation
- `/app/api/create-portal-session/route.ts` - Customer portal

Look for error messages in:
- Stripe Dashboard → Webhook logs
- Vercel Dashboard → Runtime logs
- Browser Console → Network tab (for checkout errors)

