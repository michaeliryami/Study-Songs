# 🚀 Go Live Checklist - Stripe Production

## Phase 1: Stripe Business Setup

### 1. Activate Your Stripe Account
- Go to Stripe Dashboard
- Complete **"Activate your account"** form:
  - Business type (individual/company)
  - Business details
  - Bank account for payouts
  - Tax information (EIN or SSN)
  - Identity verification

### 2. Create Production Products & Prices

**In Stripe Dashboard (LIVE MODE - toggle top left):**

1. **Products > Add Product**

**Basic Plan:**
- Name: `Study Songs Basic`
- Description: `100 jingles per month with downloads`
- Pricing:
  - **Monthly**: $10.00 USD (recurring)
    - Copy the price ID: `price_xxxxx`
  - **Yearly**: $96.00 USD (recurring, annual)
    - Copy the price ID: `price_xxxxx`

**Premium Plan:**
- Name: `Study Songs Premium`
- Description: `Unlimited jingles with priority support`
- Pricing:
  - **Monthly**: $14.00 USD (recurring)
    - Copy the price ID: `price_xxxxx`
  - **Yearly**: $134.40 USD (recurring, annual)
    - Copy the price ID: `price_xxxxx`

---

## Phase 2: Environment Variables

### Update Your `.env.local` (for reference):

Keep a backup of test values, then update to production:

```bash
# ====== STRIPE (PRODUCTION) ======
STRIPE_SECRET_KEY=sk_live_xxxxxxxxxxxxx  # NOT sk_test anymore!

# Production Price IDs (from step 2 above)
NEXT_PUBLIC_STRIPE_BASIC_MONTHLY_PRICE_ID=price_xxxxx  # Live price
NEXT_PUBLIC_STRIPE_BASIC_YEARLY_PRICE_ID=price_xxxxx   # Live price
NEXT_PUBLIC_STRIPE_PREMIUM_MONTHLY_PRICE_ID=price_xxxxx  # Live price
NEXT_PUBLIC_STRIPE_PREMIUM_YEARLY_PRICE_ID=price_xxxxx   # Live price

# Webhook secret - GET THIS AFTER CREATING WEBHOOK (step 3)
STRIPE_WEBHOOK_SECRET=whsec_xxxxx  # Production webhook secret

# ====== SUPABASE (PRODUCTION) ======
# Same as before - already production
NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJxxxx
SUPABASE_SERVICE_ROLE_KEY=eyJxxxx

# ====== AI KEYS (PRODUCTION) ======
# Same as before
OPENAI_API_KEY=sk-xxxxx
# or
ANTHROPIC_API_KEY=sk-ant-xxxxx

# Replicate
REPLICATE_API_TOKEN=r8_xxxxx
```

### Update Vercel Environment Variables:

Go to **Vercel Dashboard > Your Project > Settings > Environment Variables**

**Update these to PRODUCTION values:**

| Variable | Production Value | Where to Get It |
|----------|-----------------|-----------------|
| `STRIPE_SECRET_KEY` | `sk_live_xxxxx` | Stripe Dashboard > Developers > API Keys (LIVE mode) |
| `NEXT_PUBLIC_STRIPE_BASIC_MONTHLY_PRICE_ID` | `price_xxxxx` | From your Basic product (monthly) |
| `NEXT_PUBLIC_STRIPE_BASIC_YEARLY_PRICE_ID` | `price_xxxxx` | From your Basic product (yearly) |
| `NEXT_PUBLIC_STRIPE_PREMIUM_MONTHLY_PRICE_ID` | `price_xxxxx` | From your Premium product (monthly) |
| `NEXT_PUBLIC_STRIPE_PREMIUM_YEARLY_PRICE_ID` | `price_xxxxx` | From your Premium product (yearly) |
| `STRIPE_WEBHOOK_SECRET` | `whsec_xxxxx` | From webhook creation (step 3 below) |

**Important:** 
- ✅ Keep all other env vars the same (Supabase, AI keys, etc.)
- ✅ Make sure to **redeploy** after updating env vars
- ✅ Double-check you're using `sk_live_` not `sk_test_`

---

## Phase 3: Production Webhook Setup

### 1. Create Production Webhook

**In Stripe Dashboard (LIVE MODE):**
1. Go to **Developers > Webhooks**
2. Click **"Add endpoint"**

**Configure webhook:**
- **Endpoint URL**: `https://your-actual-domain.vercel.app/api/webhooks/stripe`
  - (Use your real Vercel domain)
- **Description**: `Production subscription webhook`
- **Version**: Use latest API version
- **Events to send** - Select these:
  ```
  ✅ checkout.session.completed
  ✅ customer.subscription.created
  ✅ customer.subscription.updated
  ✅ customer.subscription.deleted
  ✅ invoice.payment_succeeded
  ✅ invoice.payment_failed
  ```

3. Click **"Add endpoint"**
4. **Copy the Signing Secret** (`whsec_xxxxx`)

### 2. Add Webhook Secret to Vercel

1. **Vercel Dashboard > Settings > Environment Variables**
2. Update or add:
   ```
   STRIPE_WEBHOOK_SECRET=whsec_xxxxxxxxxxxxx
   ```
3. **Redeploy your app**

---

## Phase 4: Test Production Before Going Live

### Test with Real Card (in live mode):

⚠️ **Important:** This will create a real charge!

1. **Use a real card** (your own)
2. Subscribe to Basic plan ($10)
3. **Verify:**
   - ✅ Payment processes
   - ✅ Webhook shows success in Stripe Dashboard
   - ✅ Supabase profile updates with `subscription_tier: 'basic'`
   - ✅ Your profile page shows Basic Tier
   - ✅ "Manage Subscription" button works

4. **Cancel the test subscription:**
   - Click "Manage Subscription" on your profile
   - Or go to Stripe Dashboard > Customers > Find yourself > Cancel subscription

5. **Verify cancellation:**
   - ✅ Webhook fires for `customer.subscription.deleted`
   - ✅ Your tier reverts to `'free'` in Supabase
   - ✅ Profile page updates

---

## Phase 5: Legal & Compliance

### 1. Terms of Service & Privacy Policy

Add links to your footer/navbar for:
- Terms of Service
- Privacy Policy
- Refund Policy

**Required for Stripe:**
- How subscriptions work
- Billing cycle information
- Cancellation policy
- Refund policy

### 2. Update Stripe Business Settings

**Stripe Dashboard > Settings > Business settings:**
- Customer support email
- Business website
- Support phone (optional)
- Branding (logo, colors)

### 3. Email Receipts

**Stripe Dashboard > Settings > Emails:**
- Customize email receipts
- Add your branding
- Set support email

---

## Phase 6: Go Live! 🚀

### Pre-Launch Checklist:

- [ ] Stripe account fully activated
- [ ] Production products created (Basic & Premium)
- [ ] All 4 price IDs copied
- [ ] Vercel environment variables updated with production values
- [ ] Production webhook created and secret added to Vercel
- [ ] App redeployed on Vercel
- [ ] Test subscription completed successfully
- [ ] Test cancellation worked
- [ ] Terms of Service & Privacy Policy added
- [ ] Stripe business settings configured

### Launch Day:

1. **Switch Stripe to LIVE MODE** (if you're in test mode)
2. **Test one more time** with a real card
3. **Monitor for first 24 hours:**
   - Stripe Dashboard > Events (watch for webhook successes)
   - Vercel > Runtime Logs (check for errors)
   - Supabase > Profiles table (verify updates)

---

## Phase 7: Monitoring & Maintenance

### Daily (First Week):
- Check Stripe Dashboard > Webhooks for failures
- Check Vercel logs for errors
- Monitor Supabase for correct tier updates

### Weekly:
- Review successful subscriptions
- Check for failed payments (retry or contact customer)
- Monitor churn rate

### Monthly:
- Review analytics
- Check for patterns in cancellations
- Update pricing if needed

---

## Common Issues & Solutions

### Issue: Webhook shows "Failed" in production

**Check:**
1. Is `STRIPE_WEBHOOK_SECRET` correct in Vercel?
2. Did you redeploy after adding the secret?
3. Check Vercel runtime logs for errors

**Fix:**
- Verify webhook secret matches
- Check Vercel logs: `Vercel Dashboard > Deployments > Latest > Runtime Logs`
- Look for `❌` emoji in logs

### Issue: Customer paid but tier not updating

**Check:**
1. Stripe Dashboard > Events - did webhook succeed?
2. Vercel logs - any errors in webhook handler?
3. Supabase - is `stripe_customer_id` set?

**Fix:**
- If webhook failed: Check webhook secret
- If webhook succeeded but DB not updated: Check Supabase logs
- Manual fix: Use `/fix-subscription` tool

### Issue: Customer can't manage subscription

**Check:**
1. Is `stripe_customer_id` in their profile?
2. Is `stripe_subscription_id` in their profile?

**Fix:**
- Run `/fix-subscription` tool
- Or manually update Supabase with correct IDs from Stripe Dashboard

---

## Differences Between Test & Production

| Aspect | Test Mode | Production Mode |
|--------|-----------|-----------------|
| **API Key** | `sk_test_xxxxx` | `sk_live_xxxxx` |
| **Price IDs** | `price_xxxxx` (test) | `price_xxxxx` (live) |
| **Webhook Secret** | `whsec_xxxxx` (test) | `whsec_xxxxx` (live) |
| **Cards** | `4242 4242 4242 4242` | Real cards only |
| **Money** | Fake charges | **REAL CHARGES** |
| **Payouts** | None | Real money to your bank |
| **Dashboard Toggle** | Test mode (top left) | Live mode (top left) |

---

## Important Notes

⚠️ **Never mix test and production:**
- Don't use `sk_test_` with production webhook
- Don't use test price IDs in production
- Keep test and production webhooks separate

✅ **Always verify:**
- Webhook secret matches the endpoint
- API keys are for the right mode
- Price IDs are from the right mode

🔒 **Security:**
- Never commit `.env.local` to Git
- Never share live API keys
- Use environment variables in Vercel only

---

## Quick Reference

### Where to Find What:

**Stripe Live API Key:**
```
Stripe Dashboard (LIVE MODE) > Developers > API Keys > Secret Key
Starts with: sk_live_
```

**Price IDs:**
```
Stripe Dashboard (LIVE MODE) > Products > [Your Product] > Pricing
Starts with: price_
```

**Webhook Secret:**
```
Stripe Dashboard (LIVE MODE) > Developers > Webhooks > [Your Endpoint] > Signing Secret
Starts with: whsec_
```

**Vercel Env Vars:**
```
Vercel Dashboard > [Your Project] > Settings > Environment Variables
```

---

## You're Ready When:

✅ Stripe account is activated and verified
✅ Live products created with correct pricing
✅ All 4 live price IDs copied
✅ Vercel has production API key and price IDs
✅ Production webhook created and secret added
✅ Test subscription completed successfully
✅ Webhook shows success in Stripe Dashboard
✅ Database updates correctly
✅ Terms of Service & Privacy Policy in place

**Then flip the switch and go live!** 🎉

---

**TL;DR:**
1. Activate Stripe account
2. Create products in LIVE mode
3. Copy 4 live price IDs
4. Update Vercel env vars with `sk_live_` and live price IDs
5. Create production webhook, add secret to Vercel
6. Redeploy
7. Test with real card
8. Go live!

Your code is already production-ready! Just need to swap the keys. 🚀

