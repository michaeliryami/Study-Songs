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
  Card,
  CardBody,
  FormControl,
  FormLabel,
} from '@chakra-ui/react'
import { Sparkles, Music, BookOpen, Palette, FileText } from 'lucide-react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../contexts/AuthContext'
import { useSubscription } from '../hooks/useSubscription'
import PageHeader from '../components/PageHeader'

export default function CreatePage() {
  const router = useRouter()
  const toast = useToast()
  const { user, loading: authLoading } = useAuth()
  const { tier, features, loading: subscriptionLoading } = useSubscription()

  const [subject, setSubject] = useState('')
  const [genre, setGenre] = useState('random')
  const [customGenre, setCustomGenre] = useState('')
  const [notes, setNotes] = useState('')
  const [generating, setGenerating] = useState(false)
  const [progress, setProgress] = useState(0)
  const [currentTermNum, setCurrentTermNum] = useState(0)
  const [currentTermName, setCurrentTermName] = useState('')
  const [totalTerms, setTotalTerms] = useState(0)

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

    // Validate custom genre for premium users
    if (genre === 'custom' && (!customGenre.trim() || customGenre.trim().length < 10)) {
      toast({
        title: 'Invalid custom genre',
        description: 'Please enter at least 10 characters for your custom music style',
        status: 'error',
        duration: 3000,
      })
      return
    }

    // No set limits for any subscription tier

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

      // Generate jingles for each term-definition pair
      const jingles: any[] = []
      for (let i = 0; i < termsList.length; i++) {
        const line = termsList[i].trim()

        // Extract term and definition from "Term — Definition" format
        const separatorMatch = line.match(/[—:-]/)
        let term = line
        let definition = line

        if (separatorMatch) {
          const parts = line.split(separatorMatch[0])
          term = parts[0].trim()
          definition = line // Keep full line with separator for context
        }

        // Update current term being generated
        setCurrentTermNum(i + 1)
        setCurrentTermName(term)

        // Determine the genre to use (custom genre for premium users)
        const selectedGenre = genre === 'custom' && customGenre.trim() ? customGenre.trim() : genre

        // Generate ONLY lyrics first (skip audio for speed)
        const songResponse = await fetch('/api/generate-song', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            studyNotes: definition,
            genre: selectedGenre,
            skipAudio: true, // Skip audio generation initially
            userId: user.id, // Pass userId for token deduction
          }),
        })

        if (songResponse.ok) {
          const data = await songResponse.json()
          jingles.push({
            term: term,
            lyrics: data.lyrics || '',
            audioUrl: null, // No audio yet - will generate in background
            notes: definition,
            genre: selectedGenre,
          })
        } else if (songResponse.status === 403) {
          // Insufficient tokens
          const errorData = await songResponse.json()
          throw new Error(errorData.error || 'Insufficient tokens')
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
    <Box minH="100vh" bg="#0f0f1a" py={{ base: 6, md: 12 }}>
      <Container maxW="1200px" px={{ base: 3, sm: 4, md: 8 }}>
        <VStack spacing={{ base: 6, md: 8 }} align="stretch">
          <PageHeader
            title="Create Study Set"
            subtitle="Paste your notes and we'll create catchy jingles for each term"
          />

          {/* Free user limit warning - only show when not loading and confirmed free tier */}
          {!subscriptionLoading && tier === 'free' && (
            <Box
              bg="rgba(251, 146, 60, 0.1)"
              border="1px solid"
              borderColor="accent.500"
              borderRadius="lg"
              p={4}
              maxW="md"
              mx="auto"
            >
              <Text fontSize="sm" color="accent.300" fontWeight="600" mb={1}>
                ⚠️ Free Plan Limit
              </Text>
              <Text fontSize="xs" color="whiteAlpha.700">
                You have 10 tokens to create jingles. Upgrade for more tokens and premium features.
              </Text>
            </Box>
          )}

          {/* Three separate cards */}
          <VStack spacing={6} align="stretch">
            {/* Card 1: Study Set Title */}
            <Card
              bg="rgba(26, 26, 46, 0.6)"
              borderWidth={2}
              borderColor="rgba(217, 70, 239, 0.3)"
              borderRadius="2xl"
              transition="all 0.3s"
              _hover={{
                borderColor: 'brand.500',
                transform: 'translateY(-2px)',
                boxShadow: '0 10px 30px rgba(217, 70, 239, 0.2)',
              }}
            >
              <CardBody p={6}>
                <VStack spacing={4} align="stretch">
                  <HStack spacing={3}>
                    <Box p={2} bg="rgba(217, 70, 239, 0.1)" borderRadius="lg">
                      <BookOpen size={20} color="#d946ef" />
                    </Box>
                    <VStack align="start" spacing={1}>
                      <Text fontWeight="700" fontSize="lg" color="white">
                        Study Set Title
                      </Text>
                      <Text fontSize="sm" color="whiteAlpha.600">
                        Give your study set a name (optional)
                      </Text>
                    </VStack>
                  </HStack>

                  <FormControl>
                    <Input
                      placeholder="Biology, Chemistry, History..."
                      value={subject}
                      onChange={e => setSubject(e.target.value)}
                      bg="rgba(42, 42, 64, 0.6)"
                      borderColor="rgba(217, 70, 239, 0.2)"
                      color="white"
                      _hover={{ borderColor: 'brand.500' }}
                      _focus={{ borderColor: 'brand.500', boxShadow: '0 0 0 1px #d946ef' }}
                      h="48px"
                      fontSize="16px"
                      borderRadius="xl"
                    />
                  </FormControl>
                </VStack>
              </CardBody>
            </Card>

            {/* Card 2: Music Genre */}
            <Card
              bg="rgba(26, 26, 46, 0.6)"
              borderWidth={2}
              borderColor="rgba(217, 70, 239, 0.3)"
              borderRadius="2xl"
              transition="all 0.3s"
              _hover={{
                borderColor: 'brand.500',
                transform: 'translateY(-2px)',
                boxShadow: '0 10px 30px rgba(217, 70, 239, 0.2)',
              }}
            >
              <CardBody p={6}>
                <VStack spacing={4} align="stretch">
                  <HStack spacing={3}>
                    <Box p={2} bg="rgba(217, 70, 239, 0.1)" borderRadius="lg">
                      <Palette size={20} color="#d946ef" />
                    </Box>
                    <VStack align="start" spacing={1}>
                      <Text fontWeight="700" fontSize="lg" color="white">
                        Music Genre
                      </Text>
                      <Text fontSize="sm" color="whiteAlpha.600">
                        Choose the style for your jingles
                      </Text>
                    </VStack>
                  </HStack>

                  <FormControl>
                    <Select
                      value={genre}
                      onChange={e => {
                        setGenre(e.target.value)
                        if (e.target.value !== 'custom') {
                          setCustomGenre('')
                        }
                      }}
                      bg="rgba(42, 42, 64, 0.6)"
                      borderColor="rgba(217, 70, 239, 0.2)"
                      color="white"
                      _hover={{ borderColor: 'brand.500' }}
                      _focus={{ borderColor: 'brand.500', boxShadow: '0 0 0 1px #d946ef' }}
                      h="48px"
                      fontSize="16px"
                      borderRadius="xl"
                    >
                      <option value="random" style={{ backgroundColor: '#2a2a40', color: 'white' }}>
                        🎲 Random
                      </option>
                      <option value="pop" style={{ backgroundColor: '#2a2a40', color: 'white' }}>
                        🎵 Pop
                      </option>
                      <option value="rnb" style={{ backgroundColor: '#2a2a40', color: 'white' }}>
                        🎤 R&B
                      </option>
                      <option value="hiphop" style={{ backgroundColor: '#2a2a40', color: 'white' }}>
                        🎤 Hip-Hop
                      </option>
                      <option value="rock" style={{ backgroundColor: '#2a2a40', color: 'white' }}>
                        🎸 Rock
                      </option>
                      <option
                        value="country"
                        style={{ backgroundColor: '#2a2a40', color: 'white' }}
                      >
                        🤠 Country
                      </option>
                      <option
                        value="electronic"
                        style={{ backgroundColor: '#2a2a40', color: 'white' }}
                      >
                        🎛️ Electronic
                      </option>
                      {tier === 'premium' && (
                        <option
                          value="custom"
                          style={{ backgroundColor: '#2a2a40', color: 'white' }}
                        >
                          ✨ Other custom
                        </option>
                      )}
                    </Select>
                  </FormControl>

                  {/* Custom genre input for premium users */}
                  {tier === 'premium' && genre === 'custom' && (
                    <FormControl>
                      <VStack spacing={2} align="stretch">
                        <Text fontSize="sm" color="brand.300" fontWeight="600">
                          Premium Feature: Custom AI Prompts
                        </Text>
                        <Text fontSize="xs" color="whiteAlpha.600">
                          Describe exactly how you want your jingles to sound. Be creative!
                          Examples: &quot;upbeat pop with electronic beats and catchy hooks&quot; or &quot;acoustic
                          folk with harmonica and storytelling lyrics&quot;
                        </Text>
                        <Input
                          placeholder="Describe your custom music style (min 10 characters)..."
                          value={customGenre}
                          onChange={e => setCustomGenre(e.target.value)}
                          bg="rgba(42, 42, 64, 0.6)"
                          borderColor="rgba(217, 70, 239, 0.2)"
                          color="white"
                          _hover={{ borderColor: 'brand.500' }}
                          _focus={{ borderColor: 'brand.500', boxShadow: '0 0 0 1px #d946ef' }}
                          h="48px"
                          fontSize="16px"
                          borderRadius="xl"
                        />
                        {customGenre.length > 0 && customGenre.length < 10 && (
                          <Text fontSize="xs" color="red.400" mt={1}>
                            Minimum 10 characters required
                          </Text>
                        )}
                      </VStack>
                    </FormControl>
                  )}
                </VStack>
              </CardBody>
            </Card>

            {/* Card 3: Study Notes */}
            <Card
              bg="rgba(26, 26, 46, 0.6)"
              borderWidth={2}
              borderColor="rgba(217, 70, 239, 0.3)"
              borderRadius="2xl"
              transition="all 0.3s"
              _hover={{
                borderColor: 'brand.500',
                transform: 'translateY(-2px)',
                boxShadow: '0 10px 30px rgba(217, 70, 239, 0.2)',
              }}
            >
              <CardBody p={6}>
                <VStack spacing={4} align="stretch">
                  <HStack spacing={3}>
                    <Box p={2} bg="rgba(217, 70, 239, 0.1)" borderRadius="lg">
                      <FileText size={20} color="#d946ef" />
                    </Box>
                    <VStack align="start" spacing={1}>
                      <Text fontWeight="700" fontSize="lg" color="white">
                        Study Notes
                      </Text>
                      <Text fontSize="sm" color="whiteAlpha.600">
                        Paste your notes here - no need for term definition format
                      </Text>
                    </VStack>
                  </HStack>

                  <FormControl>
                    <Textarea
                        placeholder="Paste your study material in any format - we'll extract the key concepts! For best results, use clear term-definition pairs (e.g., 'Photosynthesis - the process by which plants convert sunlight into energy'). We're smart enough to work with your notes however you write them."
                      value={notes}
                      onChange={e => setNotes(e.target.value)}
                      bg="rgba(42, 42, 64, 0.6)"
                      borderColor="rgba(217, 70, 239, 0.2)"
                      color="white"
                      _hover={{ borderColor: 'brand.500' }}
                      _focus={{ borderColor: 'brand.500', boxShadow: '0 0 0 1px #d946ef' }}
                      minH="140px"
                      fontSize="16px"
                      borderRadius="xl"
                      resize="vertical"
                    />
                  </FormControl>
                </VStack>
              </CardBody>
            </Card>

            {/* Generate Button */}
            <Button
              onClick={handleGenerate}
              disabled={generating || !notes.trim() || subscriptionLoading}
              bgGradient="linear(135deg, brand.500 0%, accent.500 100%)"
              color="white"
              size="lg"
              h="64px"
              fontSize="lg"
              fontWeight="700"
              leftIcon={<Sparkles size={20} />}
              _hover={{
                bgGradient: 'linear(135deg, brand.600 0%, accent.600 100%)',
                transform: 'translateY(-2px)',
                boxShadow: '0 8px 25px rgba(217, 70, 239, 0.4)',
              }}
              _disabled={{
                opacity: 0.5,
                cursor: 'not-allowed',
                transform: 'none',
                boxShadow: 'none',
              }}
              transition="all 0.2s"
            >
              {subscriptionLoading
                ? 'Loading...'
                : generating
                  ? 'Generating...'
                  : 'Generate Study Set'}
            </Button>

            {generating && (
              <VStack
                spacing={3}
                bg="rgba(42, 42, 64, 0.6)"
                p={4}
                borderRadius="xl"
                borderWidth={1}
                borderColor="rgba(217, 70, 239, 0.2)"
              >
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
