import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

// Initialize Supabase client with service role key for server-side operations
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

if (!supabaseUrl || !supabaseServiceKey) {
  throw new Error('Missing Supabase environment variables')
}

const supabase = createClient(supabaseUrl, supabaseServiceKey)

export async function POST(request: NextRequest) {
  try {
    const { audioUrl, userId, term } = await request.json()

    if (!audioUrl || !userId || !term) {
      return NextResponse.json(
        { error: 'Missing required fields: audioUrl, userId, term' },
        { status: 400 }
      )
    }

    // Fetch the audio file from the external URL
    const audioResponse = await fetch(audioUrl)
    if (!audioResponse.ok) {
      throw new Error(`Failed to fetch audio: ${audioResponse.statusText}`)
    }

    const audioBuffer = await audioResponse.arrayBuffer()
    const audioBlob = new Blob([audioBuffer], { type: 'audio/mpeg' })

    // Create a unique filename
    const timestamp = Date.now()
    const sanitizedTerm = term.replace(/[^a-zA-Z0-9]/g, '_').toLowerCase()
    const fileName = `${timestamp}_${sanitizedTerm}.mp3`
    const filePath = `${userId}/${fileName}`

    // Upload to Supabase Storage
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('audio-files')
      .upload(filePath, audioBlob, {
        contentType: 'audio/mpeg',
        upsert: false, // Don't overwrite existing files
      })

    if (uploadError) {
      console.error('Supabase upload error:', uploadError)
      return NextResponse.json(
        { error: `Upload failed: ${uploadError.message}` },
        { status: 500 }
      )
    }

    // Get the public URL for the uploaded file
    const { data: urlData } = supabase.storage
      .from('audio-files')
      .getPublicUrl(filePath)

    if (!urlData?.publicUrl) {
      return NextResponse.json(
        { error: 'Failed to get public URL for uploaded file' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      supabaseAudioUrl: urlData.publicUrl,
      fileName: fileName,
      filePath: filePath,
    })

  } catch (error) {
    console.error('Error in upload-audio route:', error)
    return NextResponse.json(
      { 
        error: `Server Error: ${error instanceof Error ? error.message : 'Unknown error'}` 
      },
      { status: 500 }
    )
  }
}
