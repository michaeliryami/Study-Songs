import { NextRequest, NextResponse } from 'next/server'
import { stripe } from '@/app/lib/stripe'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
const supabase = createClient(supabaseUrl, supabaseServiceKey)

export async function POST(req: NextRequest) {
  try {
    const { customerId } = await req.json()

    if (!customerId) {
      return NextResponse.json({ error: 'Customer ID required' }, { status: 400 })
    }

    console.log('🔍 Debugging customer:', customerId)

    // Get customer from Stripe
    const customer = await stripe.customers.retrieve(customerId)
    console.log('Customer data:', customer)

    // Get subscriptions for this customer
    const subscriptions = await stripe.subscriptions.list({
      customer: customerId,
      limit: 10,
    })

    console.log('Subscriptions found:', subscriptions.data.length)

    // Check Supabase profile
    const { data: profile } = await supabase
      .from('profiles')
      .select('*')
      .eq('stripe_customer_id', customerId)
      .single()

    console.log('Profile in Supabase:', profile)

    // If there's an active subscription, update it now
    if (subscriptions.data.length > 0) {
      const sub = subscriptions.data[0]
      const priceId = sub.items.data[0]?.price.id

      let tier: 'basic' | 'premium' = 'basic'
      const env = process.env
      if (
        priceId === env.NEXT_PUBLIC_STRIPE_PREMIUM_MONTHLY_PRICE_ID ||
        priceId === env.NEXT_PUBLIC_STRIPE_PREMIUM_YEARLY_PRICE_ID
      ) {
        tier = 'premium'
      }

      console.log('Found active subscription:', sub.id, 'Tier:', tier)

      // Update the profile
      const { data: updated, error } = await supabase
        .from('profiles')
        .update({
          subscription_tier: tier,
          stripe_subscription_id: sub.id,
        })
        .eq('stripe_customer_id', customerId)
        .select()

      if (error) {
        console.error('Error updating:', error)

        // Check if it's a constraint violation
        if (error.code === '23514') {
          return NextResponse.json(
            {
              error: 'Database constraint violation',
              message:
                'Your Supabase table has a check constraint that doesn\'t allow the value "basic" or "premium" for subscription_tier.',
              solution:
                'Run the SQL script fix-constraint.sql in your Supabase SQL Editor to fix this.',
              details: error,
            },
            { status: 500 }
          )
        }

        return NextResponse.json(
          {
            error: 'Failed to update',
            details: error,
          },
          { status: 500 }
        )
      }

      return NextResponse.json({
        success: true,
        message: 'Fixed! Profile updated',
        customer,
        subscriptions: subscriptions.data,
        profile,
        updated,
        tier,
      })
    }

    return NextResponse.json({
      success: false,
      message: 'No active subscriptions found',
      customer,
      subscriptions: subscriptions.data,
      profile,
    })
  } catch (error) {
    console.error('Debug error:', error)
    return NextResponse.json(
      {
        error: 'Debug failed',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}
