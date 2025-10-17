import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export async function POST(req: NextRequest) {
  try {
    const { userId } = await req.json()

    if (!userId) {
      return NextResponse.json({ error: 'User ID is required' }, { status: 400 })
    }

    // Create Supabase client with service role key
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

    if (!supabaseUrl || !supabaseServiceKey) {
      return NextResponse.json({ error: 'Missing Supabase configuration' }, { status: 500 })
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    // Get current user profile
    const { data: profile, error: fetchError } = await supabase
      .from('profiles')
      .select('current_tokens, subscription_tier')
      .eq('id', userId)
      .single()

    if (fetchError || !profile) {
      console.error('Error fetching profile:', fetchError)
      return NextResponse.json({ error: 'Failed to fetch user profile' }, { status: 500 })
    }

    // Check if user has tokens
    if (profile.subscription_tier === 'premium') {
      // Premium users have unlimited tokens, no deduction needed
      return NextResponse.json({
        success: true,
        tokensRemaining: 999999,
        message: 'Unlimited tokens (Premium)',
      })
    }

    if (profile.current_tokens <= 0) {
      return NextResponse.json(
        { error: 'Insufficient tokens. Please upgrade your plan.' },
        { status: 403 }
      )
    }

    // Deduct 1 token
    const { data: updatedProfile, error: updateError } = await supabase
      .from('profiles')
      .update({
        current_tokens: profile.current_tokens - 1,
      })
      .eq('id', userId)
      .select('current_tokens')
      .single()

    if (updateError) {
      console.error('Error updating tokens:', updateError)
      return NextResponse.json({ error: 'Failed to deduct token' }, { status: 500 })
    }

    console.log(`✅ Token deducted for user ${userId}. Remaining: ${updatedProfile.current_tokens}`)

    return NextResponse.json({
      success: true,
      tokensRemaining: updatedProfile.current_tokens,
    })
  } catch (error) {
    console.error('Error in deduct-token route:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
