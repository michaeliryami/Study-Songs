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
        console.log('📢 New subscription created event')
        await handleSubscriptionCreated(event.data.object as Stripe.Subscription)
        break

      case 'customer.subscription.updated':
        console.log('📢 Subscription updated event')
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
  console.log('Session mode:', session.mode)
  console.log('Session metadata:', session.metadata)
  
  const customerId = session.customer as string
  let subscriptionId = session.subscription as string
  const userId = session.metadata?.supabase_user_id
  
  console.log('Raw customer value:', session.customer)
  console.log('Raw subscription value:', session.subscription)
  console.log('Type of subscription:', typeof session.subscription)
  
  // If subscription is not directly available, retrieve the full session with expanded subscription
  if (!subscriptionId && session.mode === 'subscription') {
    console.log('⚠️ Subscription ID not found in session, retrieving full session...')
    try {
      const fullSession = await stripe.checkout.sessions.retrieve(session.id, {
        expand: ['subscription']
      })
      console.log('Full session retrieved:', fullSession.id)
      console.log('Expanded subscription:', fullSession.subscription)
      
      if (typeof fullSession.subscription === 'object' && fullSession.subscription !== null) {
        subscriptionId = fullSession.subscription.id
        console.log('✓ Extracted subscription ID from expanded object:', subscriptionId)
      } else {
        subscriptionId = fullSession.subscription as string
        console.log('✓ Got subscription ID as string:', subscriptionId)
      }
    } catch (error) {
      console.error('❌ Error retrieving full session:', error)
    }
  }
  
  if (!customerId) {
    console.error('❌ Missing customer ID in checkout session')
    return
  }
  
  if (!subscriptionId) {
    console.error('❌ Missing subscription ID in checkout session')
    console.error('This might be a one-time payment instead of a subscription')
    console.error('Session mode:', session.mode)
    console.error('Payment status:', session.payment_status)
    return
  }

  console.log('✅ Customer ID:', customerId)
  console.log('✅ Subscription ID:', subscriptionId)
  console.log('✅ User ID from metadata:', userId)

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
  
  const updatePayload = {
    subscription_tier: tier,
    stripe_customer_id: customerId,
    stripe_subscription_id: subscriptionId,
  }
  
  console.log('📝 Update payload:', JSON.stringify(updatePayload, null, 2))
  console.log('📝 Payload types:', {
    tier: typeof tier,
    customerId: typeof customerId,
    subscriptionId: typeof subscriptionId,
    tierValue: tier,
    customerIdValue: customerId,
    subscriptionIdValue: subscriptionId
  })
  
  if (userId) {
    console.log('Attempting update by user ID:', userId)
    updateResult = await supabase
      .from('profiles')
      .update(updatePayload)
      .eq('id', userId)
      .select()
  } else {
    console.log('Attempting update by email:', email)
    updateResult = await supabase
      .from('profiles')
      .update(updatePayload)
      .eq('email', email)
      .select()
  }

  const { data, error } = updateResult
  
  console.log('💾 Database update response:')
  console.log('  - Error:', error)
  console.log('  - Data returned:', JSON.stringify(data, null, 2))

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

async function handleSubscriptionCreated(subscription: Stripe.Subscription) {
  console.log('🆕 Processing NEW subscription created:', subscription.id)
  console.log('Full subscription object:', JSON.stringify(subscription, null, 2))
  
  const customerId = subscription.customer as string
  const subscriptionId = subscription.id
  const priceId = subscription.items.data[0]?.price.id
  const status = subscription.status

  console.log('✓ Customer ID:', customerId)
  console.log('✓ Subscription ID:', subscriptionId)
  console.log('✓ Price ID:', priceId)
  console.log('✓ Status:', status)

  // Determine tier from price ID
  let tier: 'basic' | 'premium' = 'basic'
  const env = process.env
  
  if (priceId === env.NEXT_PUBLIC_STRIPE_PREMIUM_MONTHLY_PRICE_ID || 
      priceId === env.NEXT_PUBLIC_STRIPE_PREMIUM_YEARLY_PRICE_ID) {
    tier = 'premium'
  } else if (priceId === env.NEXT_PUBLIC_STRIPE_BASIC_MONTHLY_PRICE_ID || 
             priceId === env.NEXT_PUBLIC_STRIPE_BASIC_YEARLY_PRICE_ID) {
    tier = 'basic'
  }

  console.log('✓ Determined tier:', tier)

  // Get customer details
  const customer = await stripe.customers.retrieve(customerId) as Stripe.Customer
  const email = customer.email
  const userId = customer.metadata?.supabase_user_id

  if (!email) {
    console.error('❌ No email found for customer:', customerId)
    return
  }

  console.log('📧 Email:', email)
  console.log('👤 User ID from customer metadata:', userId)

  const updatePayload = {
    subscription_tier: tier,
    stripe_customer_id: customerId,
    stripe_subscription_id: subscriptionId,
    updated_at: new Date().toISOString()
  }
  
  console.log('📝 Subscription created - update payload:', JSON.stringify(updatePayload, null, 2))

  // Try updating by user ID first (if available), then by email, then by customer ID
  let updateResult
  
  if (userId) {
    console.log('Attempting update by user ID:', userId)
    updateResult = await supabase
      .from('profiles')
      .update(updatePayload)
      .eq('id', userId)
      .select()
  } else {
    console.log('Attempting update by email:', email)
    updateResult = await supabase
      .from('profiles')
      .update(updatePayload)
      .eq('email', email)
      .select()
      
    // If email didn't work, try by stripe_customer_id
    if (!updateResult.data || updateResult.data.length === 0) {
      console.log('Email match failed, trying by stripe_customer_id:', customerId)
      updateResult = await supabase
        .from('profiles')
        .update(updatePayload)
        .eq('stripe_customer_id', customerId)
        .select()
    }
  }

  const { data, error } = updateResult
  
  console.log('💾 Subscription created - database response:')
  console.log('  - Error:', error)
  console.log('  - Data returned:', JSON.stringify(data, null, 2))
  console.log('  - Rows affected:', data?.length || 0)

  if (error) {
    console.error('❌ Error updating profile for new subscription:', error)
    console.error('❌ Full error:', JSON.stringify(error, null, 2))
    throw error
  }

  if (!data || data.length === 0) {
    console.error('❌ No profile found for subscription!')
    console.error('Tried: User ID:', userId, 'Email:', email, 'Customer ID:', customerId)
    return
  }

  console.log(`✅ NEW SUBSCRIPTION! Updated ${email} to ${tier} tier with subscription ${subscriptionId}`)
  console.log('✅ Updated profile:', data[0])
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

  const updatePayload = {
    subscription_tier: tier,
    stripe_customer_id: customerId,
    stripe_subscription_id: subscriptionId,
    updated_at: new Date().toISOString()
  }
  
  console.log('📝 Subscription update payload:', JSON.stringify(updatePayload, null, 2))
  console.log('📝 Payload values:', {
    tier,
    customerId,
    subscriptionId,
    subscriptionIdType: typeof subscriptionId,
    subscriptionIdLength: subscriptionId?.length
  })

  // Update profile with subscription tier
  const { data, error } = await supabase
    .from('profiles')
    .update(updatePayload)
    .eq('email', email)
    .select()
  
  console.log('💾 Subscription update response:')
  console.log('  - Error:', error)
  console.log('  - Data returned:', JSON.stringify(data, null, 2))
  console.log('  - Rows affected:', data?.length || 0)

  if (error) {
    console.error('❌ Error updating subscription:', error)
    console.error('❌ Full error object:', JSON.stringify(error, null, 2))
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

