'use client'

import {
  Box,
  Button,
  Container,
  Heading,
  Input,
  Textarea,
  VStack,
  Text,
  useToast,
  HStack,
  Progress,
  Select,
} from '@chakra-ui/react'
import { Music, BookOpen, FileText, Zap, Radio } from 'lucide-react'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import SuccessAnimation from '../components/SuccessAnimation'

interface Jingle {
  term: string
  lyrics: string
  audioUrl: string | null
  notes: string
  genre?: string
}

export default function CreatePage() {
  const [subject, setSubject] = useState('')
  const [notes, setNotes] = useState('')
  const [genre, setGenre] = useState('random')
  const [loading, setLoading] = useState(false)
  const [generationProgress, setGenerationProgress] = useState({ current: 0, total: 0 })
  const [showSuccess, setShowSuccess] = useState(false)
  const [jingleCount, setJingleCount] = useState(0)
  const toast = useToast()
  const router = useRouter()

  // Helper function to extract specific definition for a term from notes
  const extractDefinitionForTerm = (term: string, allNotes: string): string => {
    if (!allNotes.trim()) return ''
    
    // Split notes by lines
    const lines = allNotes.split('\n')
    
    // Look for the term (case-insensitive) followed by — or : or -
    const termLower = term.toLowerCase().trim()
    
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim()
      if (!line) continue
      
      // Check if this line starts with the term
      const lineLower = line.toLowerCase()
      if (lineLower.startsWith(termLower)) {
        // Found the term! Extract everything after — or : or -
        const separators = ['—', ':', '-', '–']
        for (const sep of separators) {
          if (line.includes(sep)) {
            const parts = line.split(sep)
            if (parts.length >= 2) {
              // Return the definition part (everything after the separator)
              return parts.slice(1).join(sep).trim()
            }
          }
        }
        // If no separator found, return the whole line
        return line
      }
    }
    
    // If not found as a standalone line, return empty
    return ''
  }

  const generateStudySet = async () => {
    if (!notes.trim()) {
      toast({
        title: 'Please paste your study notes',
        description: 'Notes are required to generate mnemonics',
        status: 'warning',
        duration: 3000,
        isClosable: true,
      })
      return
    }

    // Step 1: Extract terms from notes automatically
    setLoading(true)
    setGenerationProgress({ current: 0, total: 1 })

    let termList: string[] = []
    
    try {
      const response = await fetch('/api/generate-terms', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          subject: subject.trim() ? `${subject}\n\nStudy Notes:\n${notes}` : `Study Notes:\n${notes}`
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to extract terms')
      }

      termList = data.terms.split('\n').filter((t: string) => t.trim())
      
      if (termList.length === 0) {
        toast({
          title: 'No terms found',
          description: 'Could not extract terms from your notes. Please check your formatting.',
          status: 'error',
          duration: 5000,
          isClosable: true,
        })
        setLoading(false)
        return
      }
    } catch (error) {
      toast({
        title: 'Error extracting terms',
        description: error instanceof Error ? error.message : 'Failed to extract terms',
        status: 'error',
        duration: 5000,
        isClosable: true,
      })
      setLoading(false)
      return
    }

    // Step 2: Generate jingles for each term
    setGenerationProgress({ current: 0, total: termList.length })

    const generatedJingles: Jingle[] = []
    const finalSubject = subject.trim() || 'Study Set'

    for (let i = 0; i < termList.length; i++) {
      const term = termList[i].trim()
      setGenerationProgress({ current: i + 1, total: termList.length })

      // Declare outside try so it's in scope for catch as well
      let studyNotes = ''
      try {
        // Extract ONLY the definition for this specific term from notes
        const termDefinition = extractDefinitionForTerm(term, notes)
        
        if (termDefinition) {
          // Found specific definition for this term
          studyNotes = `${term}: ${termDefinition}`
        } else {
          // Term not found in notes; fallback to term only
          studyNotes = `${term}: ${notes}`
        }
        
        const response = await fetch('/api/generate-song', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ studyNotes, genre }),
        })

        const data = await response.json()

        if (response.ok) {
          generatedJingles.push({
            term,
            lyrics: data.lyrics || '',
            audioUrl: data.audioUrl || null,
            notes: studyNotes,
            genre,
          })
        } else {
          generatedJingles.push({
            term,
            lyrics: `Failed to generate: ${data.error || 'Unknown error'}`,
            audioUrl: null,
            notes: studyNotes,
            genre,
          })
        }
      } catch (error) {
        generatedJingles.push({
          term,
          lyrics: `Error: ${error instanceof Error ? error.message : 'Unknown error'}`,
          audioUrl: null,
          notes: studyNotes,
          genre,
        })
      }
    }

    setLoading(false)
    setGenerationProgress({ current: 0, total: 0 })
    setJingleCount(generatedJingles.length)
    
    // Save to database and redirect to set page
    try {
      const { supabase } = await import('../lib/supabase')
      
      if (!supabase) {
        // No Supabase configured - store in sessionStorage and go to my-sets
        sessionStorage.setItem('newStudySet', JSON.stringify({
          subject: finalSubject,
          jingles: generatedJingles,
          setNotes: notes,
        }))
        
        setShowSuccess(true)
        setTimeout(() => {
          setShowSuccess(false)
          router.push('/my-sets')
        }, 3000)
        return
      }

      const { data, error } = await supabase
        .from('sets')
        .insert({
          subject: finalSubject,
          jingles: generatedJingles,
        })
        .select()

      if (error) throw error

      // Show success animation
      setShowSuccess(true)
      setTimeout(() => {
        setShowSuccess(false)
        // Redirect to the individual set page
        if (data && data.length > 0) {
          router.push(`/sets/${data[0].id}`)
        } else {
          router.push('/my-sets')
        }
      }, 3000)
    } catch (error) {
      console.error('Error saving study set:', error)
      toast({
        title: 'Study set created',
        description: 'Redirecting to your sets...',
        status: 'success',
        duration: 2000,
        isClosable: true,
      })
      
      // Fallback to sessionStorage
      sessionStorage.setItem('newStudySet', JSON.stringify({
        subject: finalSubject,
        jingles: generatedJingles,
        setNotes: notes,
      }))
      
      setTimeout(() => {
        router.push('/my-sets')
      }, 2000)
    }
  }

  if (showSuccess) {
    return (
      <Box minH="100vh" bg="#0f0f1a" display="flex" alignItems="center" justifyContent="center">
        <Container maxW="container.xl">
          <SuccessAnimation count={jingleCount} subject={subject || 'Study Set'} />
        </Container>
      </Box>
    )
  }

  return (
    <Box minH="100vh" bg="#0f0f1a" py={{ base: 8, md: 12 }}>
      <Container maxW="1200px" w="100%" px={{ base: 4, md: 8 }}>
        <VStack spacing={8} align="stretch">
          <Box textAlign="center">
            <Heading 
              as="h1" 
              fontSize={{base: "2xl", md: "4xl"}} 
              fontWeight="900" 
              mb={2} 
              letterSpacing="-0.03em"
              bgGradient="linear(135deg, brand.400 0%, accent.400 100%)"
              bgClip="text"
            >
              Create Study Set
            </Heading>
            <Text fontSize={{base: "sm", md: "md"}} color="whiteAlpha.600" fontWeight="500" maxW="xl" mx="auto">
              Paste your notes and we'll create catchy jingles for each term
            </Text>
          </Box>

          <VStack spacing={6} align="stretch" bg="rgba(26, 26, 46, 0.6)" p={{ base: 6, md: 8 }} borderRadius="2xl" borderWidth={2} borderColor="brand.500">
            <Box>
              <HStack mb={2} spacing={2}>
                <BookOpen size={16} />
                <Text fontWeight="600" fontSize="sm" color="whiteAlpha.700" textTransform="uppercase" letterSpacing="wide">
                  Set Title <Text as="span" color="whiteAlpha.500">(optional)</Text>
                </Text>
              </HStack>
              <Input
                placeholder="e.g., World War II, Biology Chapter 5"
                value={subject}
                onChange={e => setSubject(e.target.value)}
                bg="rgba(42, 42, 64, 0.6)"
                borderColor="rgba(217, 70, 239, 0.2)"
                borderRadius="xl"
                color="white"
                fontWeight="500"
                fontSize="md"
                h="56px"
                _placeholder={{ color: 'whiteAlpha.400' }}
                _hover={{ borderColor: 'brand.500' }}
                _focus={{ 
                  borderColor: 'brand.500',
                  boxShadow: '0 0 0 1px #d946ef'
                }}
              />
            </Box>

            <Box>
              <HStack mb={2} spacing={2}>
                <Radio size={16} />
                <Text fontWeight="600" fontSize="sm" color="whiteAlpha.700" textTransform="uppercase" letterSpacing="wide">
                  Music Genre
                </Text>
              </HStack>
              <Select
                value={genre}
                onChange={e => setGenre(e.target.value)}
                bg="rgba(42, 42, 64, 0.6)"
                borderColor="rgba(217, 70, 239, 0.2)"
                borderRadius="xl"
                color="white"
                fontWeight="500"
                fontSize="md"
                h="56px"
                _hover={{ borderColor: 'brand.500' }}
                _focus={{ 
                  borderColor: 'brand.500',
                  boxShadow: '0 0 0 1px #d946ef'
                }}
              >
                <option value="random" style={{ background: '#1a1a2e' }}>Random</option>
                <option value="pop" style={{ background: '#1a1a2e' }}>Pop</option>
                <option value="rnb" style={{ background: '#1a1a2e' }}>R&B</option>
                <option value="hiphop" style={{ background: '#1a1a2e' }}>Hip-Hop</option>
                <option value="kids" style={{ background: '#1a1a2e' }}>Kids Song</option>
                <option value="commercial" style={{ background: '#1a1a2e' }}>Commercial Jingle</option>
                <option value="jazz" style={{ background: '#1a1a2e' }}>Jazz</option>
                <option value="rock" style={{ background: '#1a1a2e' }}>Rock</option>
                <option value="folk" style={{ background: '#1a1a2e' }}>Folk</option>
              </Select>
            </Box>

            <Box>
              <HStack mb={2} spacing={2}>
                <FileText size={16} />
                <Text fontWeight="600" fontSize="sm" color="whiteAlpha.700" textTransform="uppercase" letterSpacing="wide">
                  Study Notes <Text as="span" color="brand.400">(required)</Text>
                </Text>
              </HStack>
              <Textarea
                placeholder="Pearl Harbor — Attack on US naval base by Japan on December 7, 1941

D-Day — Allied invasion of Normandy on June 6, 1944

Format: Term — Definition"
                value={notes}
                onChange={e => setNotes(e.target.value)}
                bg="rgba(42, 42, 64, 0.6)"
                borderColor="rgba(217, 70, 239, 0.2)"
                borderRadius="xl"
                color="white"
                fontWeight="500"
                fontSize="md"
                minHeight="280px"
                resize="vertical"
                _placeholder={{ color: 'whiteAlpha.400' }}
                _hover={{ borderColor: 'brand.500' }}
                _focus={{ 
                  borderColor: 'brand.500',
                  boxShadow: '0 0 0 1px #d946ef'
                }}
              />
            </Box>

            <Button
              bgGradient="linear(135deg, brand.500 0%, accent.500 100%)"
              color="white"
              onClick={generateStudySet}
              isLoading={loading}
              loadingText={`Creating ${generationProgress.current}/${generationProgress.total}...`}
              h="64px"
              fontSize="lg"
              fontWeight="700"
              leftIcon={<Music size={22} />}
              _hover={{
                bgGradient: "linear(135deg, brand.600 0%, accent.600 100%)",
                transform: "translateY(-2px)"
              }}
              _active={{
                transform: "translateY(0)"
              }}
              transition="all 0.2s"
              isDisabled={!notes.trim()}
            >
              Generate Study Set
            </Button>

            {loading && (
              <VStack spacing={3} bg="rgba(42, 42, 64, 0.6)" p={4} borderRadius="xl" borderWidth={1} borderColor="rgba(217, 70, 239, 0.2)">
                <HStack justify="space-between" w="100%" mb={1}>
                  <HStack spacing={2}>
                    <Zap size={16} color="rgba(217, 70, 239, 0.8)" />
                    <Text fontSize="sm" color="whiteAlpha.800" fontWeight="600">
                      Creating jingles...
                    </Text>
                  </HStack>
                  <Text fontSize="sm" color="whiteAlpha.600" fontWeight="600">
                    {generationProgress.current} / {generationProgress.total}
                  </Text>
                </HStack>
                <Progress
                  value={(generationProgress.current / generationProgress.total) * 100}
                  colorScheme="purple"
                  w="100%"
                  borderRadius="full"
                  height="6px"
                  bg="rgba(26, 26, 46, 0.6)"
                  sx={{
                    '& > div': {
                      background: 'linear-gradient(135deg, #d946ef 0%, #f97316 100%)',
                    }
                  }}
                />
                <Text fontSize="xs" color="whiteAlpha.500" textAlign="center">
                  ~30 seconds per term
                </Text>
              </VStack>
            )}
          </VStack>
        </VStack>
      </Container>
    </Box>
  )
}

