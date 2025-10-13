import { NextRequest, NextResponse } from 'next/server'
import { headers } from 'next/headers'
import { stripe } from '@/app/lib/stripe'
import { createClient } from '@supabase/supabase-js'
import Stripe from 'stripe'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
const supabase = createClient(supabaseUrl, supabaseServiceKey)

const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET!

export async function POST(req: NextRequest) {
  const body = await req.text()
  const signature = headers().get('stripe-signature')!

  let event: Stripe.Event

  try {
    event = stripe.webhooks.constructEvent(body, signature, webhookSecret)
  } catch (err) {
    console.error('Webhook signature verification failed:', err)
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 })
  }

  console.log('Stripe webhook event:', event.type)

  try {
    switch (event.type) {
      case 'checkout.session.completed':
        await handleCheckoutSessionCompleted(event.data.object as Stripe.Checkout.Session)
        break

      case 'customer.subscription.created':
      case 'customer.subscription.updated':
        await handleSubscriptionUpdate(event.data.object as Stripe.Subscription)
        break

      case 'customer.subscription.deleted':
        await handleSubscriptionDeleted(event.data.object as Stripe.Subscription)
        break

      case 'invoice.payment_succeeded':
        await handleInvoicePaymentSucceeded(event.data.object as Stripe.Invoice)
        break

      case 'invoice.payment_failed':
        await handleInvoicePaymentFailed(event.data.object as Stripe.Invoice)
        break

      default:
        console.log(`Unhandled event type: ${event.type}`)
    }

    return NextResponse.json({ received: true })
  } catch (error) {
    console.error('Error processing webhook:', error)
    return NextResponse.json(
      { error: 'Webhook processing failed' },
      { status: 500 }
    )
  }
}

async function handleCheckoutSessionCompleted(session: Stripe.Checkout.Session) {
  console.log('🎯 Processing checkout.session.completed:', session.id)
  console.log('Session metadata:', session.metadata)
  
  const customerId = session.customer as string
  const subscriptionId = session.subscription as string
  const userId = session.metadata?.supabase_user_id
  
  if (!customerId || !subscriptionId) {
    console.error('❌ Missing customer or subscription ID in checkout session')
    return
  }

  console.log('Customer ID:', customerId)
  console.log('Subscription ID:', subscriptionId)
  console.log('User ID from metadata:', userId)

  // Get customer details
  const customer = await stripe.customers.retrieve(customerId) as Stripe.Customer
  const email = customer.email
  
  if (!email) {
    console.error('❌ No email found for customer:', customerId)
    return
  }

  console.log(`📧 Checkout completed for ${email}, fetching subscription...`)

  // Fetch the subscription to get tier info
  const subscription = await stripe.subscriptions.retrieve(subscriptionId)
  const priceId = subscription.items.data[0]?.price.id
  
  console.log('Price ID:', priceId)
  
  // Determine tier from price ID
  let tier: 'basic' | 'premium' = 'basic'
  const env = process.env
  if (priceId === env.NEXT_PUBLIC_STRIPE_PREMIUM_MONTHLY_PRICE_ID || 
      priceId === env.NEXT_PUBLIC_STRIPE_PREMIUM_YEARLY_PRICE_ID) {
    tier = 'premium'
  }

  console.log('Determined tier:', tier)

  // Try to update by user ID first (most reliable), then by email
  let updateResult
  
  if (userId) {
    console.log('Attempting update by user ID:', userId)
    updateResult = await supabase
      .from('profiles')
      .update({
        subscription_tier: tier,
        stripe_customer_id: customerId,
        stripe_subscription_id: subscriptionId,
      })
      .eq('id', userId)
      .select()
  } else {
    console.log('Attempting update by email:', email)
    updateResult = await supabase
      .from('profiles')
      .update({
        subscription_tier: tier,
        stripe_customer_id: customerId,
        stripe_subscription_id: subscriptionId,
      })
      .eq('email', email)
      .select()
  }

  const { data, error } = updateResult

  if (error) {
    console.error('❌ Error updating profile after checkout:', error)
    throw error
  }

  if (!data || data.length === 0) {
    console.error('❌ No profile found to update! User ID:', userId, 'Email:', email)
    console.log('Checking if profile exists...')
    const { data: profileCheck } = await supabase
      .from('profiles')
      .select('*')
      .or(userId ? `id.eq.${userId},email.eq.${email}` : `email.eq.${email}`)
    console.log('Profile check result:', profileCheck)
    return
  }

  console.log(`✅ SUCCESS! Updated ${email} to ${tier} tier`)
  console.log('Updated profile data:', data)
}

async function handleSubscriptionUpdate(subscription: Stripe.Subscription) {
  console.log('🔄 Processing subscription update:', subscription.id)
  
  const customerId = subscription.customer as string
  const subscriptionId = subscription.id
  const priceId = subscription.items.data[0]?.price.id
  const status = subscription.status

  console.log('Customer ID:', customerId)
  console.log('Subscription ID:', subscriptionId)
  console.log('Price ID:', priceId)
  console.log('Status:', status)

  // Determine tier from price ID
  let tier: 'free' | 'basic' | 'premium' = 'free'
  
  if (status === 'active') {
    const env = process.env
    console.log('Checking price IDs...')
    console.log('Premium Monthly:', env.NEXT_PUBLIC_STRIPE_PREMIUM_MONTHLY_PRICE_ID)
    console.log('Premium Yearly:', env.NEXT_PUBLIC_STRIPE_PREMIUM_YEARLY_PRICE_ID)
    console.log('Basic Monthly:', env.NEXT_PUBLIC_STRIPE_BASIC_MONTHLY_PRICE_ID)
    console.log('Basic Yearly:', env.NEXT_PUBLIC_STRIPE_BASIC_YEARLY_PRICE_ID)
    
    if (priceId === env.NEXT_PUBLIC_STRIPE_PREMIUM_MONTHLY_PRICE_ID || 
        priceId === env.NEXT_PUBLIC_STRIPE_PREMIUM_YEARLY_PRICE_ID) {
      tier = 'premium'
    } else if (priceId === env.NEXT_PUBLIC_STRIPE_BASIC_MONTHLY_PRICE_ID || 
               priceId === env.NEXT_PUBLIC_STRIPE_BASIC_YEARLY_PRICE_ID) {
      tier = 'basic'
    }
  }

  console.log('Determined tier:', tier)

  // Get customer email
  const customer = await stripe.customers.retrieve(customerId) as Stripe.Customer
  const email = customer.email

  if (!email) {
    console.error('❌ No email found for customer:', customerId)
    return
  }

  console.log('📧 Updating subscription for email:', email)

  // Update profile with subscription tier
  const { data, error } = await supabase
    .from('profiles')
    .update({
      subscription_tier: tier,
      stripe_customer_id: customerId,
      stripe_subscription_id: subscriptionId,
      updated_at: new Date().toISOString()
    })
    .eq('email', email)
    .select()

  if (error) {
    console.error('❌ Error updating subscription:', error)
    throw error
  }

  if (!data || data.length === 0) {
    console.error('❌ No profile found for email:', email)
    return
  }

  console.log(`✅ Subscription updated successfully for ${email}: ${tier} (${status})`)
  console.log('Updated profile data:', data)
}

async function handleSubscriptionDeleted(subscription: Stripe.Subscription) {
  const customerId = subscription.customer as string

  const { error } = await supabase
    .from('profiles')
    .update({
      subscription_tier: 'free',
    })
    .eq('stripe_customer_id', customerId)

  if (error) {
    console.error('Error canceling subscription:', error)
    throw error
  }

  console.log(`Subscription canceled for customer ${customerId}`)
}

async function handleInvoicePaymentSucceeded(invoice: Stripe.Invoice) {
  const customerId = invoice.customer as string
  
  // Type assertion needed because subscription property exists at runtime but TypeScript types may be outdated
  const invoiceWithSub = invoice as Stripe.Invoice & { subscription?: string | Stripe.Subscription | null }
  const subscriptionId = typeof invoiceWithSub.subscription === 'string' 
    ? invoiceWithSub.subscription 
    : invoiceWithSub.subscription?.id

  if (!subscriptionId) return

  // Fetch the subscription to get current details
  const subscription = await stripe.subscriptions.retrieve(subscriptionId)
  await handleSubscriptionUpdate(subscription)

  console.log(`Payment succeeded for customer ${customerId}`)
}

async function handleInvoicePaymentFailed(invoice: Stripe.Invoice) {
  const customerId = invoice.customer as string

  // Optionally downgrade to free tier on payment failure
  const { error } = await supabase
    .from('profiles')
    .update({
      subscription_tier: 'free',
    })
    .eq('stripe_customer_id', customerId)

  if (error) {
    console.error('Error updating payment failed status:', error)
    throw error
  }

  console.log(`Payment failed for customer ${customerId}, downgraded to free`)
}

