'use client'

import { Button, HStack, Menu, MenuButton, MenuItem, MenuList, useToast } from '@chakra-ui/react'
import { Share2, Twitter, Facebook, Link as LinkIcon, Download } from 'lucide-react'
import { useSubscription } from '../hooks/useSubscription'
import { useRouter } from 'next/navigation'

interface ShareButtonProps {
  term: string
  lyrics: string
  audioUrl?: string
}

export default function ShareButton({ term, lyrics, audioUrl }: ShareButtonProps) {
  const toast = useToast()
  const { features } = useSubscription()
  const router = useRouter()

  const shareText = `🎵 Just learned "${term}" with a catchy jingle on Noomo AI!\n\nLyrics:\n${lyrics.slice(0, 150)}...\n\nTry it yourself: `
  const shareUrl = typeof window !== 'undefined' ? window.location.origin : 'https://Noomo.ai'

  const handleCopyLink = () => {
    navigator.clipboard.writeText(`${shareText}${shareUrl}`)
    toast({
      title: 'Copied to clipboard!',
      description: 'Share your jingle with friends',
      status: 'success',
      duration: 3000,
      isClosable: true,
    })
  }

  const handleTwitterShare = () => {
    const twitterUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}&url=${encodeURIComponent(shareUrl)}`
    window.open(twitterUrl, '_blank')
  }

  const handleFacebookShare = () => {
    const facebookUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}&quote=${encodeURIComponent(shareText)}`
    window.open(facebookUrl, '_blank')
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

    if (!audioUrl) {
      toast({
        title: 'No audio available',
        description: 'This jingle doesn\'t have audio to download',
        status: 'error',
        duration: 3000,
      })
      return
    }

    try {
      const response = await fetch(audioUrl)
      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `${term.replace(/\s+/g, '_')}_jingle.mp3`
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)
      
      toast({
        title: 'Downloaded!',
        description: 'Your jingle is ready to go',
        status: 'success',
        duration: 3000,
      })
    } catch (error) {
      toast({
        title: 'Download failed',
        description: 'Unable to download the audio',
        status: 'error',
        duration: 3000,
      })
    }
  }

  return (
    <Menu>
      <MenuButton
        as={Button}
        leftIcon={<Share2 size={18} />}
        bgGradient="linear(135deg, purple.500 0%, pink.500 100%)"
        color="white"
        size="md"
        fontWeight="600"
        _hover={{
          bgGradient: 'linear(135deg, purple.600 0%, pink.600 100%)',
          transform: 'translateY(-2px)',
          boxShadow: '0 8px 25px rgba(147, 51, 234, 0.3)',
        }}
        transition="all 0.2s"
      >
        Share
      </MenuButton>
      <MenuList bg="rgba(26, 26, 46, 0.95)" borderColor="rgba(217, 70, 239, 0.2)" backdropFilter="blur(10px)">
        <MenuItem
          icon={<Twitter size={18} />}
          onClick={handleTwitterShare}
          bg="transparent"
          _hover={{ bg: 'rgba(217, 70, 239, 0.2)' }}
          color="white"
        >
          Share on Twitter
        </MenuItem>
        <MenuItem
          icon={<Facebook size={18} />}
          onClick={handleFacebookShare}
          bg="transparent"
          _hover={{ bg: 'rgba(217, 70, 239, 0.2)' }}
          color="white"
        >
          Share on Facebook
        </MenuItem>
        <MenuItem
          icon={<LinkIcon size={18} />}
          onClick={handleCopyLink}
          bg="transparent"
          _hover={{ bg: 'rgba(217, 70, 239, 0.2)' }}
          color="white"
        >
          Copy Link
        </MenuItem>
        {audioUrl && (
          <MenuItem
            icon={<Download size={18} />}
            onClick={handleDownload}
            bg="transparent"
            _hover={{ bg: 'rgba(217, 70, 239, 0.2)' }}
            color="white"
          >
            Download MP3
          </MenuItem>
        )}
      </MenuList>
    </Menu>
  )
}

