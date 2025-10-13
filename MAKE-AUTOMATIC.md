# ⚡ Make Subscriptions Automatic - Quick Guide

## TL;DR

**For local testing:** Run Stripe CLI
**For production:** Set up webhook in Stripe Dashboard

That's it! The code already handles everything automatically.

---

## 🏠 Local Development (Right Now)

### What You Need Running:

**Terminal 1 - Dev Server:**
```bash
npm run dev
```

**Terminal 2 - Stripe Webhook Forwarder:**
```bash
stripe listen --forward-to http://localhost:3000/api/webhooks/stripe
```

When you run Terminal 2, it will print:
```
Ready! Your webhook signing secret is whsec_xxxxxxxxxxxxxx
```

**Copy that secret** and add to `.env.local`:
```bash
STRIPE_WEBHOOK_SECRET=whsec_xxxxxxxxxxxxxx
```

**Restart Terminal 1** (Ctrl+C, then `npm run dev` again)

### Now It's Automatic! ✅

1. Go to http://localhost:3000/pricing
2. Click "Subscribe"
3. Use test card: `4242 4242 4242 4242`
4. Complete checkout

**Watch Terminal 2 - you'll see:**
```
🎯 Processing checkout.session.completed
📧 Checkout completed for your@email.com
✅ SUCCESS! Updated your@email.com to basic tier
```

**Check your profile** - you'll see Basic Tier automatically!

---

## 🌐 Production (Vercel)

### One-Time Setup (5 minutes):

1. **Deploy to Vercel**
   ```bash
   git add .
   git commit -m "Add Stripe subscriptions"
   git push
   # Vercel auto-deploys if connected to GitHub
   ```

2. **Add environment variables** in Vercel Dashboard

3. **Create webhook in Stripe Dashboard:**
   - Go to **Stripe Dashboard > Developers > Webhooks**
   - Click **"Add endpoint"**
   - URL: `https://your-app.vercel.app/api/webhooks/stripe`
   - Select these events:
     - `checkout.session.completed`
     - `customer.subscription.created`
     - `customer.subscription.updated`
     - `customer.subscription.deleted`
     - `invoice.payment_succeeded`
     - `invoice.payment_failed`
   - Click **"Add endpoint"**
   - Copy the **webhook signing secret**

4. **Add webhook secret to Vercel:**
   - Vercel Dashboard > Settings > Environment Variables
   - Add: `STRIPE_WEBHOOK_SECRET=whsec_xxxxx`
   - **Redeploy**

### Now It's Automatic Forever! ✅

Every time a user subscribes:
1. They complete checkout
2. Stripe sends webhook to your app
3. Your app updates the database
4. User sees their new tier

**No manual intervention ever needed!**

---

## 🔍 What Makes It Automatic

Our code already has all the automation built in:

### `/app/api/webhooks/stripe/route.ts`
- ✅ Listens for Stripe webhook events
- ✅ Handles `checkout.session.completed`
- ✅ Fetches subscription details
- ✅ Updates Supabase database
- ✅ Logs everything with emojis

### `/app/hooks/useSubscription.ts`
- ✅ Real-time subscription to Supabase
- ✅ Automatically refreshes when tier changes
- ✅ Provides features based on tier

### `/app/profile/page.tsx`
- ✅ Shows current tier
- ✅ Updates automatically
- ✅ Provides "Manage Subscription" button (Stripe portal)

**Everything is already coded!** You just need:
- Local: Stripe CLI running
- Production: Webhook configured in Stripe

---

## 🐛 If It's Not Working

### Check These:

**1. Is Stripe CLI running?** (local only)
```bash
# Terminal 2 should show:
Ready! Your webhook signing secret is whsec_xxxxx
```

**2. Is webhook secret in `.env.local`?** (local)
```bash
STRIPE_WEBHOOK_SECRET=whsec_xxxxx
```

**3. Did you restart the dev server?** (after adding secret)
```bash
# Terminal 1
Ctrl+C
npm run dev
```

**4. Is the webhook configured?** (production)
- Stripe Dashboard > Developers > Webhooks
- Should show your Vercel URL
- Status should be "Active"

**5. Is the database constraint fixed?** (one-time)
```sql
-- Run in Supabase SQL Editor:
ALTER TABLE profiles 
DROP CONSTRAINT IF EXISTS profiles_subscription_tier_check;

ALTER TABLE profiles 
ADD CONSTRAINT profiles_subscription_tier_check 
CHECK (subscription_tier IN ('free', 'basic', 'premium'));
```

---

## ✅ Checklist

### For Local Testing:
- [ ] Stripe CLI installed (`brew install stripe/stripe-cli/stripe`)
- [ ] Logged into Stripe (`stripe login`)
- [ ] Terminal 2 running `stripe listen --forward-to http://localhost:3000/api/webhooks/stripe`
- [ ] Webhook secret copied to `.env.local`
- [ ] Dev server restarted
- [ ] Database constraint fixed

### For Production:
- [ ] Deployed to Vercel
- [ ] All environment variables added to Vercel
- [ ] Webhook endpoint created in Stripe Dashboard
- [ ] Webhook secret added to Vercel
- [ ] Redeployed after adding secret
- [ ] Database constraint fixed

---

## 🎉 Success Looks Like

### Local:
```
Terminal 2:
🎯 Processing checkout.session.completed: cs_xxxxx
📧 Checkout completed for user@email.com, fetching subscription...
Determined tier: basic
Attempting update by user ID: xxxxx
✅ SUCCESS! Updated user@email.com to basic tier
```

### Production:
- **Stripe Dashboard > Webhooks:** Shows successful deliveries (200 OK)
- **Vercel Logs:** Shows same emoji logs as local
- **User Profile:** Shows new tier immediately after checkout

---

## 💡 Pro Tips

1. **Test in Stripe Test Mode first** before going live
2. **Monitor Vercel logs** for the first few subscriptions
3. **Check Stripe webhook logs** if something goes wrong
4. **Use the fix tool** (`/fix-subscription`) only for manual fixes - normal subscriptions won't need it

---

**Bottom line:** The system is already automatic! Just need Stripe CLI for local testing and webhook configured for production. 🚀

