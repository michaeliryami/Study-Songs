# 🚨 IMMEDIATE FIX - You Already Paid But Subscription Not Linked

## What Happened

You successfully:
- ✅ Created a Stripe customer (`cus_TEKwi6ESt7DfTm`)
- ✅ Completed checkout and paid
- ✅ Have an active subscription in Stripe

But the webhook didn't update your Supabase profile with the subscription ID because:
- ❌ Stripe CLI wasn't running to forward webhooks to localhost
- ❌ `subscription_id` is NULL in your database

---

## Quick Fix (30 seconds)

### Option 1: Use the Fix Tool

1. **Make sure dev server is running:**
   ```bash
   npm run dev
   ```

2. **Open in browser:**
   ```
   http://localhost:3000/fix-subscription
   ```

3. **Click "Fix Subscription Now"**

4. **Refresh your profile page:**
   ```
   http://localhost:3000/profile
   ```

You should now see your subscription tier updated! ✅

---

## Option 2: Manual SQL Fix

Go to Supabase SQL Editor and run:

```sql
-- First, find your user
SELECT id, email, stripe_customer_id, subscription_tier 
FROM profiles 
WHERE stripe_customer_id = 'cus_TEKwi6ESt7DfTm';

-- Update with your actual subscription ID from Stripe Dashboard
UPDATE profiles 
SET 
  subscription_tier = 'basic',  -- or 'premium' if you bought that
  stripe_subscription_id = 'sub_XXXXXXXXXX'  -- Get this from Stripe Dashboard
WHERE stripe_customer_id = 'cus_TEKwi6ESt7DfTm';
```

To get your `sub_XXXXXXXXXX`:
1. Go to Stripe Dashboard
2. Click "Customers"
3. Find your customer (`cus_TEKwi6ESt7DfTm`)
4. Copy the subscription ID (starts with `sub_`)

---

## Why This Happened

**Webhooks can't reach localhost** without the Stripe CLI running.

When you completed checkout:
1. ✅ Stripe processed payment
2. ✅ Created customer
3. ✅ Created subscription
4. ❌ **Webhook tried to notify your app but couldn't reach localhost**
5. ❌ Supabase never got updated

---

## How to Prevent This Next Time

### For Local Testing:

**Always run Stripe CLI in a second terminal:**

```bash
# Terminal 1
npm run dev

# Terminal 2 (NEW - keep this running)
stripe listen --forward-to http://localhost:3000/api/webhooks/stripe
```

Copy the `whsec_` secret from Terminal 2 and add to `.env.local`:
```
STRIPE_WEBHOOK_SECRET=whsec_xxxxxxxxxxxxx
```

Restart Terminal 1.

---

### For Production (Vercel):

Webhooks will work automatically once you:
1. Deploy to Vercel
2. Add webhook endpoint in Stripe Dashboard:
   - URL: `https://yourdomain.vercel.app/api/webhooks/stripe`
   - Select events: `checkout.session.*`, `customer.subscription.*`, `invoice.*`
3. Add webhook secret to Vercel environment variables

---

## Test the Full Flow Correctly

Want to test the full flow with webhooks working?

1. **Cancel current subscription in Stripe:**
   - Stripe Dashboard > Customers > Find your customer > Cancel subscription

2. **Reset in Supabase:**
   ```sql
   UPDATE profiles 
   SET subscription_tier = 'free', 
       stripe_customer_id = NULL,
       stripe_subscription_id = NULL
   WHERE stripe_customer_id = 'cus_TEKwi6ESt7DfTm';
   ```

3. **Start Stripe CLI:**
   ```bash
   stripe listen --forward-to http://localhost:3000/api/webhooks/stripe
   ```

4. **Copy the `whsec_` secret to `.env.local`**

5. **Restart dev server**

6. **Try checkout again** - This time webhooks will work!

---

## Check If It Worked

After using the fix tool or manual SQL:

1. **Hard refresh profile page** (Cmd+Shift+R or Ctrl+F5)
2. Should show **"Basic Tier"** or **"Premium Tier"**
3. Should show your features
4. "Manage Subscription" button should work

---

## Still Having Issues?

Run the debug endpoint manually:

```bash
curl -X POST http://localhost:3000/api/debug-stripe \
  -H "Content-Type: application/json" \
  -d '{"customerId": "cus_TEKwi6ESt7DfTm"}'
```

This will show you exactly what Stripe has vs what Supabase has.

---

**Bottom line:** Your payment went through! The subscription exists in Stripe. We just need to link it to your Supabase profile, which the fix tool will do automatically. 🎉

