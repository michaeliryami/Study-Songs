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

    // Get customer from Stripe
    const customer = await stripe.customers.retrieve(profile.stripe_customer_id) as any
    console.log('📧 Customer email:', customer.email)

    // Get active subscriptions
    const subscriptions = await stripe.subscriptions.list({
      customer: profile.stripe_customer_id,
      status: 'active',
      limit: 1
    })

    console.log('📋 Active subscriptions:', subscriptions.data.length)

    let newTier = 'free'
    let subscriptionId = null

    if (subscriptions.data.length > 0) {
      const subscription = subscriptions.data[0]
      subscriptionId = subscription.id
      
      const priceId = subscription.items.data[0]?.price.id
      console.log('💰 Price ID:', priceId)

      // Determine tier from price ID
      const env = process.env
      if (priceId === env.NEXT_PUBLIC_STRIPE_PREMIUM_MONTHLY_PRICE_ID || 
          priceId === env.NEXT_PUBLIC_STRIPE_PREMIUM_YEARLY_PRICE_ID) {
        newTier = 'premium'
      } else if (priceId === env.NEXT_PUBLIC_STRIPE_BASIC_MONTHLY_PRICE_ID || 
                 priceId === env.NEXT_PUBLIC_STRIPE_BASIC_YEARLY_PRICE_ID) {
        newTier = 'basic'
      }
    }

    console.log('🎯 New tier:', newTier)

    // Update profile
    const { data: updatedProfile, error: updateError } = await supabase
      .from('profiles')
      .update({
        subscription_tier: newTier,
        stripe_subscription_id: subscriptionId,
        updated_at: new Date().toISOString()
      })
      .eq('id', profile.id)
      .select()
      .single()

    if (updateError) {
      console.error('❌ Error updating profile:', updateError)
      return NextResponse.json(
        { error: 'Failed to update subscription' },
        { status: 500 }
      )
    }

    console.log('✅ Subscription synced successfully')

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
