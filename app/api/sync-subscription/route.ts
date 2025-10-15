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

    // Get active subscriptions
    const subscriptions = await stripe.subscriptions.list({
      customer: profile.stripe_customer_id,
      status: 'active',
      limit: 1
    })

    console.log('📋 Active subscriptions found:', subscriptions.data.length)

    let newTier: 'free' | 'basic' | 'premium' = 'free'
    let subscriptionId: string | null = null

    if (subscriptions.data.length > 0) {
      const subscription = subscriptions.data[0]
      subscriptionId = subscription.id
      console.log('✓ Found subscription ID:', subscriptionId)
      console.log('✓ Subscription status:', subscription.status)
      
      const priceId = subscription.items.data[0]?.price.id
      console.log('💰 Price ID:', priceId)

      // Determine tier from price ID (only if subscription is active)
      if (subscription.status === 'active') {
        const env = process.env
        if (priceId === env.NEXT_PUBLIC_STRIPE_PREMIUM_MONTHLY_PRICE_ID || 
            priceId === env.NEXT_PUBLIC_STRIPE_PREMIUM_YEARLY_PRICE_ID) {
          newTier = 'premium'
        } else if (priceId === env.NEXT_PUBLIC_STRIPE_BASIC_MONTHLY_PRICE_ID || 
                   priceId === env.NEXT_PUBLIC_STRIPE_BASIC_YEARLY_PRICE_ID) {
          newTier = 'basic'
        }
      } else {
        console.log('⚠️ Subscription exists but is not active:', subscription.status)
        newTier = 'free'
        subscriptionId = null // Don't store inactive subscription ID
      }
    } else {
      console.log('ℹ️ No active subscriptions - setting tier to free')
    }

    console.log('🎯 New tier determined:', newTier)
    console.log('🎯 New subscription ID:', subscriptionId)

    // Update profile
    const updatePayload = {
      subscription_tier: newTier,
      stripe_subscription_id: subscriptionId,
      updated_at: new Date().toISOString()
    }
    
    console.log('📝 Updating profile with payload:', JSON.stringify(updatePayload, null, 2))
    
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
