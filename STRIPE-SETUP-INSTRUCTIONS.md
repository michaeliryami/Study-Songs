# Stripe Setup Instructions

Follow these steps to configure Stripe for your Study Songs application.

## 📋 Prerequisites

- A Stripe account (sign up at https://stripe.com)
- Access to your Stripe Dashboard
- Your Supabase project set up with the subscription schema

---

## 🔧 Step 1: Get Your Stripe API Keys

1. **Log into your Stripe Dashboard**: https://dashboard.stripe.com
2. **Navigate to**: Developers → API keys
3. **Copy your keys**:
   - **Secret key** (starts with `sk_test_` or `sk_live_`)
   - **Publishable key** (starts with `pk_test_` or `pk_live_`)

4. **Add to `.env.local`**:
```bash
STRIPE_SECRET_KEY=sk_test_51SHrVOHkzD1ku5rJFzvXs6UxsPkbSp6fjNwZpCgGTwsaIiJIe40tUavox6fUXHRRlcbK1p6iZTUv4lRhAS1KuOXr00cOgLNkb8
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_51SHrVOHkzD1ku5rJVProgGXdJh2hrvdSFKdHAB4X0Fb5oYQmxfnHzoDCpmXQWWhlbez0NmSYaq0weZfKY959RfCs00dnHZanuw
```

---

## 💳 Step 2: Create Products and Prices

### Create Products:

1. **Go to**: Products → Add product
2. **Create TWO products**:

#### Product 1: Basic Plan
- **Name**: `Basic Plan`
- **Description**: `Perfect for students getting started`
- Click **Save product**

#### Product 2: Premium Plan  
- **Name**: `Premium Plan`
- **Description**: `For power learners`
- Click **Save product**

### Create Prices for Each Product:

#### For Basic Plan:
1. **Click** on the Basic Plan product
2. **Add price** →  **Recurring**
   - **Monthly Price**: `$10.00`
   - **Billing period**: Monthly
   - Click **Add price**
   - **Copy the Price ID** (starts with `price_`)
   
3. **Add another price** → **Recurring**
   - **Yearly Price**: `$96.00` (20% off = $10 × 12 × 0.8)
   - **Billing period**: Yearly
   - Click **Add price**
   - **Copy the Price ID**

#### For Premium Plan:
1. **Click** on the Premium Plan product
2. **Add price** → **Recurring**
   - **Monthly Price**: `$14.00`
   - **Billing period**: Monthly
   - Click **Add price**
   - **Copy the Price ID**
   
3. **Add another price** → **Recurring**
   - **Yearly Price**: `$134.40` (20% off = $14 × 12 × 0.8)
   - **Billing period**: Yearly
   - Click **Add price**
   - **Copy the Price ID**

### Add Price IDs to `.env.local`:
```bash
NEXT_PUBLIC_STRIPE_BASIC_MONTHLY_PRICE_ID=price_xxxxxxxxxxxxx
NEXT_PUBLIC_STRIPE_BASIC_YEARLY_PRICE_ID=price_xxxxxxxxxxxxx
NEXT_PUBLIC_STRIPE_PREMIUM_MONTHLY_PRICE_ID=price_xxxxxxxxxxxxx
NEXT_PUBLIC_STRIPE_PREMIUM_YEARLY_PRICE_ID=price_xxxxxxxxxxxxx
```

---

## 🔔 Step 3: Set Up Webhooks

1. **Go to**: Developers → Webhooks
2. **Click**: Add endpoint
3. **Endpoint URL**: `https://your-domain.com/api/webhooks/stripe`
   - For local development: Use ngrok or similar tunnel
   - For production: Use your actual domain

4. **Select events to listen to**:
   - ✅ `customer.subscription.created`
   - ✅ `customer.subscription.updated`
   - ✅ `customer.subscription.deleted`
   - ✅ `invoice.payment_succeeded`
   - ✅ `invoice.payment_failed`

5. **Click**: Add endpoint

6. **Copy the Webhook Signing Secret** (starts with `whsec_`)

7. **Add to `.env.local`**:
```bash
STRIPE_WEBHOOK_SECRET=whsec_xxxxxxxxxxxxx
```

---

## 🎫 Step 4: Configure Customer Portal

1. **Go to**: Settings → Billing → Customer portal
2. **Click**: Configure
3. **Configure the following**:

### Features:
- ✅ **Update payment method**
- ✅ **Update billing email**
- ✅ **Switch plans** (Allow customers to switch plans)
- ✅ **Cancel subscriptions** (Allow customers to cancel immediately or at period end)

### Billing information:
- ✅ Require billing address
- ✅ Show tax ID collection (optional)

### Branding:
- Add your logo
- Choose accent color: `#d946ef` (brand color)
- Add company name

4. **Click**: Save changes

---

## 📊 Step 5: Update Supabase

1. **Run the SQL script**: Open `supabase-subscription-setup.sql` in your Supabase SQL Editor
2. **Execute** the entire script
3. **Verify tables created**:
   - `subscription_tiers`
   - `user_subscriptions`

---

## 🔐 Step 6: Update Environment Variables

Create or update your `.env.local` file with ALL of the following:

```bash
# Stripe Keys
STRIPE_SECRET_KEY=sk_test_xxxxxxxxxxxxx
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_xxxxxxxxxxxxx
STRIPE_WEBHOOK_SECRET=whsec_xxxxxxxxxxxxx

# Stripe Price IDs
NEXT_PUBLIC_STRIPE_BASIC_MONTHLY_PRICE_ID=price_xxxxxxxxxxxxx
NEXT_PUBLIC_STRIPE_BASIC_YEARLY_PRICE_ID=price_xxxxxxxxxxxxx
NEXT_PUBLIC_STRIPE_PREMIUM_MONTHLY_PRICE_ID=price_xxxxxxxxxxxxx
NEXT_PUBLIC_STRIPE_PREMIUM_YEARLY_PRICE_ID=price_xxxxxxxxxxxxx

# Supabase (you should already have these)
NEXT_PUBLIC_SUPABASE_URL=your-supabase-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# Site URL (for Stripe redirects)
NEXT_PUBLIC_SITE_URL=http://localhost:3000  # Change to production URL when deploying
```

---

## 🧪 Step 7: Test the Integration

### Test Mode:
1. **Restart your development server**: `npm run dev`
2. **Go to**: `/pricing`
3. **Click**: Get Started on any plan
4. **Use test card**: `4242 4242 4242 4242`
   - Expiry: Any future date
   - CVC: Any 3 digits
   - ZIP: Any 5 digits

5. **Complete checkout**
6. **Verify**:
   - You're redirected to `/profile?success=true`
   - Your subscription status is "active" in profile
   - Database shows subscription in `user_subscriptions` table
   - Stripe dashboard shows new customer and subscription

### Test Customer Portal:
1. **Go to**: `/profile`
2. **Click**: "Manage Subscription"
3. **Verify you can**:
   - Update payment method
   - Switch plans
   - Cancel subscription
   - View invoices

---

## 🚀 Step 8: Go Live (When Ready)

1. **In Stripe Dashboard**:
   - Toggle from **Test mode** to **Live mode** (top right)
   - Repeat Steps 1-4 with **live** keys
   - Update webhooks with production URL

2. **Update `.env.local`** with live keys:
   - Replace `sk_test_` with `sk_live_`
   - Replace `pk_test_` with `pk_live_`
   - Update webhook secret
   - Update `NEXT_PUBLIC_SITE_URL` to production domain

3. **Deploy** your application

---

## 🔍 Troubleshooting

### Webhook Not Working:
- Check webhook URL is correct
- Verify webhook secret in `.env.local`
- Check webhook logs in Stripe Dashboard

### Subscription Not Updating:
- Check browser console for errors
- Verify all Price IDs are correct
- Check server logs

### Customer Portal Not Working:
- Verify Customer Portal is configured in Stripe
- Check that customer has `stripe_customer_id` in database

---

## 📝 Testing Checklist

- [ ] Can create Basic monthly subscription
- [ ] Can create Basic yearly subscription
- [ ] Can create Premium monthly subscription
- [ ] Can create Premium yearly subscription
- [ ] Webhook updates database correctly
- [ ] Profile shows correct subscription status
- [ ] Can open Customer Portal
- [ ] Can switch plans in Customer Portal
- [ ] Can cancel subscription
- [ ] Can update payment method
- [ ] Monthly limits work correctly
- [ ] Premium users have unlimited access

---

## 🎉 You're Done!

Your Stripe integration is now complete. Users can:
- ✅ Subscribe to Basic or Premium plans
- ✅ Choose monthly or yearly billing (with 20% yearly discount)
- ✅ Manage their subscription through the Stripe portal
- ✅ Upgrade, downgrade, or cancel anytime
- ✅ Have their access automatically controlled by subscription status

For support, check the Stripe documentation or reach out to your development team.

