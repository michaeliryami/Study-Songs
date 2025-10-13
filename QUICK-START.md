# 🚀 Quick Start: Test Stripe Integration

## The Problem You Had

- ✅ **FIXED:** Customer wasn't being created with name
- ✅ **FIXED:** Webhook wasn't handling `checkout.session.completed` event
- ✅ **FIXED:** No logging to debug issues
- ✅ **FIXED:** Email matching issues

## Run These 3 Commands

### Terminal 1:
```bash
npm run dev
```

### Terminal 2:
```bash
stripe listen --forward-to http://localhost:3000/api/webhooks/stripe
```

**⚠️ IMPORTANT:** Copy the `whsec_xxxxx` secret from Terminal 2 and add to `.env.local`:
```
STRIPE_WEBHOOK_SECRET=whsec_xxxxx
```

Then restart Terminal 1 (Ctrl+C and `npm run dev` again)

### Browser:
1. Go to http://localhost:3000/pricing
2. Click "Subscribe" on Basic
3. Use card: `4242 4242 4242 4242`
4. Complete checkout
5. Check http://localhost:3000/profile

---

## What You Should See

### Terminal 2 (Stripe CLI):
```
🎯 Processing checkout.session.completed
📧 Checkout completed for your@email.com
✅ SUCCESS! Updated your@email.com to basic tier
```

### Profile Page:
- Current Plan: **Basic Tier** ✨
- Features showing correctly
- "Manage Subscription" button works

---

## If It's Not Working

1. **Check `.env.local`** - Do you have `STRIPE_WEBHOOK_SECRET`?
2. **Check Terminal 2** - Is it running? Showing webhooks?
3. **Check Supabase** - Go to Table Editor > profiles > find your user
4. **Hard refresh** browser (Cmd+Shift+R or Ctrl+F5)

---

## Files I Changed

1. `/app/api/webhooks/stripe/route.ts` - Added `checkout.session.completed` handler with detailed logging
2. `/app/api/create-checkout-session/route.ts` - Better customer creation with name and metadata
3. Created `STRIPE-DEBUG-GUIDE.md` - Detailed troubleshooting
4. Created `TESTING-CHECKLIST.md` - Step-by-step testing guide

---

## Key Changes

### 1. Webhook Now Handles Checkout Completion
The webhook now listens for `checkout.session.completed` which fires immediately when payment succeeds.

### 2. Better Customer Creation
Customers now get a name (from profile or email) and proper metadata.

### 3. Extensive Logging
Every step now logs with emojis so you can see exactly what's happening:
- 🎯 Webhook received
- 📧 Email found
- ✅ Success
- ❌ Errors

### 4. Dual Lookup Strategy
Updates profile by user ID first (most reliable), falls back to email if needed.

---

## Test Card Numbers

✅ Success: `4242 4242 4242 4242`
❌ Decline: `4000 0000 0000 0002`
🔄 Requires 3DS: `4000 0025 0000 3155`

Use any future expiry (e.g., 12/34) and any CVC (e.g., 123)

---

## Ready for Production?

Once local testing works:
1. Push to GitHub
2. Deploy to Vercel
3. Add webhook in Stripe Dashboard pointing to your Vercel URL
4. Add the production webhook secret to Vercel env vars

That's it! 🎉

