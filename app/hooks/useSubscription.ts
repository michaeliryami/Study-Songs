'use client'

import { useEffect, useState } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { supabase } from '../lib/supabase'

// Define what each tier gets
export const TIER_FEATURES = {
  free: {
    tokensPerMonth: 10, // Updated from 30 to 10
    maxSetsPerMonth: 1,
    canDownload: false,
    canSaveSets: true,
  },
  basic: {
    tokensPerMonth: 100, // Adjusted for clarity
    maxSetsPerMonth: 999,
    canDownload: true,
    canSaveSets: true,
  },
  premium: {
    tokensPerMonth: 999999, // Unlimited
    maxSetsPerMonth: 999999,
    canDownload: true,
    canSaveSets: true,
  },
} as const

export type SubscriptionTier = 'free' | 'basic' | 'premium'

export function useSubscription() {
  const { user } = useAuth()
  const [tier, setTier] = useState<SubscriptionTier>('free')
  const [currentTokens, setCurrentTokens] = useState<number>(0)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!user || !supabase) {
      setLoading(false)
      return
    }

    loadTier()

    // Subscribe to real-time changes
    const channel = supabase
      .channel('profile-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'profiles',
          filter: `id=eq.${user.id}`,
        },
        (payload) => {
          console.log('🔄 Real-time profile change detected:', payload)
          loadTier()
        }
      )
      .subscribe()

    return () => {
      channel.unsubscribe()
    }
  }, [user])

  async function loadTier() {
    if (!user || !supabase) return

    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('subscription_tier, current_tokens, stripe_subscription_id, email')
        .eq('id', user.id)
        .single()

      if (error) throw error

      // If user has a subscription tier but no subscription ID, validate with Stripe
      if (
        (data?.subscription_tier === 'basic' || data?.subscription_tier === 'premium') &&
        data?.stripe_subscription_id &&
        data?.email
      ) {
        // Validate subscription exists in background
        validateSubscription(data.email, data.stripe_subscription_id, data.subscription_tier)
      }

      console.log('🔍 Loading subscription data:', {
        subscription_tier: data?.subscription_tier,
        current_tokens: data?.current_tokens,
        user_id: user.id
      })
      
      setTier((data?.subscription_tier as SubscriptionTier) || 'free')
      setCurrentTokens(data?.current_tokens || 0)
    } catch (error) {
      console.error('Error loading tier:', error)
      setTier('free')
      setCurrentTokens(0)
    } finally {
      setLoading(false)
    }
  }

  async function validateSubscription(email: string, subId: string, currentTier: string) {
    try {
      console.log('🔍 Validating subscription:', subId)
      const response = await fetch('/api/validate-subscription', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, subscriptionId: subId, currentTier }),
      })

      const result = await response.json()

      if (!result.valid) {
        console.log('⚠️ Subscription invalid, syncing...')
        // Subscription is invalid, trigger sync
        const syncResponse = await fetch('/api/sync-subscription', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email }),
        })

        const syncData = await syncResponse.json()
        if (syncData.success) {
          console.log('✅ Subscription synced, reloading...')
          loadTier() // Reload tier after sync
        }
      }
    } catch (error) {
      console.error('Error validating subscription:', error)
    }
  }

  const features = TIER_FEATURES[tier]
  const isPremium = tier === 'premium'
  const isBasic = tier === 'basic'
  const isFree = tier === 'free'

  // Force refresh tokens from database
  const refreshTokens = async () => {
    console.log('🔄 Manually refreshing tokens...')
    await loadTier()
  }

  return {
    tier,
    features,
    currentTokens,
    loading,
    isPremium,
    isBasic,
    isFree,
    hasUnlimited: isPremium,
    refresh: loadTier,
    refreshTokens,
  }
}
