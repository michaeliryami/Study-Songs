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
              content: `You are an expert at extracting terms and their definitions from study materials.

CRITICAL RULES:
1. Extract ONLY the PRIMARY terms being taught/defined
2. For EACH term, include its FULL definition/explanation
3. Format: "Term — Definition" (one per line)
4. Combine all bullet points/indented text under a term into ONE definition
5. If a term has multiple sub-points, combine them into a single coherent definition
6. If given only a subject name (no notes), generate 5-8 fundamental concepts with definitions

Examples:
INPUT: "Marketing Myopia\nMarketing myopia definition\n        A nearsighted focus on selling products\n        Lack of insight\n\nHow to get rid of marketing myopia\n        Switching from production to consumer\n        Focus on customer needs"
OUTPUT:
Marketing Myopia — A nearsighted focus on selling products rather than seeing the big picture of what consumers want. It's a lack of insight into what a business is doing for its customers.
How to get rid of marketing myopia — Switch from production orientation to consumer orientation by asking what you're really doing for the customer and focusing on customer needs.

INPUT: "Photosynthesis: Plants use light to make glucose\nCellular Respiration: Cells break down glucose for energy"
OUTPUT:
Photosynthesis — Plants use light to make glucose
Cellular Respiration — Cells break down glucose for energy

Extract each main term with its COMPLETE definition on one line!`,
            },
            {
              role: 'user',
              content: `Extract the main terms with their full definitions. Format each as "Term — Definition" on one line:

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
              content: `You are an expert at extracting terms and their definitions from study materials.

CRITICAL RULES:
1. Extract ONLY the PRIMARY terms being taught/defined
2. For EACH term, include its FULL definition/explanation
3. Format: "Term — Definition" (one per line)
4. Combine all bullet points/indented text under a term into ONE definition
5. If a term has multiple sub-points, combine them into a single coherent definition

Example: If notes say "Marketing Myopia\n    A nearsighted focus\n    Lack of insight\n\nHow to fix it\n    Switch orientation\n    Focus on customers" 

Output:
Marketing Myopia — A nearsighted focus on products rather than customers. It's a lack of insight into what the business does for customers.
How to fix it — Switch from production to consumer orientation and focus on what you're doing for customers.

Extract each term with its COMPLETE definition:

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

