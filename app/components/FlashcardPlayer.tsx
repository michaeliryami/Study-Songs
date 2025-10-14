'use client'

import {
  Box,
  Button,
  Heading,
  Text,
  VStack,
  HStack,
  IconButton,
  Progress,
  useToast,
  Textarea,
  Select,
} from '@chakra-ui/react'
import {
  Play,
  Pause,
  ChevronLeft,
  ChevronRight,
  RotateCcw,
  Edit3,
  X,
  ArrowLeft,
  Plus,
  Trash2,
  RefreshCw,
  Download,
} from 'lucide-react'
import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '../lib/supabase'
import { useSubscription } from '../hooks/useSubscription'
import { useAuth } from '../contexts/AuthContext'

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
  stitch?: string
}

interface FlashcardPlayerProps {
  studySet: StudySet
}

export default function FlashcardPlayer({ studySet: initialStudySet }: FlashcardPlayerProps) {
  const [studySet, setStudySet] = useState(initialStudySet)
  const [currentIndex, setCurrentIndex] = useState(0)
  const [isPlaying, setIsPlaying] = useState(false)
  const [isEditing, setIsEditing] = useState(false)
  const [editedNotes, setEditedNotes] = useState('')
  const [editedGenre, setEditedGenre] = useState('random')
  const [regenerating, setRegenerating] = useState(false)
  const [newTerms, setNewTerms] = useState('')
  const [isAddingTerms, setIsAddingTerms] = useState(false)
  const [addingNewTerms, setAddingNewTerms] = useState(false)
  const [generatingAudio, setGeneratingAudio] = useState(false)
  const [audioProgress, setAudioProgress] = useState({ current: 0, total: 0 })
  const audioRef = useRef<HTMLAudioElement | null>(null)
  const toast = useToast()
  const router = useRouter()
  const [touchStart, setTouchStart] = useState(0)
  const [touchEnd, setTouchEnd] = useState(0)
  const { features, tier } = useSubscription()
  const { user } = useAuth()
  const [stitchingAudio, setStitchingAudio] = useState(false)
  const [playingStitched, setPlayingStitched] = useState(false)
  const stitchedAudioRef = useRef<HTMLAudioElement | null>(null)

  const currentJingle = studySet.jingles[currentIndex]

  // Update edited notes when navigating between cards while editing
  useEffect(() => {
    if (isEditing && currentJingle) {
      setEditedNotes((currentJingle as any).notes || `${currentJingle.term} — `)
      setEditedGenre((currentJingle as any).genre || 'random')
    }
  }, [currentIndex, isEditing, currentJingle])

  // Generate missing audio in background
  useEffect(() => {
    const generateMissingAudio = async () => {
      // Check if any jingles are missing audio
      const missingAudio = studySet.jingles.filter(j => !j.audioUrl)
      if (missingAudio.length === 0) return

      setGeneratingAudio(true)
      setAudioProgress({ current: 0, total: missingAudio.length })

      const updatedJingles = [...studySet.jingles]

      for (let i = 0; i < missingAudio.length; i++) {
        const jingle = missingAudio[i]
        const jingleIndex = studySet.jingles.findIndex(j => j.term === jingle.term)

        setAudioProgress({ current: i + 1, total: missingAudio.length })

        try {
          const response = await fetch('/api/generate-song', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              existingLyrics: jingle.lyrics, // Use existing lyrics!
              genre: (jingle as any).genre || 'random',
              skipAudio: false, // Generate audio for these lyrics
            }),
          })

          if (response.ok) {
            const data = await response.json()
            updatedJingles[jingleIndex] = {
              ...updatedJingles[jingleIndex],
              audioUrl: data.audioUrl,
            }

            // Update in Supabase
            if (supabase) {
              await supabase
                .from('sets')
                .update({ jingles: updatedJingles })
                .eq('id', studySet.id)
            }

            setStudySet({ ...studySet, jingles: updatedJingles })
          }
        } catch (error) {
          console.error('Error generating audio for', jingle.term, error)
        }
      }

      setGeneratingAudio(false)
      toast({
        title: 'Audio ready!',
        description: 'All jingles now have audio',
        status: 'success',
        duration: 3000,
      })
    }

    generateMissingAudio()
  }, []) // Only run once on mount

  // Handle keyboard navigation
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft') handlePrevious()
      if (e.key === 'ArrowRight') handleNext()
      if (e.key === ' ') {
        e.preventDefault()
        togglePlayPause()
      }
    }

    window.addEventListener('keydown', handleKeyPress)
    return () => window.removeEventListener('keydown', handleKeyPress)
  }, [currentIndex, isPlaying])

  // Auto-play next when audio ends
  useEffect(() => {
    if (audioRef.current && currentJingle?.audioUrl) {
      audioRef.current.src = currentJingle.audioUrl
      
      const handleEnded = () => {
        if (currentIndex < studySet.jingles.length - 1) {
          setTimeout(() => {
            setCurrentIndex(currentIndex + 1)
            setIsPlaying(true)
          }, 500)
        } else {
          setIsPlaying(false)
        }
      }

      audioRef.current.addEventListener('ended', handleEnded)
      
      if (isPlaying) {
        audioRef.current.play().catch(() => setIsPlaying(false))
      }

      return () => {
        audioRef.current?.removeEventListener('ended', handleEnded)
      }
    }
  }, [currentIndex, currentJingle?.audioUrl])

  const togglePlayPause = () => {
    if (!audioRef.current || !currentJingle?.audioUrl) return

    if (isPlaying) {
      audioRef.current.pause()
      setIsPlaying(false)
    } else {
      audioRef.current.play().catch((err) => {
        console.error('Play error:', err)
        setIsPlaying(false)
      })
      setIsPlaying(true)
    }
  }

  const handleNext = () => {
    if (currentIndex < studySet.jingles.length - 1) {
      setCurrentIndex(currentIndex + 1)
      setIsPlaying(true)
    }
  }

  const handlePrevious = () => {
    if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 1)
      setIsPlaying(true)
    }
  }

  const handleRestart = () => {
    setCurrentIndex(0)
    setIsPlaying(true)
  }

  const startEditing = () => {
    setEditedNotes((currentJingle as any).notes || `${currentJingle.term} — `)
    setEditedGenre((currentJingle as any).genre || 'random')
    setIsEditing(true)
  }

  const cancelEditing = () => {
    setIsEditing(false)
    setEditedNotes('')
  }

  const regenerateJingle = async () => {
    if (!editedNotes.trim()) {
      toast({
        title: 'Notes required',
        description: 'Please provide notes for regeneration',
        status: 'warning',
        duration: 3000,
      })
      return
    }

    setRegenerating(true)
    try {
      const response = await fetch('/api/generate-song', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          studyNotes: editedNotes,
          genre: editedGenre,
          userId: user?.id, // Pass userId for token deduction
        }),
      })

      const data = await response.json()

      if (!response.ok) throw new Error(data.error || 'Failed to regenerate')

      const updatedJingles = [...studySet.jingles]
      updatedJingles[currentIndex] = {
        ...currentJingle,
        lyrics: data.lyrics || '',
        audioUrl: data.audioUrl || null,
        notes: editedNotes,
        genre: editedGenre,
      } as any

      if (supabase) {
        const { error } = await supabase
          .from('sets')
          .update({ jingles: updatedJingles })
          .eq('id', studySet.id)

        if (error) throw error
      }

      setStudySet({ ...studySet, jingles: updatedJingles })
      setIsEditing(false) // Close edit mode after successful regeneration
      toast({
        title: 'Regenerated!',
        description: 'New jingle created successfully',
        status: 'success',
        duration: 2000,
      })
    } catch (err: any) {
      toast({
        title: 'Error',
        description: err.message,
        status: 'error',
        duration: 3000,
      })
    } finally {
      setRegenerating(false)
    }
  }

  const deleteJingle = async () => {
    if (studySet.jingles.length === 1) {
      toast({
        title: 'Cannot delete',
        description: 'Must have at least one jingle in a set',
        status: 'warning',
        duration: 3000,
      })
      return
    }

    try {
      const updatedJingles = studySet.jingles.filter((_, i) => i !== currentIndex)

      if (supabase) {
        const { error } = await supabase
          .from('sets')
          .update({ jingles: updatedJingles })
          .eq('id', studySet.id)

        if (error) throw error
      }

      setStudySet({ ...studySet, jingles: updatedJingles })
      if (currentIndex >= updatedJingles.length) {
        setCurrentIndex(updatedJingles.length - 1)
      }
      toast({
        title: 'Deleted',
        description: 'Jingle removed',
        status: 'success',
        duration: 2000,
      })
    } catch (err: any) {
      toast({
        title: 'Error',
        description: err.message,
        status: 'error',
        duration: 3000,
      })
    }
  }

  const addNewTerms = async () => {
    if (!newTerms.trim()) return

    setAddingNewTerms(true)
    try {
      // Parse the notes to extract term-definition pairs
      const lines = newTerms.split('\n').filter(line => line.trim())
      const newJingles: any[] = []
      
      for (const line of lines) {
        const separators = ['—', ':', '-', '–']
        let term = ''
        let definition = ''
        
        // Try to find a separator
        for (const sep of separators) {
          if (line.includes(sep)) {
            const parts = line.split(sep)
            if (parts.length >= 2) {
              term = parts[0].trim()
              definition = parts.slice(1).join(sep).trim()
              break
            }
          }
        }
        
        // If no separator found, treat the whole line as the term
        if (!term) {
          term = line.trim()
        }
        
        // Generate jingle for this term
        const studyNotes = definition ? `${term} — ${definition}` : term
        
        const response = await fetch('/api/generate-song', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            studyNotes,
            genre: 'random',
            userId: user?.id, // Pass userId for token deduction
          }),
        })

        if (response.ok) {
          const data = await response.json()
          newJingles.push({
            term,
            lyrics: data.lyrics || '',
            audioUrl: data.audioUrl || null,
            notes: studyNotes,
            genre: 'random',
          })
        } else {
          const data = await response.json()
          newJingles.push({
            term,
            lyrics: `Failed to generate: ${data.error || 'Unknown error'}`,
            audioUrl: null,
            notes: studyNotes,
            genre: 'random',
          })
        }
      }

      const updatedJingles = [...studySet.jingles, ...newJingles]

      if (supabase) {
        const { error } = await supabase
          .from('sets')
          .update({ jingles: updatedJingles })
          .eq('id', studySet.id)

        if (error) throw error
      }

      setStudySet({ ...studySet, jingles: updatedJingles })
      setNewTerms('')
      setIsAddingTerms(false)
      toast({
        title: 'Added!',
        description: `${newJingles.length} new mnemonics added`,
        status: 'success',
        duration: 2000,
      })
    } catch (err: any) {
      toast({
        title: 'Error',
        description: err.message,
        status: 'error',
        duration: 3000,
      })
    } finally {
      setAddingNewTerms(false)
    }
  }

  // Touch handlers for swipe
  const handleTouchStart = (e: React.TouchEvent) => {
    setTouchStart(e.targetTouches[0].clientX)
  }

  const handleTouchMove = (e: React.TouchEvent) => {
    setTouchEnd(e.targetTouches[0].clientX)
  }

  const handleTouchEnd = () => {
    if (!touchStart || !touchEnd) return
    
    const distance = touchStart - touchEnd
    const isLeftSwipe = distance > 50
    const isRightSwipe = distance < -50

    if (isLeftSwipe) handleNext()
    if (isRightSwipe) handlePrevious()

    setTouchStart(0)
    setTouchEnd(0)
  }

  const handleDownload = async () => {
    // Check if user has download permission
    if (!features.canDownload) {
      toast({
        title: 'Upgrade Required',
        description: 'Download MP3s is a premium feature. Upgrade to Basic or Premium to unlock downloads.',
        status: 'warning',
        duration: 5000,
      })
      router.push('/pricing')
      return
    }

    if (!currentJingle?.audioUrl) {
      toast({
        title: 'No audio available',
        description: 'This jingle does not have audio to download',
        status: 'warning',
        duration: 3000,
      })
      return
    }

    try {
      const response = await fetch(currentJingle.audioUrl)
      if (!response.ok) throw new Error('Failed to fetch audio')

      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = `${currentJingle.term.replace(/[^a-zA-Z0-9]/g, '_')}.mp3`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      window.URL.revokeObjectURL(url)

      toast({
        title: 'Download started',
        description: `${currentJingle.term} audio is downloading`,
        status: 'success',
        duration: 2000,
      })
    } catch (error) {
      console.error('Download error:', error)
      toast({
        title: 'Download failed',
        description: 'Could not download the audio file',
        status: 'error',
        duration: 3000,
      })
    }
  }

  const handleStitchAudio = async () => {
    if (tier !== 'premium') {
      toast({
        title: 'Premium Feature',
        description: 'Audio stitching is only available for Premium users. Upgrade to unlock this feature.',
        status: 'warning',
        duration: 5000,
      })
      router.push('/pricing')
      return
    }

    setStitchingAudio(true)

    try {
      const response = await fetch('/api/stitch-audio', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          setId: studySet.id,
          userId: user?.id,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to stitch audio')
      }

      // Update the study set with the stitched audio URL
      console.log('🔄 Updating studySet with stitch URL:', data.stitchedAudioUrl)
      setStudySet({
        ...studySet,
        stitch: data.stitchedAudioUrl
      })

      console.log('✅ StudySet updated, stitch URL should now be available')

      toast({
        title: 'Audio Stitched!',
        description: `Successfully combined ${data.jinglesCount} jingles into one MP3`,
        status: 'success',
        duration: 5000,
      })

    } catch (error) {
      console.error('Error stitching audio:', error)
      toast({
        title: 'Stitching Failed',
        description: error instanceof Error ? error.message : 'Failed to stitch audio files',
        status: 'error',
        duration: 5000,
      })
    } finally {
      setStitchingAudio(false)
    }
  }

  const toggleStitchedPlayback = () => {
    if (!stitchedAudioRef.current) return

    if (playingStitched) {
      stitchedAudioRef.current.pause()
      setPlayingStitched(false)
    } else {
      // Pause individual jingle if playing
      if (audioRef.current) {
        audioRef.current.pause()
        setIsPlaying(false)
      }
      stitchedAudioRef.current.play()
      setPlayingStitched(true)
    }
  }

  const handleDownloadStitched = async () => {
    if (!studySet.stitch) {
      toast({
        title: 'No stitched audio',
        description: 'Please stitch the audio first',
        status: 'warning',
        duration: 3000,
      })
      return
    }

    console.log('🎵 Downloading stitched audio:', studySet.stitch)

    try {
      const response = await fetch(studySet.stitch)
      console.log('📥 Fetch response:', response.status, response.statusText)
      
      if (!response.ok) {
        console.error('❌ Fetch failed:', response.status, response.statusText)
        throw new Error(`Failed to fetch audio: ${response.status} ${response.statusText}`)
      }

      const blob = await response.blob()
      console.log('📦 Blob created:', blob.size, 'bytes')
      
      const url = window.URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = `${studySet.subject.replace(/[^a-zA-Z0-9]/g, '_')}_complete.mp3`
      link.style.display = 'none'
      
      document.body.appendChild(link)
      console.log('🔗 Triggering download...')
      link.click()
      
      // Clean up
      setTimeout(() => {
        document.body.removeChild(link)
        window.URL.revokeObjectURL(url)
        console.log('🧹 Cleaned up download link')
      }, 100)

      toast({
        title: 'Download started',
        description: 'Complete study set audio is downloading',
        status: 'success',
        duration: 2000,
      })
    } catch (error) {
      console.error('❌ Download error:', error)
      toast({
        title: 'Download failed',
        description: error instanceof Error ? error.message : 'Could not download the stitched audio file',
        status: 'error',
        duration: 5000,
      })
    }
  }

  return (
    <VStack spacing={4} align="stretch" w="100%">
      <audio ref={audioRef} />
      <audio 
        ref={stitchedAudioRef} 
        src={studySet.stitch}
        onEnded={() => setPlayingStitched(false)}
      />

      {/* Audio Generation Progress Bar */}
      {generatingAudio && (
        <Box
          bg="rgba(26, 26, 46, 0.9)"
          p={4}
          borderRadius="xl"
          borderWidth={2}
          borderColor="brand.500"
        >
          <VStack spacing={2} align="stretch">
            <HStack justify="space-between">
              <Text fontSize="sm" fontWeight="600" color="white">
                Generating audio...
              </Text>
              <Text fontSize="sm" color="whiteAlpha.700">
                {audioProgress.current}/{audioProgress.total}
              </Text>
            </HStack>
            <Progress
              value={(audioProgress.current / audioProgress.total) * 100}
              colorScheme="brand"
              bg="rgba(42, 42, 64, 0.6)"
              borderRadius="full"
              height="8px"
              sx={{
                '& > div': {
                  background: 'linear-gradient(135deg, #d946ef 0%, #f97316 100%)',
                },
              }}
            />
          </VStack>
        </Box>
      )}

      {/* Header */}
      <HStack justify="space-between" align="center" spacing={{ base: 2, sm: 4 }}>
        <IconButton
          aria-label="Back"
          icon={<ArrowLeft size={20} />}
          onClick={() => router.push('/my-sets')}
          bg="rgba(26, 26, 46, 0.6)"
          color="whiteAlpha.700"
          _hover={{ bg: 'rgba(37, 37, 64, 0.8)' }}
          size={{ base: "sm", sm: "md" }}
          borderRadius="xl"
        />
        <Heading 
          size={{ base: "md", sm: "lg" }} 
          color="white" 
          textAlign="center" 
          flex={1}
          px={{ base: 2, sm: 0 }}
          isTruncated
        >
          {studySet.subject}
        </Heading>
        <HStack>
          <IconButton
            aria-label="Add terms"
            icon={<Plus size={20} />}
            onClick={() => setIsAddingTerms(!isAddingTerms)}
            bg={isAddingTerms ? 'brand.500' : 'rgba(26, 26, 46, 0.6)'}
            color="white"
            _hover={{ bg: isAddingTerms ? 'brand.600' : 'rgba(37, 37, 64, 0.8)' }}
            size={{ base: "sm", sm: "md" }}
            borderRadius="xl"
          />
        </HStack>
      </HStack>

      {/* Add Terms Section */}
      {isAddingTerms && (
        <Box
          bg="rgba(26, 26, 46, 0.6)"
          p={{ base: 4, sm: 6 }}
          borderRadius="2xl"
          borderWidth={2}
          borderColor="brand.500"
        >
          <VStack spacing={{ base: 4, sm: 5 }} align="stretch">
            <VStack align="start" spacing={3}>
              <Heading size={{ base: "xs", sm: "sm" }} color="white">
                Add More Terms
              </Heading>
              <Text color="whiteAlpha.600" fontSize={{ base: "xs", sm: "sm" }}>
                Add new terms with definitions to generate more mnemonics. Format: <Text as="span" color="brand.400" fontWeight="600">Term — Definition</Text>
              </Text>
              
              {/* Show current terms */}
              <Box
                bg="rgba(42, 42, 64, 0.6)"
                p={4}
                borderRadius="xl"
                borderWidth={1}
                borderColor="rgba(217, 70, 239, 0.1)"
                w="100%"
              >
                <Text color="whiteAlpha.500" fontSize="xs" fontWeight="600" textTransform="uppercase" mb={2}>
                  Current Terms in Set ({studySet.jingles.length})
                </Text>
                <HStack spacing={2} flexWrap="wrap">
                  {studySet.jingles.map((jingle, idx) => (
                    <Box
                      key={idx}
                      px={2}
                      py={1}
                      bg="rgba(217, 70, 239, 0.1)"
                      borderRadius="md"
                      fontSize="xs"
                      fontWeight="600"
                      color="whiteAlpha.700"
                    >
                      {jingle.term}
                    </Box>
                  ))}
                </HStack>
              </Box>
            </VStack>

            <Textarea
              value={newTerms}
              onChange={(e) => setNewTerms(e.target.value)}
              placeholder="Mitosis — Cell division that produces two identical daughter cells

Meiosis — Cell division that produces four gametes with half the chromosomes

Format: Term — Definition (one per line)"
              bg="rgba(42, 42, 64, 0.6)"
              color="white"
              borderColor="rgba(217, 70, 239, 0.2)"
              _hover={{ borderColor: 'brand.500' }}
              _focus={{ borderColor: 'brand.500', boxShadow: '0 0 0 1px #d946ef' }}
              minHeight="200px"
              borderRadius="xl"
              fontSize="md"
              fontWeight="500"
            />
            <HStack spacing={3}>
              <Button
                onClick={addNewTerms}
                isLoading={addingNewTerms}
                bgGradient="linear(135deg, brand.500 0%, accent.500 100%)"
                color="white"
                _hover={{ bgGradient: "linear(135deg, brand.600 0%, accent.600 100%)" }}
                flex={1}
                h="48px"
                fontSize="md"
              >
                Generate & Add Mnemonics
              </Button>
              <Button
                onClick={() => {
                  setIsAddingTerms(false)
                  setNewTerms('')
                }}
                bg="rgba(37, 37, 64, 0.8)"
                color="white"
                _hover={{ bg: 'rgba(50, 50, 80, 0.9)' }}
                h="48px"
              >
                Cancel
              </Button>
            </HStack>
          </VStack>
        </Box>
      )}

      {/* Progress Bar */}
      <Box mb={2}>
        <HStack justify="space-between" mb={1}>
          <Text color="whiteAlpha.600" fontSize={{ base: "xs", sm: "sm" }} fontWeight="500">
            {currentIndex + 1} of {studySet.jingles.length}
          </Text>
          <Text color="whiteAlpha.600" fontSize={{ base: "xs", sm: "sm" }} fontWeight="500">
            {Math.round(((currentIndex + 1) / studySet.jingles.length) * 100)}%
          </Text>
        </HStack>
        <Progress
          value={((currentIndex + 1) / studySet.jingles.length) * 100}
          colorScheme="brand"
          bg="rgba(26, 26, 46, 0.6)"
          borderRadius="full"
          height={{ base: "6px", sm: "8px" }}
          sx={{
            '& > div': {
              background: 'linear-gradient(135deg, #d946ef 0%, #f97316 100%)',
            },
          }}
        />
      </Box>

      {/* Flashcard */}
      <Box
        bg="rgba(26, 26, 46, 0.6)"
        borderRadius="2xl"
        p={{ base: 5, md: 6 }}
        borderWidth={2}
        borderColor="brand.500"
        display="flex"
        flexDirection="column"
        justifyContent="center"
        alignItems="center"
        position="relative"
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        transition="all 0.3s ease"
        _hover={{ transform: 'translateY(-4px)', boxShadow: '0 20px 40px rgba(217, 70, 239, 0.3)' }}
        mb={3}
        w="100%"
      >
        {isEditing ? (
          <VStack spacing={{ base: 3, sm: 4 }} w="100%" align="stretch">
            <Heading size={{ base: "md", sm: "lg" }} color="white" textAlign="center">
              {currentJingle.term}
            </Heading>
            
            <Text color="brand.300" fontWeight="600" fontSize={{ base: "xs", sm: "sm" }} textTransform="uppercase" textAlign="center">
              Edit & Regenerate
            </Text>

            <Box>
              <Text color="whiteAlpha.600" fontSize={{ base: "xs", sm: "sm" }} mb={2}>Notes (for jingle content)</Text>
              <Textarea
                value={editedNotes}
                onChange={(e) => setEditedNotes(e.target.value)}
                placeholder="Term — Definition/Explanation"
                bg="rgba(42, 42, 64, 0.6)"
                color="white"
                borderColor="rgba(217, 70, 239, 0.2)"
                _hover={{ borderColor: 'brand.500' }}
                _focus={{ borderColor: 'brand.500', boxShadow: '0 0 0 1px #d946ef' }}
                rows={4}
                resize="vertical"
                borderRadius="xl"
                fontSize={{ base: "sm", sm: "md" }}
              />
            </Box>

            <Box>
              <Text color="whiteAlpha.600" fontSize="sm" mb={2}>Music Genre</Text>
              <Select
                value={editedGenre}
                onChange={(e) => setEditedGenre(e.target.value)}
                bg="rgba(42, 42, 64, 0.6)"
                color="white"
                borderColor="rgba(217, 70, 239, 0.2)"
                _hover={{ borderColor: 'brand.500' }}
                _focus={{ borderColor: 'brand.500', boxShadow: '0 0 0 1px #d946ef' }}
                borderRadius="xl"
              >
                <option value="random" style={{ background: '#1a1a2e' }}>🎲 Random</option>
                <option value="pop" style={{ background: '#1a1a2e' }}>🎵 Pop</option>
                <option value="rock" style={{ background: '#1a1a2e' }}>🎸 Rock</option>
                <option value="hip-hop" style={{ background: '#1a1a2e' }}>🎤 Hip-Hop</option>
                <option value="country" style={{ background: '#1a1a2e' }}>🤠 Country</option>
                <option value="jazz" style={{ background: '#1a1a2e' }}>🎷 Jazz</option>
                <option value="classical" style={{ background: '#1a1a2e' }}>🎼 Classical</option>
                <option value="electronic" style={{ background: '#1a1a2e' }}>🎛️ Electronic</option>
                <option value="reggae" style={{ background: '#1a1a2e' }}>🌴 Reggae</option>
                <option value="blues" style={{ background: '#1a1a2e' }}>🎸 Blues</option>
              </Select>
            </Box>

            <HStack spacing={3}>
              <Button
                onClick={regenerateJingle}
                isLoading={regenerating}
                bgGradient="linear(135deg, brand.500 0%, accent.500 100%)"
                color="white"
                _hover={{ bgGradient: "linear(135deg, brand.600 0%, accent.600 100%)", transform: 'translateY(-2px)' }}
                leftIcon={<RefreshCw size={18} />}
                flex={1}
                size="lg"
              >
                Regenerate Jingle
              </Button>
              <IconButton
                aria-label="Cancel"
                icon={<X size={20} />}
                onClick={cancelEditing}
                bg="rgba(37, 37, 64, 0.8)"
                color="white"
                _hover={{ bg: 'rgba(50, 50, 80, 0.9)' }}
                size="lg"
                borderRadius="xl"
              />
            </HStack>
          </VStack>
        ) : (
          <VStack spacing={5} w="100%">
            <HStack position="absolute" top={4} right={4}>
              <IconButton
                aria-label="Edit"
                icon={<Edit3 size={18} />}
                onClick={startEditing}
                size="sm"
                bg="rgba(37, 37, 64, 0.8)"
                color="whiteAlpha.700"
                _hover={{ bg: 'rgba(50, 50, 80, 0.9)', color: 'white' }}
                borderRadius="lg"
              />
              <IconButton
                aria-label="Delete"
                icon={<Trash2 size={18} />}
                onClick={deleteJingle}
                size="sm"
                bg="rgba(239, 68, 68, 0.1)"
                color="red.400"
                borderColor="rgba(239, 68, 68, 0.3)"
                borderWidth={1}
                _hover={{ bg: 'rgba(239, 68, 68, 0.2)', borderColor: 'red.500' }}
                borderRadius="lg"
              />
            </HStack>

            <Heading size="2xl" color="white" textAlign="center" mt={2}>
              {currentJingle.term}
            </Heading>

            <Box
              bg="rgba(42, 42, 64, 0.6)"
              p={5}
              borderRadius="xl"
              w="100%"
              borderWidth={1}
              borderColor="rgba(217, 70, 239, 0.1)"
            >
              <Text
                color="whiteAlpha.900"
                fontSize="md"
                lineHeight="tall"
                whiteSpace="pre-wrap"
                textAlign="center"
                fontFamily="'Outfit', sans-serif"
                fontWeight="500"
              >
                {currentJingle.lyrics}
              </Text>
            </Box>
          </VStack>
        )}
      </Box>

      {/* Controls */}
      <HStack justify="center" spacing={4} mb={3}>
        <IconButton
          aria-label="Previous"
          icon={<ChevronLeft size={24} />}
          onClick={handlePrevious}
          isDisabled={currentIndex === 0}
          bg="rgba(26, 26, 46, 0.6)"
          color="white"
          _hover={{ bg: 'rgba(37, 37, 64, 0.8)' }}
          _disabled={{ opacity: 0.3, cursor: 'not-allowed' }}
          size="lg"
          borderRadius="xl"
        />

        <IconButton
          aria-label={isPlaying ? 'Pause' : 'Play'}
          icon={isPlaying ? <Pause size={32} /> : <Play size={32} />}
          onClick={togglePlayPause}
          isDisabled={!currentJingle?.audioUrl}
          bgGradient="linear(135deg, brand.500 0%, accent.500 100%)"
          color="white"
          _hover={{ bgGradient: "linear(135deg, brand.600 0%, accent.600 100%)", transform: 'scale(1.05)' }}
          size="lg"
          width="80px"
          height="80px"
          borderRadius="full"
          boxShadow="0 10px 30px rgba(217, 70, 239, 0.4)"
          _active={{ transform: 'scale(0.95)' }}
          transition="all 0.2s"
        />

        <IconButton
          aria-label="Next"
          icon={<ChevronRight size={24} />}
          onClick={handleNext}
          isDisabled={currentIndex === studySet.jingles.length - 1}
          bg="rgba(26, 26, 46, 0.6)"
          color="white"
          _hover={{ bg: 'rgba(37, 37, 64, 0.8)' }}
          _disabled={{ opacity: 0.3, cursor: 'not-allowed' }}
          size="lg"
          borderRadius="xl"
        />
      </HStack>

      {/* Secondary Controls */}
      <HStack justify="center" spacing={4} mb={1}>
        <Button
          leftIcon={<RotateCcw size={18} />}
          onClick={handleRestart}
          bg="rgba(26, 26, 46, 0.6)"
          color="whiteAlpha.700"
          _hover={{ bg: 'rgba(37, 37, 64, 0.8)', color: 'white' }}
          size="sm"
          borderRadius="xl"
        >
          Restart
        </Button>
        {currentJingle?.audioUrl && (
          <Button
            leftIcon={<Download size={18} />}
            onClick={handleDownload}
            bg="rgba(217, 70, 239, 0.1)"
            color="brand.300"
            borderWidth={1}
            borderColor="brand.500"
            _hover={{ 
              bg: 'rgba(217, 70, 239, 0.2)', 
              borderColor: 'brand.400',
              color: 'brand.200'
            }}
            size="sm"
            borderRadius="xl"
          >
            Download MP3
          </Button>
        )}
        {tier === 'premium' && (
          <Button
            leftIcon={<Download size={18} />}
            onClick={studySet.stitch ? handleDownloadStitched : handleStitchAudio}
            isLoading={stitchingAudio}
            loadingText="Stitching..."
            bg="rgba(34, 197, 94, 0.1)"
            color="green.300"
            borderWidth={1}
            borderColor="green.500"
            _hover={{ 
              bg: 'rgba(34, 197, 94, 0.2)', 
              borderColor: 'green.400',
              color: 'green.200'
            }}
            size="sm"
            borderRadius="xl"
          >
            {studySet.stitch ? 'Download Stitch' : 'Stitch All'}
          </Button>
        )}
      </HStack>

      {/* Swipe Hint */}
      <Text color="whiteAlpha.500" fontSize="sm" textAlign="center" fontWeight="500">
        Swipe or use arrow keys to navigate • Space to play/pause
      </Text>
    </VStack>
  )
}

