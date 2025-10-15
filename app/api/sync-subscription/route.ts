import { NextRequest, NextResponse } from 'next/server'
import { stripe } from '@/app/lib/stripe'
import { createClient } from '@supabase/supabase-js'

export async function POST(req: NextRequest) {
  try {
    const { email } = await req.json()

    if (!email) {
      return NextResponse.json(
        { error: 'Email is required' },
        { status: 400 }
      )
    }

    // Create Supabase client
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
    
    if (!supabaseUrl || !supabaseServiceKey) {
      return NextResponse.json(
        { error: 'Missing Supabase configuration' },
        { status: 500 }
      )
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    // Get user profile
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('email', email)
      .single()

    if (profileError || !profile) {
      return NextResponse.json(
        { error: 'User profile not found' },
        { status: 404 }
      )
    }

    if (!profile.stripe_customer_id) {
      return NextResponse.json(
        { error: 'No Stripe customer ID found' },
        { status: 404 }
      )
    }

    console.log('🔄 Syncing subscription for customer:', profile.stripe_customer_id)
    console.log('   Current tier in DB:', profile.subscription_tier)
    console.log('   Current subscription ID in DB:', profile.stripe_subscription_id)

    // Get customer from Stripe
    const customer = await stripe.customers.retrieve(profile.stripe_customer_id) as any
    console.log('📧 Customer email:', customer.email)

    // Get ALL subscriptions (including canceled) to check status
    const allSubscriptions = await stripe.subscriptions.list({
      customer: profile.stripe_customer_id,
      limit: 10 // Get recent subscriptions
    })

    console.log('📋 Total subscriptions found:', allSubscriptions.data.length)

    let newTier: 'free' | 'basic' | 'premium' = 'free'
    let subscriptionId: string | null = null
    let newTokens = 30 // Default for free tier

    // Find the most recent subscription that's active OR will cancel at period end
    const currentSubscription = allSubscriptions.data.find(sub => 
      sub.status === 'active' || sub.status === 'trialing'
    )
    
    if (currentSubscription) {
      console.log('✓ Found subscription ID:', currentSubscription.id)
      console.log('✓ Subscription status:', currentSubscription.status)
      console.log('✓ Cancel at period end?', currentSubscription.cancel_at_period_end)
      console.log('✓ Current period end:', currentSubscription.current_period_end)
      
      // Check if subscription is canceled (will end at period end)
      if (currentSubscription.cancel_at_period_end) {
        console.log('⚠️ Subscription is CANCELED - will end at:', new Date(currentSubscription.current_period_end * 1000))
        console.log('   Reverting to free tier immediately')
        newTier = 'free'
        newTokens = 30
        subscriptionId = null // Clear subscription ID since it's canceled
      } else {
        // Subscription is active and not canceled
        subscriptionId = currentSubscription.id
        const priceId = currentSubscription.items.data[0]?.price.id
        console.log('💰 Price ID:', priceId)

        // Determine tier and tokens from price ID
        const env = process.env
        if (priceId === env.NEXT_PUBLIC_STRIPE_PREMIUM_MONTHLY_PRICE_ID || 
            priceId === env.NEXT_PUBLIC_STRIPE_PREMIUM_YEARLY_PRICE_ID) {
          newTier = 'premium'
          newTokens = 999999 // Unlimited for premium
        } else if (priceId === env.NEXT_PUBLIC_STRIPE_BASIC_MONTHLY_PRICE_ID || 
                   priceId === env.NEXT_PUBLIC_STRIPE_BASIC_YEARLY_PRICE_ID) {
          newTier = 'basic'
          newTokens = 300 // 300 credits for basic
        }
      }
    } else {
      console.log('ℹ️ No active subscriptions found')
      
      // Check if there's a canceled/expired subscription
      const canceledSubscription = allSubscriptions.data.find(sub => 
        sub.status === 'canceled' || 
        sub.status === 'incomplete_expired' || 
        sub.status === 'unpaid' ||
        sub.status === 'past_due'
      )
      
      if (canceledSubscription) {
        console.log('⚠️ Found canceled/expired subscription:', canceledSubscription.id)
        console.log('   Status:', canceledSubscription.status)
        console.log('   Canceled at:', canceledSubscription.canceled_at)
        console.log('   Cancel at period end was:', canceledSubscription.cancel_at_period_end)
      }
      
      // Set to free tier
      newTier = 'free'
      newTokens = 30
      subscriptionId = null // Clear subscription ID for canceled/no subscription
    }

    console.log('🎯 New tier determined:', newTier)
    console.log('🎯 New subscription ID:', subscriptionId)
    console.log('🪙 New token amount:', newTokens)

    // Update profile with tier, subscription ID, and tokens
    const updatePayload = {
      subscription_tier: newTier,
      stripe_subscription_id: subscriptionId,
      current_tokens: newTokens,
      updated_at: new Date().toISOString()
    }
    
    console.log('📝 Updating profile with payload:', JSON.stringify(updatePayload, null, 2))
    console.log('   Old tier:', profile.subscription_tier, '→ New tier:', newTier)
    console.log('   Old sub ID:', profile.stripe_subscription_id, '→ New sub ID:', subscriptionId)
    console.log('   Setting tokens to:', newTokens)
    
    const { data: updatedProfile, error: updateError } = await supabase
      .from('profiles')
      .update(updatePayload)
      .eq('id', profile.id)
      .select()
      .single()

    if (updateError) {
      console.error('❌ Error updating profile:', updateError)
      console.error('❌ Full error:', JSON.stringify(updateError, null, 2))
      return NextResponse.json(
        { error: 'Failed to update subscription' },
        { status: 500 }
      )
    }

    console.log('✅ Subscription synced successfully!')
    console.log('✅ Updated profile:', JSON.stringify(updatedProfile, null, 2))

    return NextResponse.json({
      success: true,
      tier: newTier,
      subscriptionId,
      message: 'Subscription synced successfully'
    })

  } catch (error) {
    console.error('Error syncing subscription:', error)
    return NextResponse.json(
      { error: 'Failed to sync subscription' },
      { status: 500 }
    )
  }
}
