import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const { studyNotes, genre: userGenre, skipAudio, existingLyrics } = await request.json()

    if (!studyNotes && !existingLyrics) {
      return NextResponse.json({ error: 'Study notes or lyrics are required' }, { status: 400 })
    }

    // Map user-selected genre to music style with detailed production specs
    const genreMap: Record<string, string> = {
      'pop': 'synth-pop, electronic, pop, synthesizer, drums, bass, piano, 128 BPM, energetic, uplifting, modern, catchy educational jingle, clear vocals',
      'rnb': 'R&B, soul, smooth bass, electric piano, drums, 90 BPM, groovy, relaxed, warm, educational jingle, clear vocals, melodic',
      'hiphop': 'hip-hop, rap beat, 808 bass, snare, hi-hats, 95 BPM, rhythmic, bouncy, modern, educational jingle, clear enunciation, punchy',
      'kids': 'kids pop, playful, xylophone, ukulele, light percussion, 120 BPM, cheerful, fun, bright, educational jingle, simple melody, happy',
      'commercial': 'commercial jingle, advertising pop, catchy hook, piano, guitar, drums, 125 BPM, energetic, memorable, polished, ultra-catchy, repetitive',
      'jazz': 'jazz, swing, piano, upright bass, brushed drums, saxophone, 110 BPM, smooth, sophisticated, relaxed, educational jingle, melodic vocals',
      'rock': 'pop rock, electric guitar, bass guitar, drums, 130 BPM, energetic, driving, anthemic, educational jingle, powerful vocals, catchy',
      'folk': 'folk pop, acoustic guitar, light percussion, 100 BPM, warm, organic, simple, educational jingle, clear vocals, memorable melody',
    }

    // If user selected random or no genre specified, pick randomly
    let genre: string
    if (!userGenre || userGenre === 'random') {
      const allStyles = Object.values(genreMap)
      genre = allStyles[Math.floor(Math.random() * allStyles.length)]
    } else {
      genre = genreMap[userGenre] || genreMap['pop']
    }

    let lyrics = ''

    // If lyrics already exist, skip generation and go straight to audio
    if (existingLyrics) {
      lyrics = existingLyrics
      console.log('Using existing lyrics:', lyrics)
    } else {
      // Generate new lyrics
      const apiKey = process.env.OPENAI_API_KEY || process.env.ANTHROPIC_API_KEY
      const provider = process.env.LLM_PROVIDER || 'openai'

      if (!apiKey) {
        return NextResponse.json(
          { error: 'API key not configured. Please add OPENAI_API_KEY or ANTHROPIC_API_KEY to .env.local' },
          { status: 500 }
        )
      }

      if (provider === 'openai' || process.env.OPENAI_API_KEY) {
      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
        },
        body: JSON.stringify({
          model: 'gpt-4o-mini',
          temperature: 0.7,
          messages: [
            {
              role: 'system',
              content: `You are an assistant that creates catchy, memorable jingles to help users memorize academic or conceptual material.

CRITICAL REQUIREMENTS:
- Your jingle should be 4-6 lines long (aim for shorter - 4 or 5 lines if you can fit all the info)
- You MUST use the specific information from the notes provided below
- Do NOT use general knowledge - only what is in the notes
- Only use 6 lines if you need more space to include ALL the information

Instructions:

The user will provide notes on a specific concept. Read them carefully.

Create a concise jingle (4-6 lines, preferring shorter) that:

1. Has a clear rhyme scheme (e.g., AABB, ABAB, or ABCB)
2. Includes ALL key terms and facts from the notes
3. Uses mnemonic elements like repetition, rhythm, or alliteration
4. Is fun, musical, and easy to remember
5. Directly references the specific information in the notes

Keep the tone educational yet playful, suitable for students studying the topic.

The output should be only the jingle itself (4-6 lines), without commentary or explanation.

Here are the notes you must base your jingle on:

${studyNotes}`,
            },
            {
              role: 'user',
              content: `Create a 4-6 line jingle using ALL the information from the notes above. Make sure it rhymes and includes the key facts.`,
            },
          ],
          max_tokens: 500,
        }),
      })

      if (!response.ok) {
        const error = await response.json()
        console.error('OpenAI API error:', error)
        return NextResponse.json(
          { error: `OpenAI API Error: ${error.error?.message || 'Unknown error'}` },
          { status: response.status }
        )
      }

      const data = await response.json()
      lyrics = data.choices[0].message.content.trim()
    } else if (provider === 'anthropic' || process.env.ANTHROPIC_API_KEY) {
      const response = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': process.env.ANTHROPIC_API_KEY!,
          'anthropic-version': '2023-06-01',
        },
        body: JSON.stringify({
          model: 'claude-3-5-sonnet-20241022',
          max_tokens: 500,
          temperature: 0.7,
          system: `You are an assistant that creates catchy, memorable jingles to help users memorize academic or conceptual material.

CRITICAL REQUIREMENTS:
- Your jingle should be 4-6 lines long (aim for shorter - 4 or 5 lines if you can fit all the info)
- You MUST use the specific information from the notes provided below
- Do NOT use general knowledge - only what is in the notes
- Only use 6 lines if you need more space to include ALL the information

Instructions:

The user will provide notes on a specific concept. Read them carefully.

Create a concise jingle (4-6 lines, preferring shorter) that:

1. Has a clear rhyme scheme (e.g., AABB, ABAB, or ABCB)
2. Includes ALL key terms and facts from the notes
3. Uses mnemonic elements like repetition, rhythm, or alliteration
4. Is fun, musical, and easy to remember
5. Directly references the specific information in the notes

Keep the tone educational yet playful, suitable for students studying the topic.

The output should be only the jingle itself (4-6 lines prefer 4 lines unless necessary to fit all the information), without commentary or explanation.

Here are the notes you must base your jingle on:

${studyNotes}`,
          messages: [
            {
              role: 'user',
              content: `Create a 4-6 line jingle using ALL the information from the notes above. Make sure it rhymes and includes the key facts.`,
            },
          ],
        }),
      })

      if (!response.ok) {
        const error = await response.json()
        console.error('Anthropic API error:', error)
        return NextResponse.json(
          { error: `Anthropic API Error: ${error.error?.message || 'Unknown error'}` },
          { status: response.status }
        )
      }

      const data = await response.json()
      lyrics = data.content[0].text.trim()
    }

    // Clean up
    lyrics = lyrics.replace(/^Line \d+:\s*/gim, '')
    lyrics = lyrics.replace(/^[\d]+\.\s*/gim, '')
    
    // Remove wrapping quotes if present (LLM sometimes wraps entire output)
    lyrics = lyrics.trim()
    if ((lyrics.startsWith('"') && lyrics.endsWith('"')) || (lyrics.startsWith("'") && lyrics.endsWith("'"))) {
      lyrics = lyrics.slice(1, -1).trim()
    }
    // Also remove quotes that might be at the end with punctuation like !"
    lyrics = lyrics.replace(/!["']\s*$/g, '!')
    lyrics = lyrics.replace(/\.["']\s*$/g, '.')
    lyrics = lyrics.replace(/\?["']\s*$/g, '?')
    
    // Convert slashes to actual newlines (LLM sometimes uses / instead of line breaks)
    lyrics = lyrics.replace(/\s*\/\s*/g, '\n')
    
    // Remove title if present (usually all caps first line)
    let lines = lyrics.split('\n').filter(l => l.trim())
    if (lines.length > 0 && lines[0] === lines[0].toUpperCase() && lines[0].length < 50) {
      // First line is likely a title, remove it
      lines = lines.slice(1)
    }
    
    // Minimal cleanup - just fix obvious formatting issues
    lines = lines.map(line => {
      let trimmed = line.trim()
      // Clean up quotes at end with punctuation
      trimmed = trimmed.replace(/!["']\s*$/g, '!')
      trimmed = trimmed.replace(/\.["']\s*$/g, '.')
      trimmed = trimmed.replace(/\?["']\s*$/g, '?')
      // Remove double punctuation
      trimmed = trimmed.replace(/[!.?]{2,}$/g, (match) => match[0])
      return trimmed
    })
    
      // If we have at least some lines, use them
      if (lines.length === 0) {
        lyrics = 'Error: No lyrics generated'
      } else {
        lyrics = lines.join('\n')
      }

      console.log('Generated jingle:', lyrics)
    } // End of lyrics generation

    // For music, repeat if too short
    let musicLyrics = lyrics
    if (lyrics.length < 80) {
      musicLyrics = lyrics + '\n\n' + lyrics
    }
    
    // Skip audio generation if requested (for faster initial load)
    if (skipAudio) {
      console.log('Skipping audio generation')
      return NextResponse.json({ lyrics, audioUrl: null })
    }
    
    console.log('Generating music...')

    const replicateApiKey = process.env.REPLICATE_API_KEY

    if (!replicateApiKey) {
      return NextResponse.json({ lyrics, audioUrl: null, error: 'Music generation unavailable' })
    }

    try {
      const Replicate = (await import('replicate')).default
      const replicate = new Replicate({ auth: replicateApiKey })

      if (musicLyrics.length > 600) {
        musicLyrics = musicLyrics.substring(0, 600)
      }

      // Wrap in [Chorus] tags so the music model treats it as a unified chorus section
      const formattedLyrics = `[Chorus]\n${musicLyrics}\n[Chorus]`

      const musicInput = {
        lyrics: formattedLyrics,
        prompt: `${genre}, educational study jingle, repetitive refrain, simple singable melody, clear pronunciation, upbeat tempo, 30-60 seconds duration`,
      }

      const output = await replicate.run('minimax/music-1.5', { input: musicInput }) as any
      const replicateAudioUrl = output.url()

      console.log('Music generated!')

      // Upload directly to Supabase Storage (no separate API call needed)
      try {
        // Fetch the audio file from Replicate
        const audioResponse = await fetch(replicateAudioUrl)
        if (!audioResponse.ok) {
          throw new Error(`Failed to fetch audio: ${audioResponse.statusText}`)
        }

        const audioBuffer = await audioResponse.arrayBuffer()
        const audioBlob = new Blob([audioBuffer], { type: 'audio/mpeg' })

        // Create a unique filename
        const timestamp = Date.now()
        const sanitizedTerm = (studyNotes.split(':')[0] || 'study-term').replace(/[^a-zA-Z0-9]/g, '_').toLowerCase()
        const fileName = `${timestamp}_${sanitizedTerm}.mp3`
        const filePath = fileName // Upload directly to root of bucket

        // Initialize Supabase client with service role key
        const { createClient } = await import('@supabase/supabase-js')
        const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
        const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
        
        if (!supabaseUrl || !supabaseServiceKey) {
          throw new Error('Missing Supabase environment variables')
        }

        const supabase = createClient(supabaseUrl, supabaseServiceKey)

        // Upload to Supabase Storage
        const { data: uploadData, error: uploadError } = await supabase.storage
          .from('audio-files')
          .upload(filePath, audioBlob, {
            contentType: 'audio/mpeg',
            upsert: false,
          })

        if (uploadError) {
          throw new Error(`Upload failed: ${uploadError.message}`)
        }

        // Get the public URL for the uploaded file
        const { data: urlData } = supabase.storage
          .from('audio-files')
          .getPublicUrl(filePath)

        if (!urlData?.publicUrl) {
          throw new Error('Failed to get public URL for uploaded file')
        }

        console.log('Audio uploaded to Supabase:', urlData.publicUrl)
        
        return NextResponse.json({ 
          lyrics, 
          audioUrl: urlData.publicUrl
        })
      } catch (uploadError) {
        console.error('Error uploading to Supabase:', uploadError)
        // Fallback to Replicate URL if Supabase upload fails
        return NextResponse.json({ 
          lyrics, 
          audioUrl: replicateAudioUrl
        })
      }
    } catch (musicError) {
      console.error('Error generating music:', musicError)
      return NextResponse.json({
        lyrics,
        audioUrl: null,
        error: `Music generation failed: ${musicError instanceof Error ? musicError.message : 'Unknown error'}`
      })
    }
  } catch (error) {
    console.error('Error in generate-song route:', error)
    return NextResponse.json({ 
      error: `Server Error: ${error instanceof Error ? error.message : 'Unknown error'}` 
    }, { status: 500 })
  }
}
