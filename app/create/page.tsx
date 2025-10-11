'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import {
  Box,
  Container,
  VStack,
  Heading,
  Text,
  Input,
  Textarea,
  Button,
  Select,
  Progress,
  useToast,
  HStack,
} from '@chakra-ui/react'
import { Sparkles, Music } from 'lucide-react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../contexts/AuthContext'

export default function CreatePage() {
  const router = useRouter()
  const toast = useToast()
  const { user, loading: authLoading } = useAuth()
  
  const [subject, setSubject] = useState('')
  const [genre, setGenre] = useState('random')
  const [notes, setNotes] = useState('')
  const [generating, setGenerating] = useState(false)
  const [progress, setProgress] = useState(0)

  // Redirect if not logged in
  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/auth')
    }
  }, [user, authLoading, router])

  if (authLoading) {
    return (
      <Box minH="100vh" bg="#0f0f1a" display="flex" alignItems="center" justifyContent="center">
        <Text color="white">Loading...</Text>
      </Box>
    )
  }

  if (!user) {
    return null
  }

  const handleGenerate = async () => {
    if (!notes.trim()) {
      toast({
        title: 'Missing notes',
        description: 'Please enter your study notes',
        status: 'error',
        duration: 3000,
      })
      return
    }

    if (!supabase) {
      toast({
        title: 'Error',
        description: 'Database not configured',
        status: 'error',
        duration: 3000,
      })
      return
    }

    setGenerating(true)
    setProgress(10)

    try {
      // Split notes into lines (each line should be "Term — Definition")
      setProgress(20)
      const fullNotes = subject ? `${subject}\n\n${notes}` : notes
      const termsList = notes.split('\n').filter((line: string) => line.trim())
      setProgress(40)

      // Generate jingles for each term with full context
      const jingles: any[] = []
      for (let i = 0; i < termsList.length; i++) {
        const line = termsList[i].trim()
        
        // Send the full line (with definition) to generate the song
        const songResponse = await fetch('/api/generate-song', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            studyNotes: fullNotes.includes('\n\n') 
              ? `${subject}\n\n${line}` 
              : line,
            genre,
          }),
        })

        if (songResponse.ok) {
          const data = await songResponse.json()
          // Extract just the term name from "Term — Definition"
          const termName = line.split(/[—:-]/)[0]?.trim() || line.split(' ')[0]
          jingles.push({
            term: termName,
            lyrics: data.lyrics || '',
            audioUrl: data.audioUrl || null,
            notes: line,
            genre,
          })
        }

        setProgress(40 + ((i + 1) / termsList.length) * 50)
      }

      setProgress(95)

      // Save to Supabase with created_by
      const { data: newSet, error } = await supabase
        .from('sets')
        .insert({
          subject: subject || 'Untitled Study Set',
          jingles,
          created_by: user.id, // Set the creator
        })
        .select()
        .single()

      if (error) throw error

      setProgress(100)

      toast({
        title: 'Success!',
        description: 'Your study set has been created',
        status: 'success',
        duration: 3000,
      })

      // Navigate to the new set
      router.push(`/sets/${newSet.id}`)
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to generate study set',
        status: 'error',
        duration: 5000,
      })
    } finally {
      setGenerating(false)
      setProgress(0)
    }
  }

  return (
    <Box minH="100vh" bg="#0f0f1a" py={{ base: 8, md: 12 }}>
      <Container maxW="1200px" px={{ base: 4, md: 8 }}>
        <VStack spacing={8} align="stretch">
          <Box textAlign="center">
            <Heading
              size={{ base: "2xl", md: "4xl" }}
              fontWeight="900"
              bgGradient="linear(135deg, brand.400 0%, accent.400 100%)"
              bgClip="text"
              mb={2}
            >
              Create Study Set
            </Heading>
            <Text fontSize={{base: "sm", md: "md"}} color="whiteAlpha.600" fontWeight="500" maxW="xl" mx="auto">
              Paste your notes and we&apos;ll create catchy jingles for each term
            </Text>
          </Box>

          <VStack spacing={6} align="stretch" bg="rgba(26, 26, 46, 0.6)" p={{ base: 6, md: 8 }} borderRadius="2xl" borderWidth={2} borderColor="brand.500">
            <Box>
              <HStack mb={2} spacing={2}>
                <Text fontWeight="600" fontSize="sm" color="whiteAlpha.700" textTransform="uppercase" letterSpacing="wide">
                  Subject <Text as="span" color="whiteAlpha.500">(optional)</Text>
                </Text>
              </HStack>
              <Input
                placeholder="Biology, Chemistry, History..."
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                bg="rgba(42, 42, 64, 0.6)"
                borderColor="rgba(217, 70, 239, 0.2)"
                color="white"
                _hover={{ borderColor: 'brand.500' }}
                _focus={{ borderColor: 'brand.500', boxShadow: '0 0 0 1px #d946ef' }}
                h="56px"
                fontSize="md"
                borderRadius="xl"
              />
            </Box>

            <Box>
              <HStack mb={2} spacing={2}>
                <Music size={14} color="rgba(217, 70, 239, 0.8)" />
                <Text fontWeight="600" fontSize="sm" color="whiteAlpha.700" textTransform="uppercase" letterSpacing="wide">
                  Music Genre
                </Text>
              </HStack>
              <Select
                value={genre}
                onChange={(e) => setGenre(e.target.value)}
                bg="rgba(42, 42, 64, 0.6)"
                borderColor="rgba(217, 70, 239, 0.2)"
                color="white"
                _hover={{ borderColor: 'brand.500' }}
                _focus={{ borderColor: 'brand.500', boxShadow: '0 0 0 1px #d946ef' }}
                h="56px"
                fontSize="md"
                borderRadius="xl"
              >
                <option value="random">Random</option>
                <option value="pop">Pop</option>
                <option value="rnb">R&B</option>
                <option value="hiphop">Hip-Hop</option>
                <option value="kids">Kids Song</option>
                <option value="commercial">Commercial Jingle</option>
                <option value="jazz">Jazz</option>
                <option value="rock">Rock</option>
                <option value="folk">Folk</option>
              </Select>
            </Box>

            <Box>
              <HStack mb={2} spacing={2}>
                <Text fontWeight="600" fontSize="sm" color="whiteAlpha.700" textTransform="uppercase" letterSpacing="wide">
                  Study Notes <Text as="span" color="brand.400">(required)</Text>
                </Text>
              </HStack>
              <Textarea
                placeholder="Mitosis — Cell division that produces two identical daughter cells
Meiosis — Cell division that produces four gametes with half the chromosomes
Format: Term — Definition (one per line)"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                bg="rgba(42, 42, 64, 0.6)"
                borderColor="rgba(217, 70, 239, 0.2)"
                color="white"
                _hover={{ borderColor: 'brand.500' }}
                _focus={{ borderColor: 'brand.500', boxShadow: '0 0 0 1px #d946ef' }}
                minHeight="280px"
                fontSize="md"
                borderRadius="xl"
              />
            </Box>

            <Button
              leftIcon={<Sparkles size={22} />}
              onClick={handleGenerate}
              isLoading={generating}
              loadingText="Generating mnemonics..."
              size="lg"
              h="64px"
              fontSize="lg"
              bgGradient="linear(135deg, brand.500 0%, accent.500 100%)"
              color="white"
              fontWeight="700"
              _hover={{
                bgGradient: "linear(135deg, brand.600 0%, accent.600 100%)",
                transform: "translateY(-2px)"
              }}
              _active={{
                transform: "translateY(0)"
              }}
              transition="all 0.2s"
            >
              Generate Study Set
            </Button>

            {generating && (
              <VStack spacing={3} bg="rgba(42, 42, 64, 0.6)" p={4} borderRadius="xl" borderWidth={1} borderColor="rgba(217, 70, 239, 0.2)">
                <Progress
                  value={progress}
                  size="sm"
                  colorScheme="purple"
                  w="100%"
                  borderRadius="full"
                  bg="rgba(42, 42, 64, 0.8)"
                />
                <Text color="whiteAlpha.700" fontSize="sm">
                  Creating your AI-powered mnemonics...
                </Text>
              </VStack>
            )}
          </VStack>
        </VStack>
      </Container>
    </Box>
  )
}

