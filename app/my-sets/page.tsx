'use client'

import {
  Box,
  Button,
  Container,
  Heading,
  VStack,
  Text,
  useToast,
  HStack,
  IconButton,
  Textarea,
  Progress,
  Select,
  AlertDialog,
  AlertDialogBody,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogContent,
  AlertDialogOverlay,
  useDisclosure,
} from '@chakra-ui/react'
import { Music, ChevronLeft, ChevronRight, Save, Trash2, Plus, Folder, Calendar, Play, BookOpen, AlertCircle, RefreshCw, Pencil } from 'lucide-react'
import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '../lib/supabase'
import ShareButton from '../components/ShareButton'

interface Jingle {
  term: string
  lyrics: string
  audioUrl: string | null
  genre?: string
  notes?: string
}

interface SavedStudySet {
  id: number
  created_at: string
  subject: string
  jingles: Jingle[]
  notes?: string
}

export default function MySetsPage() {
  const [jingles, setJingles] = useState<Jingle[]>([])
  const [subject, setSubject] = useState('')
  const [currentIndex, setCurrentIndex] = useState(0)
  const [savedSets, setSavedSets] = useState<SavedStudySet[]>([])
  const [currentSetId, setCurrentSetId] = useState<number | null>(null)
  const [loadingSets, setLoadingSets] = useState(false)
  const [saving, setSaving] = useState(false)
  const [isEditing, setIsEditing] = useState(false)
  const [newTermsNotes, setNewTermsNotes] = useState('')
  const [loading, setLoading] = useState(false)
  const [generationProgress, setGenerationProgress] = useState({ current: 0, total: 0 })
  const [regeneratingIndex, setRegeneratingIndex] = useState<number | null>(null)
  const [editNotes, setEditNotes] = useState('')
  const [editGenre, setEditGenre] = useState('random')
  const [showInlineEditor, setShowInlineEditor] = useState(false)
  const [setToDelete, setSetToDelete] = useState<{ id: number; subject: string } | null>(null)
  const [termToRemove, setTermToRemove] = useState<{ index: number; term: string } | null>(null)
  const { isOpen: isDeleteSetOpen, onOpen: onDeleteSetOpen, onClose: onDeleteSetClose } = useDisclosure()
  const { isOpen: isRemoveTermOpen, onOpen: onRemoveTermOpen, onClose: onRemoveTermClose } = useDisclosure()
  const cancelRef = useRef<HTMLButtonElement>(null)
  const cancelTermRef = useRef<HTMLButtonElement>(null)
  const toast = useToast()
  const router = useRouter()

  useEffect(() => {
    loadSavedSets()
    
    // Check for newly created study set from sessionStorage
    const newSet = sessionStorage.getItem('newStudySet')
    if (newSet) {
      const parsedSet = JSON.parse(newSet)
      setSubject(parsedSet.subject)
      setJingles(parsedSet.jingles)
      setCurrentIndex(0)
      setCurrentSetId(null) // It's new, not saved yet
      sessionStorage.removeItem('newStudySet')
    }
  }, [])

  const loadSavedSets = async () => {
    if (!supabase) return

    setLoadingSets(true)
    try {
      const { data, error } = await supabase
        .from('sets')
        .select('*')
        .order('created_at', { ascending: false })

      if (error) throw error

      // Cleanup legacy notes that may contain guidance lines
      const cleaned = (data || []).map(set => ({
        ...set,
        jingles: (set.jingles || []).map((j: any) => ({
          ...j,
          notes: typeof j.notes === 'string' 
            ? j.notes.replace(/\n?Context from study notes:[\s\S]*$/m, '').trim()
            : j.notes,
        }))
      }))
      setSavedSets(cleaned)
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
    setNewTermsNotes('')
    // initialize edit controls from current jingle if exists
    if (set.jingles && set.jingles.length > 0) {
      const j = set.jingles[0]
      setEditNotes(j.notes || '')
      setEditGenre(j.genre || 'random')
    } else {
      setEditNotes('')
      setEditGenre('random')
    }
  }

  const promptDeleteStudySet = (setId: number, setSubject: string) => {
    setSetToDelete({ id: setId, subject: setSubject })
    onDeleteSetOpen()
  }

  const deleteStudySet = async () => {
    if (!supabase || !setToDelete) return

    try {
      const { error } = await supabase
        .from('sets')
        .delete()
        .eq('id', setToDelete.id)

      if (error) throw error

      loadSavedSets()

      if (currentSetId === setToDelete.id) {
        setJingles([])
        setCurrentIndex(0)
        setCurrentSetId(null)
      }

      toast({
        title: 'Study set deleted',
        description: `"${setToDelete.subject}" has been removed`,
        status: 'success',
        duration: 3000,
        isClosable: true,
      })
      
      onDeleteSetClose()
      setSetToDelete(null)
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

  const addMoreTerms = async () => {
    if (!newTermsNotes.trim()) {
      toast({
        title: 'Please paste notes',
        description: 'Notes are required (format: Term — Definition)',
        status: 'warning',
        duration: 3000,
        isClosable: true,
      })
      return
    }

    // Parse notes to extract terms and definitions
    const lines = newTermsNotes.split('\n').filter(line => line.trim())
    const termData: { term: string; definition: string }[] = []
    
    for (const line of lines) {
      const separators = ['—', ':', '-', '–']
      let found = false
      
      for (const sep of separators) {
        if (line.includes(sep)) {
          const parts = line.split(sep)
          if (parts.length >= 2) {
            const term = parts[0].trim()
            const definition = parts.slice(1).join(sep).trim()
            
            if (term && definition) {
              termData.push({ term, definition })
              found = true
              break
            }
          }
        }
      }
      
      if (!found && line.trim()) {
        toast({
          title: 'Invalid format',
          description: `Line "${line.substring(0, 50)}..." must use format: "Term — Definition"`,
          status: 'warning',
          duration: 5000,
          isClosable: true,
        })
        return
      }
    }
    
    if (termData.length === 0) {
      toast({
        title: 'No valid terms found',
        description: 'Use format: Term — Definition (one per line)',
        status: 'warning',
        duration: 3000,
        isClosable: true,
      })
      return
    }

    const existingTerms = jingles.map(j => j.term.toLowerCase())
    const duplicates = termData.filter(t => existingTerms.includes(t.term.toLowerCase()))
    
    if (duplicates.length > 0) {
      toast({
        title: 'Duplicate terms found',
        description: `These terms already exist: ${duplicates.map(d => d.term).join(', ')}`,
        status: 'warning',
        duration: 5000,
        isClosable: true,
      })
      return
    }

    setLoading(true)
    setGenerationProgress({ current: 0, total: termData.length })

    const newJingles: Jingle[] = []

    for (let i = 0; i < termData.length; i++) {
      const { term, definition } = termData[i]
      setGenerationProgress({ current: i + 1, total: termData.length })

      try {
        const studyNotes = `${term} — ${definition}`
        const response = await fetch('/api/generate-song', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ studyNotes, genre: 'random' }),
        })

        const data = await response.json()

        if (response.ok) {
          newJingles.push({
            term,
            lyrics: data.lyrics || '',
            audioUrl: data.audioUrl || null,
            genre: 'random',
          })
        } else {
          newJingles.push({
            term,
            lyrics: `Failed to generate: ${data.error || 'Unknown error'}`,
            audioUrl: null,
            genre: 'random',
          })
        }
      } catch (error) {
        newJingles.push({
          term,
          lyrics: `Error: ${error instanceof Error ? error.message : 'Unknown error'}`,
          audioUrl: null,
          genre: 'random',
        })
      }
    }

    const updatedJingles = [...jingles, ...newJingles]
    setJingles(updatedJingles)
    setLoading(false)
    setGenerationProgress({ current: 0, total: 0 })
    setIsEditing(false)
    setNewTermsNotes('')

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

  const promptRemoveTerm = (index: number) => {
    setTermToRemove({ index, term: jingles[index].term })
    onRemoveTermOpen()
  }

  const removeTerm = async () => {
    if (!termToRemove) return

    const updatedJingles = jingles.filter((_, i) => i !== termToRemove.index)
    setJingles(updatedJingles)
    
    // Adjust current index if needed
    if (currentIndex >= updatedJingles.length) {
      setCurrentIndex(Math.max(0, updatedJingles.length - 1))
    }

    // Update in database if it's a saved set
    if (currentSetId && supabase) {
      try {
        const { error } = await supabase
          .from('sets')
          .update({ jingles: updatedJingles })
          .eq('id', currentSetId)

        if (error) throw error

        loadSavedSets()

        toast({
          title: 'Term removed',
          description: `"${termToRemove.term}" has been deleted`,
          status: 'success',
          duration: 3000,
          isClosable: true,
        })
      } catch (error) {
        console.error('Error updating study set:', error)
        toast({
          title: 'Removed locally',
          description: 'Click Save to update the database',
          status: 'warning',
          duration: 5000,
          isClosable: true,
        })
      }
    } else {
      toast({
        title: 'Term removed',
        description: `"${termToRemove.term}" has been deleted`,
        status: 'success',
        duration: 3000,
        isClosable: true,
      })
    }
    
    onRemoveTermClose()
    setTermToRemove(null)
  }

  const regenerateJingle = async (index: number, notes: string, newGenre?: string) => {
    const jingle = jingles[index]
    const genreToUse = newGenre || jingle.genre || 'random'
    
    setRegeneratingIndex(index)

    try {
      const response = await fetch('/api/generate-song', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          studyNotes: notes,
          genre: genreToUse 
        }),
      })

      const data = await response.json()

      if (response.ok) {
        const updatedJingles = [...jingles]
        updatedJingles[index] = {
          ...jingle,
          lyrics: data.lyrics || '',
          audioUrl: data.audioUrl || null,
          genre: genreToUse,
          notes: notes,
        }
        
        setJingles(updatedJingles)

        // Update in database if it's a saved set
        if (currentSetId && supabase) {
          try {
            const { error } = await supabase
              .from('sets')
              .update({ jingles: updatedJingles })
              .eq('id', currentSetId)

            if (error) throw error
            loadSavedSets()
          } catch (error) {
            console.error('Error updating study set:', error)
          }
        }

        toast({
          title: 'Jingle regenerated!',
          description: newGenre ? `New ${newGenre} version created` : 'New version created',
          status: 'success',
          duration: 3000,
          isClosable: true,
        })
      } else {
        throw new Error(data.error || 'Failed to regenerate')
      }
    } catch (error) {
      toast({
        title: 'Regeneration failed',
        description: error instanceof Error ? error.message : 'Unknown error',
        status: 'error',
        duration: 5000,
        isClosable: true,
      })
    } finally {
      setRegeneratingIndex(null)
    }
  }

  const promptForNotesAndRegenerate = async (index: number, newGenre?: string) => {
    const j = jingles[index]
    const notesToUse = (currentIndex === index ? editNotes : j.notes) || `${j.term} — `
    await regenerateJingle(index, notesToUse, newGenre)
  }

  const changeGenre = async (index: number, newGenre: string) => {
    await promptForNotesAndRegenerate(index, newGenre)
  }

  const goToPrevious = () => {
    setCurrentIndex(prev => {
      const next = prev > 0 ? prev - 1 : prev
      const j = jingles[next]
      setEditNotes(j?.notes || `${j?.term ?? ''} — `)
      setEditGenre(j?.genre || 'random')
      return next
    })
  }

  const goToNext = () => {
    setCurrentIndex(prev => {
      const next = prev < jingles.length - 1 ? prev + 1 : prev
      const j = jingles[next]
      setEditNotes(j?.notes || `${j?.term ?? ''} — `)
      setEditGenre(j?.genre || 'random')
      return next
    })
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
    <Box minH="100vh" bg="#0f0f1a" py={{ base: 8, md: 12 }}>
      <Container maxW="1200px" w="100%" px={{ base: 4, md: 8 }}>
        <VStack spacing={8} align="stretch">
          <Box textAlign="center">
            <Heading 
              as="h1" 
              fontSize={{base: "2xl", md: "4xl"}} 
              fontWeight="900" 
              mb={3} 
              letterSpacing="-0.03em"
              bgGradient="linear(135deg, brand.400 0%, accent.400 100%)"
              bgClip="text"
            >
              My Study Sets
            </Heading>
            <Text fontSize={{base: "sm", md: "md"}} color="whiteAlpha.600" fontWeight="500" maxW="xl" mx="auto">
              Review your mnemonics and ace that exam
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
                  You haven't created any study sets yet.
                </Text>
                <Button
                  bgGradient="linear(135deg, brand.500 0%, accent.500 100%)"
                  color="white"
                  onClick={() => router.push('/create')}
                >
                  Create Your First Study Set
                </Button>
              </Box>
            ) : (
              <>
                <HStack spacing={2} mb={2}>
                  <Folder size={16} />
                  <Text fontSize="md" fontWeight="600" color="whiteAlpha.700">
                    Your Collections ({savedSets.length})
                  </Text>
                </HStack>
                {savedSets.map((set) => (
                  <Box
                    key={set.id}
                    bg="rgba(26, 26, 46, 0.6)"
                    p={5}
                    borderRadius="2xl"
                    borderWidth={2}
                    borderColor="brand.500"
                    transition="all 0.2s"
                    _hover={{
                      transform: "translateY(-2px)",
                      boxShadow: "0 10px 30px rgba(217, 70, 239, 0.3)"
                    }}
                  >
                    <VStack align="start" spacing={3} mb={4}>
                      <Heading size="md" fontWeight="700" color="white">
                        {set.subject}
                      </Heading>
                      <HStack spacing={3} color="whiteAlpha.600" fontSize="sm" fontWeight="500">
                        <HStack spacing={1}>
                          <Music size={14} />
                          <Text>{set.jingles.length} terms</Text>
                        </HStack>
                        <Text>•</Text>
                        <HStack spacing={1}>
                          <Calendar size={14} />
                          <Text>{new Date(set.created_at).toLocaleDateString()}</Text>
                        </HStack>
                      </HStack>
                      <HStack spacing={2} flexWrap="wrap">
                        {set.jingles.slice(0, 3).map((jingle, idx) => (
                          <Box
                            key={idx}
                            px={2}
                            py={1}
                            bg="rgba(42, 42, 64, 0.6)"
                            borderRadius="md"
                            fontSize="xs"
                            fontWeight="600"
                            color="whiteAlpha.800"
                            borderWidth={1}
                            borderColor="rgba(217, 70, 239, 0.2)"
                          >
                            {jingle.term}
                          </Box>
                        ))}
                        {set.jingles.length > 3 && (
                          <Box
                            px={2}
                            py={1}
                            bg="rgba(42, 42, 64, 0.6)"
                            borderRadius="md"
                            fontSize="xs"
                            fontWeight="600"
                            color="whiteAlpha.500"
                          >
                            +{set.jingles.length - 3} more
                          </Box>
                        )}
                      </HStack>
                    </VStack>
                    <HStack spacing={2}>
                      <Button
                        flex={1}
                        bgGradient="linear(135deg, brand.500 0%, accent.500 100%)"
                        color="white"
                        h="44px"
                        fontWeight="600"
                        onClick={() => router.push(`/sets/${set.id}`)}
                        _hover={{
                          bgGradient: "linear(135deg, brand.600 0%, accent.600 100%)",
                          transform: "translateY(-2px)"
                        }}
                        leftIcon={<Play size={16} />}
                      >
                        Study Now
                      </Button>
                      <IconButton
                        aria-label="Delete"
                        icon={<Trash2 size={16} />}
                        h="44px"
                        bg="rgba(239, 68, 68, 0.1)"
                        color="red.400"
                        borderWidth={1}
                        borderColor="rgba(239, 68, 68, 0.3)"
                        _hover={{
                          bg: "rgba(239, 68, 68, 0.2)",
                          borderColor: "red.500"
                        }}
                        onClick={() => promptDeleteStudySet(set.id, set.subject)}
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
                      setNewTermsNotes('')
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
              <VStack spacing={4} align="stretch" bg="rgba(26, 26, 46, 0.6)" p={6} borderRadius="xl">
                <VStack align="start" spacing={2}>
                  <HStack spacing={2}>
                    <BookOpen size={16} color="rgba(217, 70, 239, 0.8)" />
                    <Heading size="sm" fontWeight="600">
                      Add More Terms with Notes
                    </Heading>
                  </HStack>
                  <Text fontSize="sm" color="whiteAlpha.600">
                    Format: Term — Definition (one per line)
                  </Text>
                </VStack>
                <Textarea
                  placeholder="Mitochondria — The powerhouse of the cell&#10;DNA — Deoxyribonucleic acid, genetic blueprint&#10;Photosynthesis — Process plants use to convert light into energy"
                  value={newTermsNotes}
                  onChange={e => setNewTermsNotes(e.target.value)}
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
                <Button
                  bgGradient="linear(135deg, brand.500 0%, accent.500 100%)"
                  color="white"
                  onClick={addMoreTerms}
                  isLoading={loading}
                  loadingText={`Adding ${generationProgress.current}/${generationProgress.total}...`}
                  leftIcon={<Plus size={18} />}
                >
                  Generate New Mnemonics
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
                      Generating mnemonic {generationProgress.current} of {generationProgress.total}...
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
                <Box position="relative" textAlign="center" py={6} bg="rgba(26, 26, 46, 0.6)" borderRadius="2xl" border="2px solid" borderColor="rgba(217, 70, 239, 0.2)">
                  <Box position="absolute" top={4} right={4} display="flex" gap={2}>
                    <IconButton
                      aria-label="Edit"
                      icon={<Pencil size={18} />}
                      variant="ghost"
                      colorScheme="whiteAlpha"
                      size="sm"
                      onClick={() => setShowInlineEditor(v => !v)}
                    />
                    <IconButton
                      aria-label="Regenerate"
                      icon={<RefreshCw size={18} />}
                      variant="ghost"
                      colorScheme="whiteAlpha"
                      size="sm"
                      isLoading={regeneratingIndex === currentIndex}
                      onClick={() => regenerateJingle(currentIndex, (editNotes || `${currentJingle.term} — `).trim(), editGenre || 'random')}
                    />
                    <IconButton
                      aria-label="Remove"
                      icon={<Trash2 size={18} />}
                      variant="ghost"
                      colorScheme="red"
                      size="sm"
                      onClick={() => promptRemoveTerm(currentIndex)}
                    />
                  </Box>
                  <Text fontSize="sm" fontWeight="600" color="whiteAlpha.600" textTransform="uppercase" mb={2}>
                    Memory Trick
                  </Text>
                  <Heading 
                    fontSize={{base: "2xl", md: "3xl"}} 
                    fontWeight="900" 
                    bgGradient="linear(135deg, brand.400 0%, accent.400 100%)" 
                    bgClip="text"
                  >
                    {currentJingle.term}
                  </Heading>
                  {currentJingle.genre && (
                    <Text fontSize="xs" color="whiteAlpha.500" mt={2}>
                      Genre: {currentJingle.genre}
                    </Text>
                  )}
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

                {/* Inline notes + genre editor and actions (hidden until Edit is clicked) */}
                {showInlineEditor && (
                <VStack spacing={4} align="stretch" bg="rgba(26, 26, 46, 0.6)" borderRadius="xl" p={6} border="1px solid" borderColor="rgba(217, 70, 239, 0.15)">
                  <HStack spacing={2}>
                    <BookOpen size={16} color="rgba(217, 70, 239, 0.8)" />
                    <Text fontWeight="600" fontSize="sm" color="whiteAlpha.800" textTransform="uppercase" letterSpacing="wide">
                      Notes for this term (required)
                    </Text>
                  </HStack>
                  <Textarea
                    placeholder={`${currentJingle.term} — [Definition/Explanation]`}
                    value={editNotes}
                    onChange={e => setEditNotes(e.target.value)}
                    size="md"
                    bg="rgba(42, 42, 64, 0.6)"
                    border="2px solid"
                    borderColor="transparent"
                    borderRadius="xl"
                    color="white"
                    fontWeight="500"
                    minHeight="100px"
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

                  <HStack spacing={4} align="center">
                    <Select
                      value={editGenre}
                      onChange={e => setEditGenre(e.target.value)}
                      size="md"
                      bg="rgba(42, 42, 64, 0.6)"
                      border="2px solid"
                      borderColor="transparent"
                      borderRadius="xl"
                      color="white"
                      fontWeight="500"
                      w={{ base: '100%', md: '240px' }}
                      _hover={{ bg: 'rgba(50, 53, 74, 0.8)', borderColor: 'rgba(217, 70, 239, 0.3)' }}
                      _focus={{ 
                        bg: 'rgba(50, 53, 74, 0.8)', 
                        outline: 'none', 
                        borderColor: 'brand.500',
                        boxShadow: '0 0 0 3px rgba(217, 70, 239, 0.1)'
                      }}
                    >
                      <option value="random" style={{ background: '#2a2d42' }}>Random</option>
                      <option value="pop" style={{ background: '#2a2d42' }}>Pop</option>
                      <option value="rnb" style={{ background: '#2a2d42' }}>R&B</option>
                      <option value="hiphop" style={{ background: '#2a2d42' }}>Hip-Hop</option>
                      <option value="rock" style={{ background: '#2a2d42' }}>Rock</option>
                      <option value="country" style={{ background: '#2a2d42' }}>Country</option>
                      <option value="electronic" style={{ background: '#2a2d42' }}>Electronic</option>
                    </Select>

                    <HStack spacing={3} flexWrap="wrap">
                      <Button
                        colorScheme="brand"
                        leftIcon={<RefreshCw size={16} />}
                        isLoading={regeneratingIndex === currentIndex}
                        onClick={() => regenerateJingle(currentIndex, (editNotes || `${currentJingle.term} — `).trim(), editGenre || 'random')}
                      >
                        Regenerate
                      </Button>
                      <Button
                        variant="outline"
                        colorScheme="red"
                        leftIcon={<Trash2 size={16} />}
                        onClick={() => promptRemoveTerm(currentIndex)}
                      >
                        Remove Term
                      </Button>
                      <Button
                        variant="ghost"
                        onClick={() => setShowInlineEditor(false)}
                      >
                        Close
                      </Button>
                    </HStack>
                  </HStack>
                </VStack>
                )}

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
                        Audio unavailable for this mnemonic
                      </Text>
                    </HStack>
                    <Text color="whiteAlpha.600" fontSize="sm" mt={2}>
                      The memory trick is still here to help you study!
                    </Text>
                  </Box>
                )}

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
        </VStack>
      </Container>

      {/* Delete Study Set Dialog */}
      <AlertDialog
        isOpen={isDeleteSetOpen}
        leastDestructiveRef={cancelRef}
        onClose={onDeleteSetClose}
        isCentered
      >
        <AlertDialogOverlay bg="rgba(0, 0, 0, 0.7)" backdropFilter="blur(10px)">
          <AlertDialogContent
            bg="rgba(26, 26, 46, 0.95)"
            borderWidth={2}
            borderColor="red.500"
            borderRadius="2xl"
            mx={4}
          >
            <AlertDialogHeader fontSize="xl" fontWeight="bold" color="white">
              Delete Study Set
            </AlertDialogHeader>

            <AlertDialogBody color="whiteAlpha.800">
              Are you sure you want to delete{' '}
              <Text as="span" fontWeight="bold" color="brand.300">
                "{setToDelete?.subject}"
              </Text>
              ? This action cannot be undone.
            </AlertDialogBody>

            <AlertDialogFooter>
              <Button
                ref={cancelRef}
                onClick={onDeleteSetClose}
                bg="rgba(37, 37, 64, 0.8)"
                color="white"
                _hover={{ bg: 'rgba(50, 50, 80, 0.9)' }}
              >
                Cancel
              </Button>
              <Button
                colorScheme="red"
                onClick={deleteStudySet}
                ml={3}
                bg="red.500"
                _hover={{ bg: 'red.600' }}
              >
                Delete
              </Button>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialogOverlay>
      </AlertDialog>

      {/* Remove Term Dialog */}
      <AlertDialog
        isOpen={isRemoveTermOpen}
        leastDestructiveRef={cancelTermRef}
        onClose={onRemoveTermClose}
        isCentered
      >
        <AlertDialogOverlay bg="rgba(0, 0, 0, 0.7)" backdropFilter="blur(10px)">
          <AlertDialogContent
            bg="rgba(26, 26, 46, 0.95)"
            borderWidth={2}
            borderColor="orange.500"
            borderRadius="2xl"
            mx={4}
          >
            <AlertDialogHeader fontSize="xl" fontWeight="bold" color="white">
              Remove Term
            </AlertDialogHeader>

            <AlertDialogBody color="whiteAlpha.800">
              Remove{' '}
              <Text as="span" fontWeight="bold" color="brand.300">
                "{termToRemove?.term}"
              </Text>
              {' '}from this study set?
            </AlertDialogBody>

            <AlertDialogFooter>
              <Button
                ref={cancelTermRef}
                onClick={onRemoveTermClose}
                bg="rgba(37, 37, 64, 0.8)"
                color="white"
                _hover={{ bg: 'rgba(50, 50, 80, 0.9)' }}
              >
                Cancel
              </Button>
              <Button
                colorScheme="orange"
                onClick={removeTerm}
                ml={3}
                bg="orange.500"
                _hover={{ bg: 'orange.600' }}
              >
                Remove
              </Button>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialogOverlay>
      </AlertDialog>
    </Box>
  )
}

