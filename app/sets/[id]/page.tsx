'use client'

import { useParams, useRouter, useSearchParams } from 'next/navigation'
import { useEffect, useState } from 'react'
import { Box, Container, Spinner, Text, VStack, HStack, Progress } from '@chakra-ui/react'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../contexts/AuthContext'
import FlashcardPlayer from '../../components/FlashcardPlayer'

interface Jingle {
  term: string
  lyrics: string
  audioUrl: string | null
}

interface StudySet {
  id: number
  created_at: string
  subject: string
  jingles: Jingle[]
}

export default function SetPage() {
  const params = useParams()
  const router = useRouter()
  const searchParams = useSearchParams()
  const { user, loading: authLoading } = useAuth()
  const id = params.id as string
  const [studySet, setStudySet] = useState<StudySet | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  
  // Real-time generation state
  const [isGenerating, setIsGenerating] = useState(searchParams.get('generating') === 'true')
  const [totalTerms, setTotalTerms] = useState(parseInt(searchParams.get('totalTerms') || '0'))
  const [currentTermIndex, setCurrentTermIndex] = useState(0)
  const [currentTerm, setCurrentTerm] = useState('')
  const [genreParam, setGenreParam] = useState(searchParams.get('genre') || 'random')

  // Redirect if not logged in
  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/auth')
    }
  }, [user, authLoading, router])

  useEffect(() => {
    async function loadSet() {
      try {
        if (!supabase) {
          throw new Error('Database not configured')
        }

        if (!user) {
          return // Wait for auth
        }

        const { data, error } = await supabase
          .from('sets')
          .select('*')
          .eq('id', id)
          .single()

        if (error) throw error

        setStudySet(data)
      } catch (err: any) {
        setError(err.message || 'Failed to load study set')
      } finally {
        setLoading(false)
      }
    }

    if (id && user) {
      loadSet()
    }
  }, [id, user])

  // Handle real-time generation
  useEffect(() => {
    async function generateJingles() {
      if (!isGenerating || !studySet || !supabase) return
      
      const notesParam = searchParams.get('notes')
      if (!notesParam) return
      
      try {
        const termsList = JSON.parse(decodeURIComponent(notesParam))
        
        const jingles: any[] = [...(studySet.jingles || [])]
        
        for (let i = 0; i < termsList.length; i++) {
          const line = termsList[i].trim()
          setCurrentTermIndex(i + 1)
          
          // Extract term and definition
          const separatorMatch = line.match(/[—:-]/)
          let term = line
          let definition = line
          
          if (separatorMatch) {
            const parts = line.split(separatorMatch[0])
            term = parts[0].trim()
            definition = line
          }
          
          setCurrentTerm(term)
          
          // Generate song
          const songResponse = await fetch('/api/generate-song', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              studyNotes: definition,
              genre: genreParam,
            }),
          })

          if (songResponse.ok) {
            const data = await songResponse.json()
            const newJingle = {
              term: term,
              lyrics: data.lyrics || '',
              audioUrl: data.audioUrl || null,
              notes: definition,
              genre: genreParam,
            }
            jingles.push(newJingle)
            
            // Update Supabase and local state immediately
            await supabase
              .from('sets')
              .update({ jingles: jingles })
              .eq('id', id)
            
            setStudySet({ ...studySet, jingles: [...jingles] })
          }
        }
        
        setIsGenerating(false)
        setCurrentTerm('')
      } catch (err) {
        console.error('Generation error:', err)
        setIsGenerating(false)
      }
    }
    
    if (isGenerating && studySet) {
      generateJingles()
    }
  }, [isGenerating, studySet, id, searchParams, genreParam])

  if (authLoading || loading) {
    return (
      <Box minH="100vh" bg="#0f0f1a" display="flex" alignItems="center" justifyContent="center">
        <VStack spacing={4}>
          <Spinner size="xl" color="brand.500" thickness="4px" />
          <Text color="whiteAlpha.700">Loading study set...</Text>
        </VStack>
      </Box>
    )
  }

  if (!user) {
    return null // Will redirect
  }

  if (error || !studySet) {
    return (
      <Box minH="100vh" bg="#0f0f1a" display="flex" alignItems="center" justifyContent="center">
        <VStack spacing={4}>
          <Text color="red.400" fontSize="xl">
            {error || 'Study set not found'}
          </Text>
        </VStack>
      </Box>
    )
  }

  return (
    <Box minH="100vh" bg="#0f0f1a">
      {/* Real-time generation progress bar at the top */}
      {isGenerating && currentTerm && (
        <Box 
          position="sticky" 
          top={0} 
          zIndex={1000} 
          bg="rgba(15, 15, 26, 0.95)" 
          backdropFilter="blur(20px)"
          borderBottom="2px solid"
          borderColor="brand.500"
          py={3}
          px={4}
        >
          <Container maxW="1200px">
            <VStack spacing={2}>
              <HStack w="100%" justify="space-between">
                <Text color="whiteAlpha.700" fontSize="sm" fontWeight="600">
                  Generating term {currentTermIndex} of {totalTerms}
                </Text>
                <Text color="brand.300" fontSize="sm" fontWeight="600">
                  {Math.round((currentTermIndex / totalTerms) * 100)}%
                </Text>
              </HStack>
              <Progress
                value={(currentTermIndex / totalTerms) * 100}
                size="sm"
                w="100%"
                borderRadius="full"
                bg="rgba(42, 42, 64, 0.8)"
                sx={{
                  '& > div': {
                    background: 'linear-gradient(135deg, #d946ef 0%, #f97316 100%)',
                  },
                }}
              />
              <Text color="whiteAlpha.600" fontSize="xs" isTruncated maxW="100%">
                Currently generating: {currentTerm}
              </Text>
            </VStack>
          </Container>
        </Box>
      )}
      
      <Container maxW="1200px" w="100%" py={4} px={{ base: 4, md: 8 }}>
        {studySet && studySet.jingles.length > 0 ? (
          <FlashcardPlayer studySet={studySet} />
        ) : (
          <VStack spacing={4} py={20}>
            <Spinner size="xl" color="brand.500" thickness="4px" />
            <Text color="whiteAlpha.700">Generating your first mnemonic...</Text>
          </VStack>
        )}
      </Container>
    </Box>
  )
}

