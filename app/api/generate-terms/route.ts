import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const { subject } = await request.json()

    if (!subject) {
      return NextResponse.json({ error: 'Subject or study guide is required' }, { status: 400 })
    }

    const apiKey = process.env.OPENAI_API_KEY || process.env.ANTHROPIC_API_KEY
    const provider = process.env.LLM_PROVIDER || 'openai'

    if (!apiKey) {
      return NextResponse.json(
        { error: 'API key not configured' },
        { status: 500 }
      )
    }

    let terms = ''

    if (provider === 'openai' || process.env.OPENAI_API_KEY) {
      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
        },
        body: JSON.stringify({
          model: 'gpt-4o-mini',
          messages: [
            {
              role: 'system',
              content: `You are an expert at extracting ONLY the MAIN TERMS being defined or taught from study materials.

CRITICAL RULES:
1. If given study notes, extract ONLY the PRIMARY terms that are being DEFINED or EXPLAINED
2. DO NOT extract examples, sub-topics, or concepts mentioned in passing
3. Look for terms followed by "is", "are", "means", "refers to" - those are the main terms
4. If a term has bullet points or definitions under it, that's a main term
5. Extract EXACTLY how many main terms are in the notes (could be 2, could be 10)
6. If given only a subject name (no notes), generate 5-8 fundamental concepts
7. Output ONLY the terms, one per line

Examples:
INPUT: "Economics has two branches:\n• Microeconomics is the study of individual decisions\n• Macroeconomics is the study of the overall economy"
OUTPUT: 
Microeconomics
Macroeconomics

INPUT: "The mitochondria produces ATP. It has an inner membrane and outer membrane."
OUTPUT: 
mitochondria

INPUT: "Photosynthesis: Plants use light to make glucose\nCellular Respiration: Cells break down glucose for energy"
OUTPUT:
Photosynthesis
Cellular Respiration

DO NOT extract every word mentioned - ONLY extract the MAIN TERMS being defined!`,
            },
            {
              role: 'user',
              content: `Extract ONLY the MAIN TERMS being defined or explained from this. DO NOT extract examples or sub-concepts mentioned in passing. Look for terms that have definitions after them. Output one term per line:

${subject}`,
            },
          ],
          temperature: 0.7,
          max_tokens: 300,
        }),
      })

      if (!response.ok) {
        const error = await response.json()
        console.error('OpenAI API error:', error)
        return NextResponse.json(
          { error: `API Error: ${error.error?.message || 'Unknown error'}` },
          { status: response.status }
        )
      }

      const data = await response.json()
      terms = data.choices[0].message.content.trim()
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
          max_tokens: 300,
          messages: [
            {
              role: 'user',
              content: `You are an expert at extracting ONLY the MAIN TERMS being defined or taught from study materials.

CRITICAL: Extract ONLY the PRIMARY terms that are being DEFINED or EXPLAINED. DO NOT extract examples, sub-topics, or concepts mentioned in passing. Look for terms followed by "is", "are", "means", or terms with bullet points/definitions under them.

For example, if notes say "Microeconomics is the study of individuals. Macroeconomics is the study of the economy." - extract ONLY "Microeconomics" and "Macroeconomics", NOT "individuals" or "economy".

Output ONLY the main terms, one per line:

${subject}`,
            },
          ],
        }),
      })

      if (!response.ok) {
        const error = await response.json()
        console.error('Anthropic API error:', error)
        return NextResponse.json(
          { error: `API Error: ${error.error?.message || 'Unknown error'}` },
          { status: response.status }
        )
      }

      const data = await response.json()
      terms = data.content[0].text.trim()
    }

    // Clean up the terms - remove any numbers, bullets, or extra formatting
    const cleanedTerms = terms
      .split('\n')
      .map(line => line.replace(/^\d+[\.\)]\s*/, '').replace(/^[-•*]\s*/, '').trim())
      .filter(line => line.length > 0)
      .join('\n')

    return NextResponse.json({ terms: cleanedTerms })
  } catch (error) {
    console.error('Error generating terms:', error)
    return NextResponse.json(
      { error: `Server Error: ${error instanceof Error ? error.message : 'Unknown error'}` },
      { status: 500 }
    )
  }
}

