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
import FlashcardPlayer from '../components/FlashcardPlayer'

export default function CreatePage() {
  const router = useRouter()
  const toast = useToast()
  const { user, loading: authLoading } = useAuth()
  
  const [subject, setSubject] = useState('')
  const [genre, setGenre] = useState('random')
  const [notes, setNotes] = useState('')
  const [generating, setGenerating] = useState(false)
  const [progress, setProgress] = useState(0)
  const [currentTerm, setCurrentTerm] = useState('')
  const [totalTerms, setTotalTerms] = useState(0)
  const [currentTermIndex, setCurrentTermIndex] = useState(0)
  const [generatedJingles, setGeneratedJingles] = useState<any[]>([])
  const [studySetId, setStudySetId] = useState<number | null>(null)

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
      // First, let AI intelligently extract the main terms from the notes
      setProgress(20)
      const fullNotes = subject ? `${subject}\n\n${notes}` : notes
      
      const termsResponse = await fetch('/api/generate-terms', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ subject: fullNotes }),
      })

      if (!termsResponse.ok) {
        throw new Error('Failed to extract terms from notes')
      }

      const { terms } = await termsResponse.json()
      const termsList = terms.split('\n').filter((line: string) => line.trim())
      setTotalTerms(termsList.length)
      setProgress(40)

      // Create the study set immediately so we can add jingles to it in real-time
      const { data: newSet, error: createError } = await supabase
        .from('sets')
        .insert({
          subject: subject || 'Untitled Study Set',
          jingles: [],
          created_by: user.id,
        })
        .select()
        .single()

      if (createError) throw createError
      
      const setId = newSet.id
      setStudySetId(setId)

      // Generate jingles for each term-definition pair and update in real-time
      const jingles: any[] = []
      for (let i = 0; i < termsList.length; i++) {
        const line = termsList[i].trim()
        setCurrentTermIndex(i + 1)
        
        // Extract term and definition from "Term — Definition" format
        const separatorMatch = line.match(/[—:-]/)
        let term = line
        let definition = line
        
        if (separatorMatch) {
          const parts = line.split(separatorMatch[0])
          term = parts[0].trim()
          definition = line // Keep full line with separator for context
        }
        
        setCurrentTerm(term)
        
        // Generate song with the specific term-definition pair
        const songResponse = await fetch('/api/generate-song', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            studyNotes: definition,
            genre,
          }),
        })

        if (songResponse.ok) {
          const data = await songResponse.json()
          const newJingle = {
            term: term,
            lyrics: data.lyrics || '',
            audioUrl: data.audioUrl || null,
            notes: definition,
            genre,
          }
          jingles.push(newJingle)
          
          // Update UI immediately with new jingle
          setGeneratedJingles([...jingles])
          
          // Update Supabase in real-time
          await supabase
            .from('sets')
            .update({ jingles: jingles })
            .eq('id', setId)
        }

        setProgress(40 + ((i + 1) / termsList.length) * 50)
      }

      setProgress(100)
      setCurrentTerm('')
      
      toast({
        title: 'Complete!',
        description: `Generated ${termsList.length} mnemonics`,
        status: 'success',
        duration: 3000,
      })
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
    <Box minH="100vh" bg="#0f0f1a" py={{ base: 6, md: 12 }}>
      <Container maxW="1200px" px={{ base: 3, sm: 4, md: 8 }}>
        <VStack spacing={{ base: 6, md: 8 }} align="stretch">
          <Box textAlign="center">
            <Heading
              size={{ base: "xl", sm: "2xl", md: "4xl" }}
              fontWeight="900"
              bgGradient="linear(135deg, brand.400 0%, accent.400 100%)"
              bgClip="text"
              mb={2}
              px={{ base: 2, sm: 0 }}
            >
              Create Study Set
            </Heading>
            <Text fontSize={{ base: "sm", sm: "md" }} color="whiteAlpha.600" fontWeight="500" maxW="xl" mx="auto" px={{ base: 4, sm: 0 }}>
              Paste your notes and we&apos;ll create catchy jingles for each term
            </Text>
          </Box>

          <VStack spacing={{ base: 4, md: 6 }} align="stretch" bg="rgba(26, 26, 46, 0.6)" p={{ base: 4, sm: 6, md: 8 }} borderRadius="2xl" borderWidth={2} borderColor="brand.500">
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
                h={{ base: "48px", sm: "56px" }}
                fontSize={{ base: "sm", sm: "md" }}
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
                h={{ base: "48px", sm: "56px" }}
                fontSize={{ base: "sm", sm: "md" }}
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
                minHeight={{ base: "200px", sm: "280px" }}
                fontSize={{ base: "sm", sm: "md" }}
                borderRadius="xl"
              />
            </Box>

            <Button
              leftIcon={<Sparkles size={22} />}
              onClick={handleGenerate}
              isLoading={generating}
              loadingText="Generating mnemonics..."
              size={{ base: "md", sm: "lg" }}
              h={{ base: "56px", sm: "64px" }}
              fontSize={{ base: "md", sm: "lg" }}
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
              w="full"
            >
              Generate Study Set
            </Button>

            {generating && currentTerm && (
              <VStack spacing={3} bg="rgba(42, 42, 64, 0.6)" p={4} borderRadius="xl" borderWidth={1} borderColor="rgba(217, 70, 239, 0.2)">
                <HStack w="100%" justify="space-between">
                  <Text color="whiteAlpha.700" fontSize="sm" fontWeight="600">
                    Generating term {currentTermIndex} of {totalTerms}
                  </Text>
                  <Text color="brand.300" fontSize="sm" fontWeight="600">
                    {Math.round(progress)}%
                  </Text>
                </HStack>
                <Progress
                  value={progress}
                  size="sm"
                  colorScheme="purple"
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
            )}
          </VStack>

          {/* Show FlashcardPlayer in real-time as cards are generated */}
          {generatedJingles.length > 0 && studySetId && (
            <Box mt={8}>
              <FlashcardPlayer 
                studySet={{
                  id: studySetId,
                  created_at: new Date().toISOString(),
                  subject: subject || 'Untitled Study Set',
                  jingles: generatedJingles,
                }}
              />
            </Box>
          )}
        </VStack>
      </Container>
    </Box>
  )
}

