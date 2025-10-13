'use client'

import { useEffect, useState } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { supabase } from '../lib/supabase'

// Define what each tier gets
export const TIER_FEATURES = {
  free: {
    jinglesPerMonth: 10,
    canDownload: false,
    canSaveSets: true,
    maxSetsPerMonth: 3,
  },
  basic: {
    jinglesPerMonth: 100,
    canDownload: true,
    canSaveSets: true,
    maxSetsPerMonth: 999,
  },
  premium: {
    jinglesPerMonth: 999999, // Unlimited
    canDownload: true,
    canSaveSets: true,
    maxSetsPerMonth: 999999,
  },
} as const

export type SubscriptionTier = 'free' | 'basic' | 'premium'

export function useSubscription() {
  const { user } = useAuth()
  const [tier, setTier] = useState<SubscriptionTier>('free')
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
        () => {
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
        .select('subscription_tier')
        .eq('id', user.id)
        .single()

      if (error) throw error
      setTier((data?.subscription_tier as SubscriptionTier) || 'free')
    } catch (error) {
      console.error('Error loading tier:', error)
      setTier('free')
    } finally {
      setLoading(false)
    }
  }

  const features = TIER_FEATURES[tier]
  const isPremium = tier === 'premium'
  const isBasic = tier === 'basic'
  const isFree = tier === 'free'

  return {
    tier,
    features,
    loading,
    isPremium,
    isBasic,
    isFree,
    hasUnlimited: isPremium,
    refresh: loadTier,
  }
}

