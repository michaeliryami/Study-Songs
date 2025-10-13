# Stripe Integration Debug & Setup Guide

## Problem: Webhook not updating Supabase after payment

### Root Causes:
1. **Webhook endpoint not properly configured** - Stripe can't reach your localhost
2. **Missing checkout.session.completed event** - We're only listening for subscription events
3. **Email matching issue** - Profile lookup might be failing
4. **Missing customer name** - Not setting name in customer creation

---

## Solution Steps

### 1. Test Webhooks Locally with Stripe CLI

Since you're in sandbox/test mode, you need the Stripe CLI to forward webhooks to localhost:

```bash
# Install Stripe CLI (if not already installed)
# Mac:
brew install stripe/stripe-cli/stripe

# Windows:
scoop bucket add stripe https://github.com/stripe/scoop-stripe-cli.git
scoop install stripe

# Login to Stripe
stripe login

# Forward webhooks to your local server
stripe listen --forward-to http://localhost:3000/api/webhooks/stripe
```

**Important:** When you run `stripe listen`, it will give you a webhook signing secret like `whsec_xxxxx`. 

**Copy this and add it to your `.env.local`:**
```
STRIPE_WEBHOOK_SECRET=whsec_xxxxxxxxxxxxx
```

Then restart your Next.js dev server.

---

### 2. Verify Your Environment Variables

Make sure your `.env.local` has ALL of these:

```bash
# Stripe Keys
STRIPE_SECRET_KEY=sk_test_xxxxx
STRIPE_WEBHOOK_SECRET=whsec_xxxxx  # From stripe listen command

# Price IDs (from Stripe Dashboard > Products)
NEXT_PUBLIC_STRIPE_BASIC_MONTHLY_PRICE_ID=price_xxxxx
NEXT_PUBLIC_STRIPE_BASIC_YEARLY_PRICE_ID=price_xxxxx
NEXT_PUBLIC_STRIPE_PREMIUM_MONTHLY_PRICE_ID=price_xxxxx
NEXT_PUBLIC_STRIPE_PREMIUM_YEARLY_PRICE_ID=price_xxxxx

# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJxxxx
SUPABASE_SERVICE_ROLE_KEY=eyJxxxx
```

---

### 3. Test the Flow

1. **Start your dev server:** `npm run dev`
2. **In another terminal, start Stripe CLI:** `stripe listen --forward-to http://localhost:3000/api/webhooks/stripe`
3. **Go to** http://localhost:3000/pricing
4. **Click "Subscribe" on Basic plan**
5. **Use Stripe test card:** `4242 4242 4242 4242`, any future expiry, any CVC
6. **Complete checkout**

---

### 4. Check the Logs

**In your Stripe CLI terminal, you should see:**
```
Ready! Your webhook signing secret is whsec_xxxxx
[200] POST /api/webhooks/stripe [evt_xxxxx]
```

**In your Next.js terminal, you should see:**
```
Stripe webhook event: checkout.session.completed
Stripe webhook event: customer.subscription.created
Subscription updated for user@email.com: basic (active)
```

**In Supabase**, check your `profiles` table - the user's row should now have:
- `subscription_tier`: `'basic'`
- `stripe_customer_id`: `'cus_xxxxx'`
- `stripe_subscription_id`: `'sub_xxxxx'`

---

### 5. Common Issues

**Issue: "Invalid signature" error**
- Solution: Make sure `STRIPE_WEBHOOK_SECRET` in `.env.local` matches the one from `stripe listen`
- Restart your dev server after updating `.env.local`

**Issue: Webhook events received but Supabase not updating**
- Check the terminal logs for errors
- Verify your `SUPABASE_SERVICE_ROLE_KEY` is correct
- Check that your `profiles` table has the columns: `email`, `subscription_tier`, `stripe_customer_id`, `stripe_subscription_id`

**Issue: "No email found for customer"**
- The customer email should match the user's email in Supabase exactly
- Check Stripe Dashboard > Customers to verify the email was set

**Issue: Still showing as free tier after payment**
- Check browser console for errors
- Hard refresh the page (Cmd+Shift+R / Ctrl+Shift+F5)
- The `useSubscription` hook needs to fetch the updated tier

---

## For Production Deployment (Vercel)

When you deploy to Vercel:

1. **Get your production webhook secret:**
   - Go to Stripe Dashboard > Developers > Webhooks
   - Click "Add endpoint"
   - URL: `https://yourdomain.vercel.app/api/webhooks/stripe`
   - Events to send: Select all `checkout.session.*`, `customer.subscription.*`, and `invoice.*` events
   - Copy the webhook signing secret

2. **Add to Vercel environment variables:**
   - Go to Vercel Dashboard > Your Project > Settings > Environment Variables
   - Add `STRIPE_WEBHOOK_SECRET` with the production webhook secret
   - Redeploy

---

## Quick Test Command

To trigger a test webhook event manually:
```bash
stripe trigger checkout.session.completed
```

This will simulate a successful checkout.

