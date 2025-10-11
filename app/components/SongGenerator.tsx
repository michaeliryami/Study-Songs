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
  IconButton,
  Progress,
} from '@chakra-ui/react'
import { Music, ChevronLeft, ChevronRight, Save, Trash2, Plus, Sparkles, BookOpen, FileText, Target, Folder, Calendar, Play, AlertCircle, Zap } from 'lucide-react'
import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import ShareButton from './ShareButton'
import SuccessAnimation from './SuccessAnimation'

interface Jingle {
  term: string
  lyrics: string
  audioUrl: string | null
}

interface SavedStudySet {
  id: number
  created_at: string
  subject: string
  jingles: Jingle[]
}

interface SongGeneratorProps {
  currentView: 'create' | 'my-sets'
  onViewChange: (view: 'create' | 'my-sets') => void
}

export default function SongGenerator({ currentView, onViewChange }: SongGeneratorProps) {
  const [subject, setSubject] = useState('')
  const [notes, setNotes] = useState('')
  const [terms, setTerms] = useState('')
  const [jingles, setJingles] = useState<Jingle[]>([])
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [loadingSets, setLoadingSets] = useState(false)
  const [currentIndex, setCurrentIndex] = useState(0)
  const [generationProgress, setGenerationProgress] = useState({ current: 0, total: 0 })
  const [savedSets, setSavedSets] = useState<SavedStudySet[]>([])
  const [currentSetId, setCurrentSetId] = useState<number | null>(null)
  const [isEditing, setIsEditing] = useState(false)
  const [newTerms, setNewTerms] = useState('')
  const [generatingTerms, setGeneratingTerms] = useState(false)
  const [showSuccess, setShowSuccess] = useState(false)
  const toast = useToast()

  useEffect(() => {
    loadSavedSets()
  }, [])

  const generateTerms = async () => {
    if (!subject.trim()) {
      toast({
        title: 'Please enter a subject',
        description: 'Add a subject first',
        status: 'warning',
        duration: 3000,
        isClosable: true,
      })
      return
    }

    setGeneratingTerms(true)

    try {
      const response = await fetch('/api/generate-terms', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          subject: notes.trim() ? `${subject}\n\nStudy Notes:\n${notes}` : subject 
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to generate terms')
      }

      setTerms(data.terms)

      toast({
        title: 'Terms generated!',
        description: 'Review and edit the terms as needed',
        status: 'success',
        duration: 3000,
        isClosable: true,
      })
    } catch (error) {
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to generate terms',
        status: 'error',
        duration: 5000,
        isClosable: true,
      })
    } finally {
      setGeneratingTerms(false)
    }
  }

  const loadSavedSets = async () => {
    if (!supabase) return

    setLoadingSets(true)
    try {
      const { data, error } = await supabase
        .from('sets')
        .select('*')
        .order('created_at', { ascending: false })

      if (error) throw error

      setSavedSets(data || [])
    } catch (error) {
      console.error('Error loading saved sets:', error)
    } finally {
      setLoadingSets(false)
    }
  }

  const loadStudySet = (set: SavedStudySet) => {
    setSubject(set.subject)
    setJingles(set.jingles)
    setCurrentIndex(0)
    setCurrentSetId(set.id)
    setIsEditing(false)
    setNewTerms('')
  }

  const addMoreTerms = async () => {
    if (!newTerms.trim()) {
      toast({
        title: 'Please enter terms',
        description: 'Add at least one new term',
        status: 'warning',
        duration: 3000,
        isClosable: true,
      })
      return
    }

    const termList = newTerms.split('\n').filter(t => t.trim()).slice(0, 10)
    
    if (termList.length === 0) {
      toast({
        title: 'Please enter terms',
        description: 'Add at least one new term',
        status: 'warning',
        duration: 3000,
        isClosable: true,
      })
      return
    }

    // Check for duplicates
    const existingTerms = jingles.map(j => j.term.toLowerCase())
    const duplicates = termList.filter(t => existingTerms.includes(t.toLowerCase()))
    
    if (duplicates.length > 0) {
      toast({
        title: 'Duplicate terms found',
        description: `These terms already exist: ${duplicates.join(', ')}`,
        status: 'warning',
        duration: 5000,
        isClosable: true,
      })
      return
    }

    setLoading(true)
    setGenerationProgress({ current: 0, total: termList.length })

    const newJingles: Jingle[] = []

    for (let i = 0; i < termList.length; i++) {
      const term = termList[i].trim()
      setGenerationProgress({ current: i + 1, total: termList.length })

      try {
        const studyNotes = `${subject}: ${term}`
        const response = await fetch('/api/generate-song', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ studyNotes }),
        })

        const data = await response.json()

        if (response.ok) {
          newJingles.push({
            term,
            lyrics: data.lyrics || '',
            audioUrl: data.audioUrl || null,
          })
        } else {
          newJingles.push({
            term,
            lyrics: `Failed to generate: ${data.error || 'Unknown error'}`,
            audioUrl: null,
          })
        }
      } catch (error) {
        newJingles.push({
          term,
          lyrics: `Error: ${error instanceof Error ? error.message : 'Unknown error'}`,
          audioUrl: null,
        })
      }
    }

    // Append new jingles to existing ones
    const updatedJingles = [...jingles, ...newJingles]
    setJingles(updatedJingles)
    setLoading(false)
    setGenerationProgress({ current: 0, total: 0 })
    setIsEditing(false)
    setNewTerms('')

    // Auto-save the updated study set if it was already saved
    if (currentSetId && supabase) {
      try {
        const { error } = await supabase
          .from('sets')
          .update({ jingles: updatedJingles })
          .eq('id', currentSetId)

        if (error) throw error

        loadSavedSets()

        toast({
          title: 'Study set updated!',
          description: `Added ${newJingles.length} new jingles`,
          status: 'success',
          duration: 3000,
          isClosable: true,
        })
      } catch (error) {
        console.error('Error updating study set:', error)
        toast({
          title: 'Jingles added, but save failed',
          description: 'Click Save to try again',
          status: 'warning',
          duration: 5000,
          isClosable: true,
        })
      }
    } else {
      toast({
        title: 'New jingles added!',
        description: `Added ${newJingles.length} jingles. Don't forget to save!`,
        status: 'success',
        duration: 3000,
        isClosable: true,
      })
    }
  }

  const deleteStudySet = async (setId: number, setSubject: string) => {
    if (!supabase) return

    if (!confirm(`Are you sure you want to delete "${setSubject}"?`)) {
      return
    }

    try {
      const { error } = await supabase
        .from('sets')
        .delete()
        .eq('id', setId)

      if (error) throw error

      // Reload saved sets
      loadSavedSets()

      // If we deleted the current set, clear it
      if (currentSetId === setId) {
        setJingles([])
        setCurrentIndex(0)
        setCurrentSetId(null)
      }

      toast({
        title: 'Study set deleted',
        description: `"${setSubject}" has been removed`,
        status: 'success',
        duration: 3000,
        isClosable: true,
      })
    } catch (error) {
      console.error('Error deleting study set:', error)
      toast({
        title: 'Failed to delete',
        description: error instanceof Error ? error.message : 'Unknown error occurred',
        status: 'error',
        duration: 5000,
        isClosable: true,
      })
    }
  }

  const generateStudySet = async () => {
    if (!subject.trim()) {
      toast({
        title: 'Please enter a subject',
        description: 'Add a subject for your study set',
        status: 'warning',
        duration: 3000,
        isClosable: true,
      })
      return
    }

    const termList = terms.split('\n').filter(t => t.trim()).slice(0, 10)
    
    if (termList.length === 0) {
      toast({
        title: 'Please enter terms',
        description: 'Add at least one term to your study set',
        status: 'warning',
        duration: 3000,
        isClosable: true,
      })
      return
    }

    setLoading(true)
    setJingles([])
    setCurrentIndex(0)
    setGenerationProgress({ current: 0, total: termList.length })

    const generatedJingles: Jingle[] = []

    for (let i = 0; i < termList.length; i++) {
      const term = termList[i].trim()
      setGenerationProgress({ current: i + 1, total: termList.length })

      try {
        let studyNotes = `${subject}: ${term}`
        if (notes.trim()) {
          studyNotes += `\n\nContext from study notes:\n${notes}`
        }
        
        const response = await fetch('/api/generate-song', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ studyNotes }),
        })

        const data = await response.json()

        if (response.ok) {
          generatedJingles.push({
            term,
            lyrics: data.lyrics || '',
            audioUrl: data.audioUrl || null,
          })
        } else {
          generatedJingles.push({
            term,
            lyrics: `Failed to generate: ${data.error || 'Unknown error'}`,
            audioUrl: null,
          })
        }
      } catch (error) {
        generatedJingles.push({
          term,
          lyrics: `Error: ${error instanceof Error ? error.message : 'Unknown error'}`,
          audioUrl: null,
        })
      }
    }

    // Only update jingles after ALL are generated
    setJingles(generatedJingles)
    setLoading(false)
    setGenerationProgress({ current: 0, total: 0 })
    setCurrentSetId(null) // Reset since this is a new set
    
    // Show success animation
    setShowSuccess(true)
    setTimeout(() => {
      setShowSuccess(false)
      // Automatically switch to My Study Sets view and show the generated set
      onViewChange('my-sets')
    }, 3000)
    
    // Clear the create form after animation
    setTimeout(() => {
      setSubject('')
      setNotes('')
      setTerms('')
    }, 3500)
  }

  const goToPrevious = () => {
    setCurrentIndex(prev => (prev > 0 ? prev - 1 : prev))
  }

  const goToNext = () => {
    setCurrentIndex(prev => (prev < jingles.length - 1 ? prev + 1 : prev))
  }

  const saveStudySet = async () => {
    if (!subject.trim() || jingles.length === 0) {
      toast({
        title: 'Nothing to save',
        description: 'Generate a study set first',
        status: 'warning',
        duration: 3000,
        isClosable: true,
      })
      return
    }

    if (!supabase) {
      toast({
        title: 'Supabase not configured',
        description: 'Please add NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY to .env.local and restart the server',
        status: 'error',
        duration: 5000,
        isClosable: true,
      })
      return
    }

    setSaving(true)

    try {
      const { data, error } = await supabase
        .from('sets')
        .insert({
          subject: subject.trim(),
          jingles: jingles,
        })
        .select()

      if (error) {
        throw error
      }

      if (data && data.length > 0) {
        setCurrentSetId(data[0].id)
      }

      // Refresh the saved sets list
      loadSavedSets()

      toast({
        title: 'Study set saved!',
        description: 'Your study set has been saved to the database',
        status: 'success',
        duration: 3000,
        isClosable: true,
      })
    } catch (error) {
      console.error('Error saving study set:', error)
      toast({
        title: 'Failed to save',
        description: error instanceof Error ? error.message : 'Unknown error occurred',
        status: 'error',
        duration: 5000,
        isClosable: true,
      })
    } finally {
      setSaving(false)
    }
  }

  const formatLyrics = (text: string) => {
    return text.split('\n').map((line, index) => {
      const isSection = line.startsWith('[') && line.endsWith(']')
      const isEmpty = line.trim() === ''

      if (isEmpty) {
        return <Box key={index} h={4} />
      }

      if (isSection) {
        return (
          <Text key={index} fontWeight="bold" fontSize="lg" color="brand.300" mt={index > 0 ? 4 : 0}>
            {line}
          </Text>
        )
      }

      return (
        <Text key={index} fontSize="md" pl={4}>
          {line}
        </Text>
      )
    })
  }

  const currentJingle = jingles[currentIndex]

  return (
    <Container maxW="container.md" py={20}>
      <VStack spacing={12} align="stretch">
        {/* CREATE STUDY SET VIEW */}
        {currentView === 'create' && (
          <>
            <Box textAlign="center" mb={2}>
              <Heading 
                as="h1" 
                fontSize={{base: "3xl", md: "5xl"}} 
                fontWeight="900" 
                mb={4} 
                letterSpacing="-0.03em"
                bgGradient="linear(135deg, brand.400 0%, accent.400 100%)"
                bgClip="text"
              >
                Turn Study Notes Into Viral Jingles
              </Heading>
              <Text fontSize={{base: "md", md: "xl"}} color="whiteAlpha.700" fontWeight="500" maxW="2xl" mx="auto">
                Create catchy, educational songs that stick in your brain. Study smarter, not harder.
              </Text>
            </Box>
          <VStack spacing={6} align="stretch" bg="rgba(26, 26, 46, 0.6)" p={8} borderRadius="2xl" border="1px solid" borderColor="rgba(217, 70, 239, 0.1)">
            <Box>
              <HStack mb={3} spacing={2}>
                <BookOpen size={16} color="rgba(217, 70, 239, 0.8)" />
                <Text fontWeight="600" fontSize="sm" color="whiteAlpha.800" textTransform="uppercase" letterSpacing="wide">
                  Subject
                </Text>
              </HStack>
              <Input
                placeholder="e.g., Biology, Calculus, World History"
                value={subject}
                onChange={e => setSubject(e.target.value)}
                size="lg"
                bg="rgba(42, 42, 64, 0.6)"
                border="2px solid"
                borderColor="transparent"
                borderRadius="xl"
                color="white"
                fontWeight="500"
                fontSize="lg"
                h="60px"
                _placeholder={{ color: 'whiteAlpha.400' }}
                _hover={{ bg: 'rgba(50, 53, 74, 0.8)', borderColor: 'rgba(217, 70, 239, 0.3)' }}
                _focus={{ 
                  bg: 'rgba(50, 53, 74, 0.8)', 
                  outline: 'none', 
                  borderColor: 'brand.500',
                  boxShadow: '0 0 0 3px rgba(217, 70, 239, 0.1)'
                }}
              />
            </Box>

            <Box>
              <HStack mb={3} spacing={2}>
                <FileText size={16} color="rgba(217, 70, 239, 0.8)" />
                <Text fontWeight="600" fontSize="sm" color="whiteAlpha.800" textTransform="uppercase" letterSpacing="wide">
                  Study Notes <Text as="span" color="whiteAlpha.500" textTransform="none" fontWeight="400">(optional)</Text>
                </Text>
              </HStack>
              <Textarea
                placeholder="Paste your study notes here for more accurate and contextual jingles..."
                value={notes}
                onChange={e => setNotes(e.target.value)}
                size="lg"
                bg="rgba(42, 42, 64, 0.6)"
                border="2px solid"
                borderColor="transparent"
                borderRadius="xl"
                color="white"
                fontWeight="500"
                minHeight="150px"
                resize="vertical"
                _placeholder={{ color: 'whiteAlpha.400' }}
                _hover={{ bg: 'rgba(50, 53, 74, 0.8)', borderColor: 'rgba(217, 70, 239, 0.3)' }}
                _focus={{ 
                  bg: 'rgba(50, 53, 74, 0.8)', 
                  outline: 'none', 
                  borderColor: 'brand.500',
                  boxShadow: '0 0 0 3px rgba(217, 70, 239, 0.1)'
                }}
              />
            </Box>

            <Box>
              <HStack justify="space-between" mb={3}>
                <HStack spacing={2}>
                  <Target size={16} color="rgba(217, 70, 239, 0.8)" />
                  <Text fontWeight="600" fontSize="sm" color="whiteAlpha.800" textTransform="uppercase" letterSpacing="wide">
                    Terms (one per line, max 10)
                  </Text>
                </HStack>
                <Button
                  size="sm"
                  bgGradient="linear(135deg, purple.500 0%, pink.500 100%)"
                  color="white"
                  leftIcon={<Sparkles size={16} />}
                  onClick={generateTerms}
                  isLoading={generatingTerms}
                  loadingText="Generating..."
                  isDisabled={!subject.trim() || loading}
                  _hover={{
                    bgGradient: "linear(135deg, purple.600 0%, pink.600 100%)",
                    transform: "translateY(-2px)",
                    boxShadow: "0 8px 25px rgba(147, 51, 234, 0.3)"
                  }}
                  transition="all 0.2s"
                >
                  AI Generate
                </Button>
              </HStack>
              <Textarea
                placeholder={'mitochondria\nchloroplast\ncell membrane\nribosome\nendoplasmic reticulum'}
                value={terms}
                onChange={e => setTerms(e.target.value)}
                size="lg"
                bg="rgba(42, 42, 64, 0.6)"
                border="2px solid"
                borderColor="transparent"
                borderRadius="xl"
                color="white"
                fontWeight="500"
                minHeight="200px"
                resize="vertical"
                _placeholder={{ color: 'whiteAlpha.400' }}
                _hover={{ bg: 'rgba(50, 53, 74, 0.8)', borderColor: 'rgba(217, 70, 239, 0.3)' }}
                _focus={{ 
                  bg: 'rgba(50, 53, 74, 0.8)', 
                  outline: 'none', 
                  borderColor: 'brand.500',
                  boxShadow: '0 0 0 3px rgba(217, 70, 239, 0.1)'
                }}
              />
            </Box>

            <Button
              bgGradient="linear(135deg, brand.500 0%, accent.500 100%)"
              color="white"
              size="lg"
              onClick={generateStudySet}
              isLoading={loading}
              loadingText={`Generating ${generationProgress.current}/${generationProgress.total}...`}
              h="70px"
              fontSize="lg"
              fontWeight="700"
              leftIcon={<Music size={24} />}
              _hover={{
                bgGradient: "linear(135deg, brand.600 0%, accent.600 100%)",
                transform: "translateY(-3px)",
                boxShadow: "0 15px 50px rgba(217, 70, 239, 0.4)"
              }}
              _active={{
                transform: "translateY(0)"
              }}
              transition="all 0.2s"
              boxShadow="0 10px 40px rgba(217, 70, 239, 0.3)"
            >
              Generate My Study Set
            </Button>

            {loading && (
              <VStack spacing={4} bg="rgba(26, 26, 46, 0.8)" p={6} borderRadius="xl" border="1px solid" borderColor="rgba(217, 70, 239, 0.2)">
                <Progress
                  value={(generationProgress.current / generationProgress.total) * 100}
                  size="md"
                  colorScheme="purple"
                  w="100%"
                  borderRadius="full"
                  bg="rgba(42, 42, 64, 0.6)"
                  sx={{
                    '& > div': {
                      bgGradient: 'linear(to-r, brand.500, accent.500)',
                    }
                  }}
                />
                <HStack justify="center" spacing={2}>
                  <Zap size={18} color="rgba(217, 70, 239, 0.8)" />
                  <Text fontSize="md" color="whiteAlpha.800" textAlign="center" fontWeight="600">
                    Creating magic... Jingle {generationProgress.current} of {generationProgress.total}
                  </Text>
                </HStack>
                <Text fontSize="sm" color="whiteAlpha.500" textAlign="center">
                  This takes ~30 seconds per term. Hang tight!
                </Text>
              </VStack>
              )}
            </VStack>
          </>
        )}

        {/* Success Animation */}
        {showSuccess && (
          <SuccessAnimation count={jingles.length} subject={subject} />
        )}

        {/* MY STUDY SETS VIEW */}
        {currentView === 'my-sets' && !showSuccess && (
          <>
            <Box textAlign="center" mb={2}>
              <Heading 
                as="h1" 
                fontSize={{base: "3xl", md: "5xl"}} 
                fontWeight="900" 
                mb={4} 
                letterSpacing="-0.03em"
                bgGradient="linear(135deg, brand.400 0%, accent.400 100%)"
                bgClip="text"
              >
                My Study Sets
              </Heading>
              <Text fontSize={{base: "md", md: "xl"}} color="whiteAlpha.700" fontWeight="500" maxW="2xl" mx="auto">
                Review your jingles and ace that exam!
              </Text>
            </Box>

            {jingles.length === 0 && (
              <VStack spacing={4} align="stretch">
                {loadingSets ? (
                  <Text textAlign="center" color="whiteAlpha.600">
                    Loading your study sets...
                  </Text>
                ) : savedSets.length === 0 ? (
                  <Box textAlign="center" py={12}>
                    <Text fontSize="lg" color="whiteAlpha.600" mb={4}>
                      You haven&apos;t created any study sets yet.
                    </Text>
                    <Button
                      colorScheme="brand"
                      onClick={() => onViewChange('create')}
                    >
                      Create Your First Study Set
                    </Button>
                  </Box>
                ) : (
                  <>
                    <HStack spacing={2} mb={4}>
                      <Folder size={20} color="rgba(217, 70, 239, 0.8)" />
                      <Text fontSize="lg" fontWeight="700" color="whiteAlpha.900">
                        Your Collections ({savedSets.length})
                      </Text>
                    </HStack>
                    {savedSets.map((set) => (
                      <Box
                        key={set.id}
                        bg="rgba(26, 26, 46, 0.6)"
                        p={6}
                        borderRadius="2xl"
                        border="2px solid"
                        borderColor="rgba(217, 70, 239, 0.1)"
                        transition="all 0.3s"
                        _hover={{
                          borderColor: "rgba(217, 70, 239, 0.4)",
                          transform: "translateY(-4px)",
                          boxShadow: "0 20px 60px rgba(217, 70, 239, 0.2)"
                        }}
                      >
                        <HStack justify="space-between" align="start" mb={4}>
                          <VStack align="start" spacing={2} flex={1}>
                            <Heading size="md" fontWeight="700" bgGradient="linear(135deg, brand.300 0%, accent.300 100%)" bgClip="text">
                              {set.subject}
                            </Heading>
                            <HStack spacing={3} color="whiteAlpha.600" fontSize="sm" fontWeight="500">
                              <HStack spacing={1}>
                                <Music size={14} />
                                <Text>{set.jingles.length} jingles</Text>
                              </HStack>
                              <Text>•</Text>
                              <HStack spacing={1}>
                                <Calendar size={14} />
                                <Text>{new Date(set.created_at).toLocaleDateString()}</Text>
                              </HStack>
                            </HStack>
                            <HStack spacing={2} flexWrap="wrap" mt={2}>
                              {set.jingles.slice(0, 5).map((jingle, idx) => (
                                <Box
                                  key={idx}
                                  px={3}
                                  py={1}
                                  bgGradient="linear(135deg, rgba(217, 70, 239, 0.2) 0%, rgba(249, 115, 22, 0.2) 100%)"
                                  borderRadius="full"
                                  fontSize="xs"
                                  fontWeight="600"
                                  color="whiteAlpha.900"
                                  border="1px solid"
                                  borderColor="rgba(217, 70, 239, 0.3)"
                                >
                                  {jingle.term}
                                </Box>
                              ))}
                              {set.jingles.length > 5 && (
                                <Box
                                  px={3}
                                  py={1}
                                  bg="rgba(42, 42, 64, 0.6)"
                                  borderRadius="full"
                                  fontSize="xs"
                                  fontWeight="600"
                                  color="whiteAlpha.600"
                                >
                                  +{set.jingles.length - 5} more
                                </Box>
                              )}
                            </HStack>
                          </VStack>
                        </HStack>
                        <HStack spacing={3}>
                          <Button
                            flex={1}
                            bgGradient="linear(135deg, brand.500 0%, accent.500 100%)"
                            color="white"
                            size="md"
                            fontWeight="600"
                            onClick={() => loadStudySet(set)}
                            _hover={{
                              bgGradient: "linear(135deg, brand.600 0%, accent.600 100%)",
                              transform: "translateY(-2px)",
                              boxShadow: "0 10px 30px rgba(217, 70, 239, 0.3)"
                            }}
                            leftIcon={<Play size={18} />}
                          >
                            Study Now
                          </Button>
                          <IconButton
                            aria-label="Delete"
                            icon={<Trash2 size={18} />}
                            bg="rgba(239, 68, 68, 0.1)"
                            color="red.400"
                            border="1px solid"
                            borderColor="rgba(239, 68, 68, 0.3)"
                            _hover={{
                              bg: "rgba(239, 68, 68, 0.2)",
                              borderColor: "red.500"
                            }}
                            onClick={() => deleteStudySet(set.id, set.subject)}
                          />
                        </HStack>
                      </Box>
                    ))}
                  </>
                )}
              </VStack>
            )}

            {jingles.length > 0 && (
              <VStack spacing={8} align="stretch">
                <HStack justify="space-between" align="center">
                  <Box flex="1">
                    <IconButton
                      aria-label="Back to list"
                      icon={<ChevronLeft size={20} />}
                      colorScheme="whiteAlpha"
                      onClick={() => {
                        setJingles([])
                        setCurrentIndex(0)
                        setCurrentSetId(null)
                        setIsEditing(false)
                        setNewTerms('')
                      }}
                    />
                  </Box>
                  <Heading size="lg" fontWeight="700" letterSpacing="-0.01em" textAlign="center">
                    {subject}
                  </Heading>
                  <Box flex="1" display="flex" justifyContent="flex-end" gap={2}>
                    {!currentSetId && supabase && (
                      <Button
                        size="sm"
                        colorScheme="green"
                        leftIcon={<Save size={16} />}
                        onClick={saveStudySet}
                        isLoading={saving}
                        loadingText="Saving..."
                      >
                        Save
                      </Button>
                    )}
                    <Button
                      size="sm"
                      colorScheme={isEditing ? 'red' : 'brand'}
                      variant={isEditing ? 'outline' : 'solid'}
                      leftIcon={isEditing ? undefined : <Plus size={16} />}
                      onClick={() => setIsEditing(!isEditing)}
                      isDisabled={loading}
                    >
                      {isEditing ? 'Cancel' : 'Add Terms'}
                    </Button>
                  </Box>
                </HStack>

                {isEditing && (
                  <VStack spacing={4} align="stretch" bg="#22253a" p={6} borderRadius="xl">
                    <Heading size="sm" fontWeight="600">
                      Add More Terms
                    </Heading>
                    <Textarea
                      placeholder="Enter new terms (one per line)"
                      value={newTerms}
                      onChange={e => setNewTerms(e.target.value)}
                      size="lg"
                      bg="#2a2d42"
                      border="none"
                      borderRadius="lg"
                      color="white"
                      fontWeight="400"
                      minHeight="120px"
                      resize="vertical"
                      _placeholder={{ color: 'rgba(255, 255, 255, 0.4)' }}
                      _hover={{ bg: '#32354a' }}
                      _focus={{ bg: '#32354a', outline: 'none', boxShadow: 'none' }}
                    />
                    <Button
                      colorScheme="brand"
                      onClick={addMoreTerms}
                      isLoading={loading}
                      loadingText={`Adding ${generationProgress.current}/${generationProgress.total}...`}
                    >
                      Generate New Jingles
                    </Button>
                    {loading && (
                      <VStack spacing={2}>
                        <Progress
                          value={(generationProgress.current / generationProgress.total) * 100}
                          size="sm"
                          colorScheme="brand"
                          w="100%"
                          borderRadius="full"
                        />
                        <Text fontSize="sm" color="whiteAlpha.600" textAlign="center">
                          Generating jingle {generationProgress.current} of {generationProgress.total}...
                        </Text>
                      </VStack>
                    )}
                  </VStack>
                )}

                <HStack spacing={4} align="center" justify="center">
                  <IconButton
                    aria-label="Previous"
                    icon={<ChevronLeft size={24} />}
                    onClick={goToPrevious}
                    isDisabled={currentIndex === 0}
                    colorScheme="brand"
                    size="lg"
                  />
                  
                  <Text fontSize="md" fontWeight="600" minW="100px" textAlign="center">
                    {currentIndex + 1} / {jingles.length}
                  </Text>

                  <IconButton
                    aria-label="Next"
                    icon={<ChevronRight size={24} />}
                    onClick={goToNext}
                    isDisabled={currentIndex === jingles.length - 1}
                    colorScheme="brand"
                    size="lg"
                  />
                </HStack>

                {currentJingle && (
                  <VStack spacing={6} align="stretch">
                    <Box textAlign="center" py={6} bg="rgba(26, 26, 46, 0.6)" borderRadius="2xl" border="2px solid" borderColor="rgba(217, 70, 239, 0.2)">
                      <Text fontSize="sm" fontWeight="600" color="whiteAlpha.600" textTransform="uppercase" mb={2}>
                        Now Playing
                      </Text>
                      <Heading 
                        fontSize={{base: "2xl", md: "3xl"}} 
                        fontWeight="900" 
                        bgGradient="linear(135deg, brand.400 0%, accent.400 100%)" 
                        bgClip="text"
                      >
                        {currentJingle.term}
                      </Heading>
                    </Box>

                    <Box
                      bg="rgba(26, 26, 46, 0.6)"
                      borderRadius="2xl"
                      p={8}
                      fontSize="lg"
                      lineHeight="tall"
                      whiteSpace="pre-wrap"
                      color="whiteAlpha.900"
                      border="2px solid"
                      borderColor="rgba(217, 70, 239, 0.1)"
                      fontWeight="500"
                    >
                      {formatLyrics(currentJingle.lyrics)}
                    </Box>

                    {currentJingle.audioUrl && (
                      <Box 
                        bg="rgba(26, 26, 46, 0.8)" 
                        borderRadius="2xl" 
                        p={6}
                        border="2px solid"
                        borderColor="rgba(217, 70, 239, 0.2)"
                        boxShadow="0 10px 40px rgba(217, 70, 239, 0.2)"
                      >
                        <HStack spacing={4} align="center">
                          <Box
                            w="70px"
                            h="70px"
                            bgGradient="linear(135deg, brand.500 0%, accent.500 100%)"
                            borderRadius="xl"
                            display="flex"
                            alignItems="center"
                            justifyContent="center"
                            boxShadow="0 4px 20px rgba(217, 70, 239, 0.4)"
                          >
                            <Music size={32} color="#ffffff" strokeWidth={2.5} />
                          </Box>

                          <VStack align="start" flex={1} spacing={1}>
                            <Text fontWeight="700" fontSize="md" color="white">
                              {currentJingle.term}
                            </Text>
                            <HStack spacing={1}>
                              <BookOpen size={14} color="rgba(255, 255, 255, 0.6)" />
                              <Text fontSize="sm" color="whiteAlpha.600" fontWeight="500">
                                {subject}
                              </Text>
                            </HStack>
                          </VStack>

                          <Box flex={1}>
                            <audio
                              controls
                              key={currentIndex}
                              style={{
                                width: '100%',
                                height: '48px',
                                borderRadius: '12px',
                              }}
                              src={currentJingle.audioUrl}
                            >
                              Your browser does not support the audio element.
                            </audio>
                          </Box>
                        </HStack>
                      </Box>
                    )}

                    {!currentJingle.audioUrl && (
                      <Box 
                        bg="rgba(251, 146, 60, 0.1)" 
                        borderRadius="xl" 
                        p={6} 
                        textAlign="center"
                        border="1px solid"
                        borderColor="rgba(251, 146, 60, 0.3)"
                      >
                        <HStack justify="center" spacing={2} mb={2}>
                          <AlertCircle size={20} color="#fb923c" />
                          <Text color="orange.300" fontWeight="600" fontSize="md">
                            Audio unavailable for this jingle
                          </Text>
                        </HStack>
                        <Text color="whiteAlpha.600" fontSize="sm" mt={2}>
                          The lyrics are still here to help you study!
                        </Text>
                      </Box>
                    )}

                    {/* Share Button */}
                    <HStack justify="center" pt={4}>
                      <ShareButton 
                        term={currentJingle.term}
                        lyrics={currentJingle.lyrics}
                        audioUrl={currentJingle.audioUrl || undefined}
                      />
                    </HStack>
                  </VStack>
                )}
              </VStack>
            )}
          </>
        )}
      </VStack>
    </Container>
  )
}
