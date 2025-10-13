# Stripe Integration Testing Checklist

## Before You Start

1. ✅ Make sure your `.env.local` has all required variables:
   ```bash
   STRIPE_SECRET_KEY=sk_test_xxxxx
   STRIPE_WEBHOOK_SECRET=whsec_xxxxx
   NEXT_PUBLIC_STRIPE_BASIC_MONTHLY_PRICE_ID=price_xxxxx
   NEXT_PUBLIC_STRIPE_BASIC_YEARLY_PRICE_ID=price_xxxxx
   NEXT_PUBLIC_STRIPE_PREMIUM_MONTHLY_PRICE_ID=price_xxxxx
   NEXT_PUBLIC_STRIPE_PREMIUM_YEARLY_PRICE_ID=price_xxxxx
   NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJxxxx
   SUPABASE_SERVICE_ROLE_KEY=eyJxxxx
   ```

2. ✅ Supabase `profiles` table has these columns:
   - `id` (uuid, primary key)
   - `email` (text)
   - `subscription_tier` (text, default: 'free')
   - `stripe_customer_id` (text, nullable)
   - `stripe_subscription_id` (text, nullable)

## Setup Stripe CLI (REQUIRED for local testing)

```bash
# Install Stripe CLI
brew install stripe/stripe-cli/stripe  # Mac
# or download from https://stripe.com/docs/stripe-cli

# Login
stripe login

# Forward webhooks to localhost
stripe listen --forward-to http://localhost:3000/api/webhooks/stripe
```

**IMPORTANT:** Copy the webhook signing secret (starts with `whsec_`) and add it to `.env.local` as `STRIPE_WEBHOOK_SECRET`

Then restart your dev server:
```bash
npm run dev
```

---

## Testing Flow

### Terminal 1: Dev Server
```bash
npm run dev
```

### Terminal 2: Stripe CLI
```bash
stripe listen --forward-to http://localhost:3000/api/webhooks/stripe
```

### Browser: Test Checkout

1. **Go to** http://localhost:3000/pricing
2. **Click "Subscribe"** on Basic plan
3. **Use test card:** 
   - Card: `4242 4242 4242 4242`
   - Expiry: Any future date (e.g., `12/34`)
   - CVC: Any 3 digits (e.g., `123`)
   - ZIP: Any 5 digits (e.g., `12345`)
4. **Complete checkout**
5. **You should be redirected to** `/profile?success=true`

---

## What to Check

### ✅ In Terminal 1 (Dev Server Logs):

You should see:
```
Created Stripe customer: cus_xxxxx for user@email.com
Created checkout session: cs_xxxxx for customer: cus_xxxxx
```

### ✅ In Terminal 2 (Stripe CLI):

You should see webhooks being received:
```
[200] POST /api/webhooks/stripe [evt_xxxxx]
  checkout.session.completed
[200] POST /api/webhooks/stripe [evt_xxxxx]
  customer.subscription.created
[200] POST /api/webhooks/stripe [evt_xxxxx]
  invoice.payment_succeeded
```

And detailed logs from our webhook handler:
```
🎯 Processing checkout.session.completed: cs_xxxxx
📧 Checkout completed for user@email.com, fetching subscription...
Determined tier: basic
✅ SUCCESS! Updated user@email.com to basic tier
```

### ✅ In Supabase Dashboard:

Go to Table Editor > `profiles` table and find your user's row.

You should see:
- `subscription_tier`: `basic` (or `premium`)
- `stripe_customer_id`: `cus_xxxxxxxxxxxxx`
- `stripe_subscription_id`: `sub_xxxxxxxxxxxxx`

### ✅ In Your App (Profile Page):

Refresh http://localhost:3000/profile

You should see:
- **Current Plan:** "Basic Tier" (or "Premium Tier")
- Your subscription features listed
- A "Manage Subscription" button

---

## Troubleshooting

### Issue: "Invalid signature" error in webhook

**Problem:** `STRIPE_WEBHOOK_SECRET` doesn't match

**Solution:**
1. Make sure you copied the `whsec_` secret from the `stripe listen` command
2. Update `.env.local`
3. Restart `npm run dev`

---

### Issue: Webhook received but Supabase not updating

**Check Terminal 2 for these logs:**
```
❌ No profile found to update! User ID: xxx Email: user@email.com
Profile check result: []
```

**This means the user's email in Stripe doesn't match Supabase.**

**Solution:**
1. Go to Supabase Dashboard > Table Editor > `profiles`
2. Find your user and note their exact email
3. Go to Stripe Dashboard > Customers
4. Find the customer and verify the email matches exactly (including case)

---

### Issue: Still showing "Free Tier" after payment

**Possible causes:**

1. **Webhook didn't fire** - Check Terminal 2
2. **Supabase update failed** - Check Terminal 1 for errors
3. **React state not refreshing** - Hard refresh the page (Cmd+Shift+R / Ctrl+F5)

**Debug:**
1. Check Supabase `profiles` table directly - does it show the correct tier?
2. If yes: It's a frontend caching issue, hard refresh
3. If no: Check webhook logs for errors

---

### Issue: "This customer has no attached payment method"

**Solution:** The test card was declined. Make sure you're using `4242 4242 4242 4242`

---

## Quick Reset for Re-testing

If you want to test the flow again:

1. **Cancel subscription in Stripe Dashboard:**
   - Go to Stripe Dashboard > Customers
   - Find your customer
   - Cancel the subscription

2. **Reset in Supabase:**
   ```sql
   UPDATE profiles 
   SET subscription_tier = 'free', 
       stripe_subscription_id = NULL 
   WHERE email = 'your-email@example.com';
   ```

3. **Test again**

---

## Success Criteria

✅ Checkout completes successfully
✅ Terminal 2 shows webhook events received
✅ Terminal 1 shows "✅ SUCCESS!" message
✅ Supabase `profiles` table updated correctly
✅ Profile page shows correct subscription tier
✅ "Manage Subscription" button works and opens Stripe portal

---

## Next Steps After Local Testing Works

Once everything works locally, deploy to Vercel:

1. Push your code to GitHub
2. Deploy to Vercel
3. Add environment variables in Vercel Dashboard
4. Set up production webhook in Stripe Dashboard:
   - URL: `https://yourdomain.vercel.app/api/webhooks/stripe`
   - Events: Select all `checkout.session.*`, `customer.subscription.*`, and `invoice.*`
5. Copy the webhook secret and add to Vercel environment variables
6. Redeploy

Done! 🎉

