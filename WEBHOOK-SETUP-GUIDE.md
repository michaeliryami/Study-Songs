# Stripe Webhook Setup Guide

## ✅ What's Configured

The webhook handler is now properly set up to handle subscription updates automatically. When a user upgrades/downgrades their plan through the Stripe Customer Portal, it will automatically update the database.

### Events Being Handled:
1. `customer.subscription.created` - New subscriptions
2. `customer.subscription.updated` - **Plan changes (upgrades/downgrades)**
3. `customer.subscription.deleted` - Cancellations
4. `checkout.session.completed` - Initial checkout
5. `invoice.payment_succeeded` - Successful payments
6. `invoice.payment_failed` - Failed payments

## 🔧 Setup Required

### 1. Configure Stripe Webhook in Dashboard

1. Go to: https://dashboard.stripe.com/webhooks
2. Click "Add endpoint"
3. Enter your webhook URL:
   - **Production**: `https://your-domain.com/api/webhooks/stripe`
   - **Development**: Use Stripe CLI (see below)
4. Select these events to listen to:
   - `customer.subscription.created`
   - `customer.subscription.updated` ⭐ (This is the key one!)
   - `customer.subscription.deleted`
   - `checkout.session.completed`
   - `invoice.payment_succeeded`
   - `invoice.payment_failed`
5. Copy the webhook signing secret

### 2. Add Environment Variable

Add to your `.env.local` and Vercel:
```
STRIPE_WEBHOOK_SECRET=whsec_xxxxxxxxxxxxx
```

### 3. Test Locally with Stripe CLI

```bash
# Install Stripe CLI
brew install stripe/stripe-cli/stripe

# Login
stripe login

# Forward webhooks to local server
stripe listen --forward-to localhost:3000/api/webhooks/stripe

# This will give you a webhook secret like: whsec_xxxxxxxxxxxxx
# Add it to your .env.local
```

## 🧪 Testing the Webhook

### Test Subscription Update:

1. Start your local server:
```bash
npm run dev
```

2. In another terminal, forward webhooks:
```bash
stripe listen --forward-to localhost:3000/api/webhooks/stripe
```

3. Create a test subscription in Stripe Dashboard or through your app

4. **Upgrade the subscription**:
   - Go to Stripe Dashboard > Customers
   - Find your test customer
   - Click on their subscription
   - Click "Update subscription"
   - Change to a different plan
   - Check your terminal logs

5. Check the logs for:
```
🔄 Processing subscription update: sub_xxxxx
Customer ID: cus_xxxxx
Price ID: price_xxxxx
Status: active
Determined tier: premium (or basic)
✅ Subscription updated successfully for [email]: premium (active)
```

### Test with Stripe CLI:

```bash
# Trigger a subscription update event
stripe trigger customer.subscription.updated
```

## 🐛 Troubleshooting

### Webhook not firing:

1. **Check webhook is registered** in Stripe Dashboard
2. **Verify webhook secret** is correct in environment variables
3. **Check Stripe CLI** is running (for local testing)
4. **Check logs** in Vercel or terminal

### Database not updating:

1. **Check environment variables** are set:
   - `NEXT_PUBLIC_STRIPE_BASIC_MONTHLY_PRICE_ID`
   - `NEXT_PUBLIC_STRIPE_BASIC_YEARLY_PRICE_ID`
   - `NEXT_PUBLIC_STRIPE_PREMIUM_MONTHLY_PRICE_ID`
   - `NEXT_PUBLIC_STRIPE_PREMIUM_YEARLY_PRICE_ID`

2. **Verify price IDs match** in the logs:
   - The webhook logs will show the price IDs
   - Compare with your Stripe Dashboard > Products

3. **Check Supabase permissions**:
   - Service role key is set
   - `profiles` table has required columns
   - No RLS blocking updates

### Still not working:

1. Check the webhook logs in Stripe Dashboard:
   - Go to: Developers > Webhooks
   - Click on your endpoint
   - View recent deliveries
   - Look for errors

2. Check your server logs (Vercel logs or terminal)

3. Verify the user's email in Supabase matches their Stripe customer email

## 📝 Important Notes

- The webhook uses **email** to match Stripe customers with Supabase profiles
- Make sure user emails are consistent between Stripe and Supabase
- The webhook automatically handles:
  - Upgrades (Basic → Premium)
  - Downgrades (Premium → Basic)
  - Cancellations (Any → Free)
  - Failed payments (Any → Free)
- Changes are instant - no manual sync needed!

## ✨ How It Works

1. User clicks "Manage Subscription" in your app
2. Redirected to Stripe Customer Portal
3. User changes their plan (e.g., Basic → Premium)
4. Stripe sends `customer.subscription.updated` webhook
5. Your app receives webhook and verifies signature
6. Extracts price ID and determines new tier
7. Updates Supabase `profiles` table
8. User's tier is immediately updated!

## 🔐 Security

- Webhook signature verification is enabled
- Only verified Stripe events are processed
- Service role key used for Supabase updates
- All sensitive keys in environment variables

