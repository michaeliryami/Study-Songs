import Stripe from 'stripe'

if (!process.env.STRIPE_SECRET_KEY) {
  throw new Error('STRIPE_SECRET_KEY is not defined in environment variables')
}

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: '2025-09-30.clover',
  typescript: true,
})

export const STRIPE_PLANS = {
  basic: {
    monthly: {
      priceId: process.env.NEXT_PUBLIC_STRIPE_BASIC_MONTHLY_PRICE_ID!,
      amount: 1000, // $10.00
    },
    yearly: {
      priceId: process.env.NEXT_PUBLIC_STRIPE_BASIC_YEARLY_PRICE_ID!,
      amount: 9600, // $96.00 (20% off)
    },
  },
  premium: {
    monthly: {
      priceId: process.env.NEXT_PUBLIC_STRIPE_PREMIUM_MONTHLY_PRICE_ID!,
      amount: 1400, // $14.00
    },
    yearly: {
      priceId: process.env.NEXT_PUBLIC_STRIPE_PREMIUM_YEARLY_PRICE_ID!,
      amount: 13440, // $134.40 (20% off)
    },
  },
} as const

export type PlanTier = 'basic' | 'premium'
export type BillingInterval = 'monthly' | 'yearly'
