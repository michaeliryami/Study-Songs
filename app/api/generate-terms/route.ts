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
1. Extract ONLY the PRIMARY terms that are being DEFINED or EXPLAINED
2. Look for patterns like:
   - "Term name" followed by description/definition
   - Terms that have bullet points or indented text under them
   - Terms followed by "is", "are", "means", "refers to", "definition"
   - Section headers that introduce concepts
3. DO NOT extract examples, sub-points, or concepts mentioned in passing
4. Indented/bulleted text is usually supporting detail - extract the PARENT term, not the bullets
5. Extract EXACTLY how many main terms exist (could be 2, could be 20)
6. If given only a subject name, generate 5-8 fundamental concepts
7. Output ONLY the term names, one per line

Examples:
INPUT: "Marketing Myopia\nMarketing myopia definition\n        A nearsighted focus on selling products\n        Lack of insight\n\nHow to get rid of marketing myopia\n        Switching from production to consumer"
OUTPUT:
Marketing myopia
How to get rid of marketing myopia

INPUT: "Microeconomics is the study of individuals\nMacroeconomics is the study of the economy"
OUTPUT: 
Microeconomics
Macroeconomics

INPUT: "Photosynthesis: Plants use light to make glucose\nCellular Respiration: Cells break down glucose"
OUTPUT:
Photosynthesis
Cellular Respiration

ONLY extract the MAIN TERMS/CONCEPTS being taught - ignore examples and supporting details!`,
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

CRITICAL RULES:
1. Extract ONLY the PRIMARY terms that are being DEFINED or EXPLAINED
2. Look for patterns like:
   - "Term name" followed by description/definition
   - Terms that have bullet points or indented text under them
   - Terms followed by "is", "are", "means", "refers to", "definition"
   - Section headers that introduce concepts
3. DO NOT extract examples, sub-points, or concepts mentioned in passing
4. Indented/bulleted text is usually supporting detail - extract the PARENT term, not the bullets
5. Extract EXACTLY how many main terms exist (could be 2, could be 20)

Example: If notes say "Marketing Myopia\n    A nearsighted focus\n    Lack of insight\n\nHow to fix it\n    Switch orientation" - extract ONLY "Marketing Myopia" and "How to fix it"

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

