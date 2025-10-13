import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export async function POST(req: NextRequest) {
  try {
    const { setId, userId } = await req.json()

    if (!setId || !userId) {
      return NextResponse.json(
        { error: 'Set ID and User ID are required' },
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

    // Get the study set
    const { data: studySet, error: setError } = await supabase
      .from('sets')
      .select('jingles, created_by')
      .eq('id', setId)
      .single()

    if (setError || !studySet) {
      return NextResponse.json(
        { error: 'Study set not found' },
        { status: 404 }
      )
    }

    // Check if user owns this set
    if (studySet.created_by !== userId) {
      return NextResponse.json(
        { error: 'Unauthorized access to study set' },
        { status: 403 }
      )
    }

    // Check if user is premium
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('subscription_tier')
      .eq('id', userId)
      .single()

    if (profileError || !profile) {
      return NextResponse.json(
        { error: 'User profile not found' },
        { status: 404 }
      )
    }

    if (profile.subscription_tier !== 'premium') {
      return NextResponse.json(
        { error: 'Audio stitching is a premium feature. Upgrade to Premium to unlock this feature.' },
        { status: 403 }
      )
    }

    // Filter jingles that have audio
    const jinglesWithAudio = studySet.jingles.filter((jingle: any) => jingle.audioUrl)
    
    if (jinglesWithAudio.length === 0) {
      return NextResponse.json(
        { error: 'No audio files found in this study set' },
        { status: 400 }
      )
    }

    console.log(`🎵 Stitching ${jinglesWithAudio.length} audio files for set ${setId}`)

    // Download all audio files
    const audioBuffers: ArrayBuffer[] = []
    
    for (let i = 0; i < jinglesWithAudio.length; i++) {
      const jingle = jinglesWithAudio[i]
      console.log(`📥 Downloading audio ${i + 1}/${jinglesWithAudio.length}: ${jingle.term}`)
      
      try {
        const response = await fetch(jingle.audioUrl)
        if (!response.ok) {
          throw new Error(`Failed to fetch audio for ${jingle.term}: ${response.statusText}`)
        }
        
        const buffer = await response.arrayBuffer()
        audioBuffers.push(buffer)
        console.log(`✅ Downloaded ${jingle.term} (${buffer.byteLength} bytes)`)
      } catch (error) {
        console.error(`❌ Error downloading ${jingle.term}:`, error)
        return NextResponse.json(
          { error: `Failed to download audio for ${jingle.term}` },
          { status: 500 }
        )
      }
    }

    // Create a simple concatenated audio file
    // Note: This is a simplified approach. For production, you might want to use a proper audio processing library
    console.log('🔗 Concatenating audio files...')
    
    // Calculate total size
    const totalSize = audioBuffers.reduce((sum, buffer) => sum + buffer.byteLength, 0)
    console.log(`📊 Total audio size: ${totalSize} bytes`)

    // Create a new buffer with all audio data
    const concatenatedBuffer = new Uint8Array(totalSize)
    let offset = 0
    
    for (const buffer of audioBuffers) {
      concatenatedBuffer.set(new Uint8Array(buffer), offset)
      offset += buffer.byteLength
    }

    // Create blob and upload to Supabase
    const stitchedBlob = new Blob([concatenatedBuffer], { type: 'audio/mpeg' })
    
    // Generate filename
    const timestamp = Date.now()
    const fileName = `stitched_${setId}_${timestamp}.mp3`
    
    console.log('☁️ Uploading stitched audio to Supabase...')
    
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('audio-files')
      .upload(fileName, stitchedBlob, {
        contentType: 'audio/mpeg',
        upsert: false,
      })

    if (uploadError) {
      console.error('❌ Upload error:', uploadError)
      return NextResponse.json(
        { error: `Failed to upload stitched audio: ${uploadError.message}` },
        { status: 500 }
      )
    }

    // Get public URL
    const { data: urlData } = supabase.storage
      .from('audio-files')
      .getPublicUrl(fileName)

    if (!urlData?.publicUrl) {
      return NextResponse.json(
        { error: 'Failed to get public URL for stitched audio' },
        { status: 500 }
      )
    }

    console.log('✅ Stitched audio uploaded:', urlData.publicUrl)

    // Update the study set with stitched audio URL
    const updatedJingles = [...studySet.jingles]
    const updatedSet = {
      ...studySet,
      jingles: updatedJingles,
      stitchedAudioUrl: urlData.publicUrl,
      stitchedAt: new Date().toISOString()
    }

    const { error: updateError } = await supabase
      .from('sets')
      .update({ 
        jingles: updatedJingles,
        stitchedAudioUrl: urlData.publicUrl,
        stitchedAt: new Date().toISOString()
      })
      .eq('id', setId)

    if (updateError) {
      console.error('❌ Error updating set:', updateError)
      return NextResponse.json(
        { error: 'Failed to save stitched audio URL' },
        { status: 500 }
      )
    }

    console.log('🎉 Audio stitching completed successfully!')

    return NextResponse.json({
      success: true,
      stitchedAudioUrl: urlData.publicUrl,
      jinglesCount: jinglesWithAudio.length,
      message: 'Audio stitching completed successfully'
    })

  } catch (error) {
    console.error('Error in stitch-audio route:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
