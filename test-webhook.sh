#!/bin/bash

# Test Stripe Webhook for Subscription Updates
# This script helps verify your webhook is properly configured

echo "🧪 Stripe Webhook Test Script"
echo "=============================="
echo ""

# Check if Stripe CLI is installed
if ! command -v stripe &> /dev/null
then
    echo "❌ Stripe CLI not found"
    echo "Install it with: brew install stripe/stripe-cli/stripe"
    exit 1
fi

echo "✅ Stripe CLI found"
echo ""

# Check if logged in
if ! stripe config --list &> /dev/null
then
    echo "❌ Not logged in to Stripe"
    echo "Run: stripe login"
    exit 1
fi

echo "✅ Logged in to Stripe"
echo ""

# Check if local server is running
if ! curl -s http://localhost:3000 > /dev/null
then
    echo "❌ Local server not running on port 3000"
    echo "Start it with: npm run dev"
    exit 1
fi

echo "✅ Local server is running"
echo ""

echo "📡 Testing webhook events..."
echo ""

# Test subscription created
echo "1️⃣ Testing customer.subscription.created..."
stripe trigger customer.subscription.created
echo ""

# Test subscription updated
echo "2️⃣ Testing customer.subscription.updated (THIS IS THE KEY ONE!)..."
stripe trigger customer.subscription.updated
echo ""

# Test subscription deleted
echo "3️⃣ Testing customer.subscription.deleted..."
stripe trigger customer.subscription.deleted
echo ""

echo "✅ Test events sent!"
echo ""
echo "📝 Check your terminal logs for:"
echo "   - 🔄 Processing subscription update"
echo "   - ✅ Subscription updated successfully"
echo ""
echo "💡 If you don't see these logs, check:"
echo "   1. Stripe CLI is forwarding: stripe listen --forward-to localhost:3000/api/webhooks/stripe"
echo "   2. STRIPE_WEBHOOK_SECRET is set in .env.local"
echo "   3. Your webhook handler is running"

