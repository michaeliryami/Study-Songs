'use client'

import { useParams, useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { Box, Container, Spinner, Text, VStack } from '@chakra-ui/react'
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
  const { user, loading: authLoading } = useAuth()
  const id = params.id as string
  const [studySet, setStudySet] = useState<StudySet | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

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
    <Box minH="100vh" bg="#0f0f1a" display="flex" alignItems="center" justifyContent="center">
      <Container maxW="1200px" w="100%" py={4} px={{ base: 4, md: 8 }}>
        <FlashcardPlayer studySet={studySet} />
      </Container>
    </Box>
  )
}

