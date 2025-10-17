import { NextRequest, NextResponse } from 'next/server'
import { stripe } from '@/app/lib/stripe'

export async function POST(req: NextRequest) {
  try {
    const { subscriptionId } = await req.json()

    if (!subscriptionId) {
      return NextResponse.json({ valid: false, reason: 'No subscription ID' })
    }

    console.log('🔍 Validating subscription ID:', subscriptionId)

    // Try to retrieve the subscription from Stripe
    try {
      const subscription = await stripe.subscriptions.retrieve(subscriptionId)

      console.log('✓ Subscription found in Stripe')
      console.log('  Status:', subscription.status)
      console.log('  Cancel at period end?', subscription.cancel_at_period_end)

      // Check if subscription is active and not canceled
      const isValid =
        (subscription.status === 'active' || subscription.status === 'trialing') &&
        !subscription.cancel_at_period_end

      if (!isValid) {
        console.log('⚠️ Subscription exists but is not valid')
        console.log(
          '  Reason: Status =',
          subscription.status,
          ', Canceled =',
          subscription.cancel_at_period_end
        )
      }

      return NextResponse.json({
        valid: isValid,
        status: subscription.status,
        canceledAtPeriodEnd: subscription.cancel_at_period_end,
      })
    } catch (stripeError: any) {
      // Subscription doesn't exist in Stripe
      if (stripeError.code === 'resource_missing') {
        console.log('❌ Subscription not found in Stripe:', subscriptionId)
        return NextResponse.json({
          valid: false,
          reason: 'Subscription not found in Stripe',
        })
      }
      throw stripeError
    }
  } catch (error) {
    console.error('Error validating subscription:', error)
    return NextResponse.json({ valid: false, reason: 'Validation error' }, { status: 500 })
  }
}
