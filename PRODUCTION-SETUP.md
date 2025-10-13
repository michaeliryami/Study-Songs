# 🚀 Production Setup - Automatic Subscriptions

## One-Time Setup (Do This Once)

### 1. Fix Database Constraint ✅

**Run this in Supabase SQL Editor (you need to do this now):**

```sql
-- Allow 'free', 'basic', and 'premium' values
ALTER TABLE profiles 
DROP CONSTRAINT IF EXISTS profiles_subscription_tier_check;

ALTER TABLE profiles 
ADD CONSTRAINT profiles_subscription_tier_check 
CHECK (subscription_tier IN ('free', 'basic', 'premium'));
```

This is a **one-time fix**. After this, all future subscriptions will work automatically.

---

## For Local Development (Testing)

To test subscriptions locally, you need Stripe CLI to forward webhooks to localhost:

### Setup (One Time):
```bash
# Install Stripe CLI
brew install stripe/stripe-cli/stripe

# Login
stripe login
```

### Every Time You Develop:

**Terminal 1:**
```bash
npm run dev
```

**Terminal 2:**
```bash
stripe listen --forward-to http://localhost:3000/api/webhooks/stripe
```

Copy the `whsec_xxxxx` secret from Terminal 2 and add to `.env.local`:
```
STRIPE_WEBHOOK_SECRET=whsec_xxxxxxxxxxxxx
```

Then restart Terminal 1.

Now when you test checkout locally:
1. ✅ Payment completes
2. ✅ Stripe sends webhook to localhost (via Stripe CLI)
3. ✅ Your app receives `checkout.session.completed` event
4. ✅ Database updates automatically
5. ✅ User sees their new tier immediately

---

## For Production (Vercel) - Fully Automatic! 🎉

Once deployed to production, webhooks work **automatically** without any extra tools.

### Step 1: Deploy to Vercel

```bash
# Push to GitHub
git add .
git commit -m "Add Stripe subscription system"
git push

# Deploy to Vercel (if connected to GitHub, deploys automatically)
```

### Step 2: Add Environment Variables in Vercel

Go to Vercel Dashboard > Your Project > Settings > Environment Variables

Add these (same as your `.env.local` but without the test webhook secret):

```bash
STRIPE_SECRET_KEY=sk_live_xxxxx  # Use LIVE key for production
NEXT_PUBLIC_STRIPE_BASIC_MONTHLY_PRICE_ID=price_xxxxx
NEXT_PUBLIC_STRIPE_BASIC_YEARLY_PRICE_ID=price_xxxxx
NEXT_PUBLIC_STRIPE_PREMIUM_MONTHLY_PRICE_ID=price_xxxxx
NEXT_PUBLIC_STRIPE_PREMIUM_YEARLY_PRICE_ID=price_xxxxx
NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJxxxx
SUPABASE_SERVICE_ROLE_KEY=eyJxxxx
# Don't add STRIPE_WEBHOOK_SECRET yet - we'll get it from Stripe
```

**Redeploy** after adding env vars.

### Step 3: Create Webhook in Stripe Dashboard

1. **Go to Stripe Dashboard** (use live mode, not test mode)
2. **Developers > Webhooks**
3. **Click "Add endpoint"**

**Endpoint details:**
- **URL**: `https://yourdomain.vercel.app/api/webhooks/stripe`
  (Replace `yourdomain` with your actual Vercel URL)
- **Description**: Production webhook for subscription updates
- **Events to send**: Select these events:
  - ✅ `checkout.session.completed`
  - ✅ `customer.subscription.created`
  - ✅ `customer.subscription.updated`
  - ✅ `customer.subscription.deleted`
  - ✅ `invoice.payment_succeeded`
  - ✅ `invoice.payment_failed`

4. **Click "Add endpoint"**

5. **Copy the webhook signing secret** (starts with `whsec_`)

### Step 4: Add Webhook Secret to Vercel

1. Go back to **Vercel Dashboard > Settings > Environment Variables**
2. Add:
   ```
   STRIPE_WEBHOOK_SECRET=whsec_xxxxx  # The production secret from step 3
   ```
3. **Redeploy** (this is important!)

---

## ✅ How It Works Automatically in Production

### User Journey:
1. **User visits** `yourdomain.vercel.app/pricing`
2. **Clicks "Subscribe"** on Basic plan
3. **Enters payment info** on Stripe Checkout
4. **Completes payment**

### What Happens Behind the Scenes (Automatic):
1. ✅ Stripe processes payment
2. ✅ Stripe creates subscription
3. ✅ **Stripe sends webhook to your Vercel app**
4. ✅ Your webhook handler receives `checkout.session.completed`
5. ✅ Handler fetches subscription details
6. ✅ **Updates Supabase** `profiles` table with:
   - `subscription_tier`: `'basic'`
   - `stripe_customer_id`: `'cus_xxxxx'`
   - `stripe_subscription_id`: `'sub_xxxxx'`
7. ✅ User redirected to `/profile?success=true`
8. ✅ **Profile page shows new tier automatically**

**No manual intervention needed!**

---

## 🧪 Testing in Production

### Test with Stripe Test Mode:

You can test in production using Stripe test mode:

1. Create a **second webhook** in Stripe (Test mode)
   - URL: Same as production
   - Use test mode webhook secret
   - Add test secret to Vercel as `STRIPE_WEBHOOK_SECRET`

2. Use **test price IDs** in your env vars

3. Test with card: `4242 4242 4242 4242`

### Verify It Works:

1. **Check Stripe Dashboard > Events**
   - Should show webhook sent successfully
   - Status: `200 OK`

2. **Check Vercel Logs**
   - Go to Vercel Dashboard > Your Project > Deployments > [Latest] > Runtime Logs
   - Should see: `🎯 Processing checkout.session.completed`
   - Should see: `✅ SUCCESS! Updated email@example.com to basic tier`

3. **Check Supabase**
   - Table Editor > `profiles`
   - Find user, should have `subscription_tier: 'basic'`

---

## 🚨 Troubleshooting Production

### Issue: Webhook shows "Failed" in Stripe

**Check Vercel Logs:**
```
Vercel Dashboard > Deployments > Latest > Runtime Logs
```

Look for errors in the webhook handler.

**Common issues:**
- ❌ Wrong `STRIPE_WEBHOOK_SECRET` - signature verification fails
- ❌ Missing `SUPABASE_SERVICE_ROLE_KEY` - can't update database
- ❌ Database constraint not fixed - same error we had locally

### Issue: Webhook succeeds but database not updating

**Check the logs for:**
- "No profile found to update"
  - User email might not match
  - Check Supabase `profiles` table for exact email

### Issue: User still sees "Free Tier"

1. **Hard refresh** the page (Cmd+Shift+R / Ctrl+F5)
2. Check Supabase - is tier actually updated?
3. Check browser console for errors

---

## 📊 Monitoring in Production

### Stripe Dashboard > Developers > Webhooks
- Shows success/failure rate
- Click webhook to see recent attempts
- Click individual event to see request/response

### Vercel Logs
- Real-time logs of webhook processing
- Shows our detailed emoji logs (🎯 📧 ✅)

### Supabase
- Table Editor to verify data
- Can add an index on `stripe_customer_id` for faster lookups:
  ```sql
  CREATE INDEX idx_profiles_stripe_customer_id 
  ON profiles(stripe_customer_id);
  ```

---

## 🎯 Summary

### Local Development:
- ❌ Webhooks DON'T work without Stripe CLI
- ✅ Run `stripe listen` in Terminal 2
- ✅ Copy webhook secret to `.env.local`
- ✅ Restart dev server

### Production (Vercel):
- ✅ Webhooks work AUTOMATICALLY
- ✅ No extra tools needed
- ✅ Just need webhook endpoint configured in Stripe Dashboard
- ✅ Add production webhook secret to Vercel env vars
- ✅ Redeploy

### One-Time Database Fix:
```sql
ALTER TABLE profiles 
DROP CONSTRAINT IF EXISTS profiles_subscription_tier_check;

ALTER TABLE profiles 
ADD CONSTRAINT profiles_subscription_tier_check 
CHECK (subscription_tier IN ('free', 'basic', 'premium'));
```

**After this setup, subscriptions work 100% automatically in production!** 🚀

