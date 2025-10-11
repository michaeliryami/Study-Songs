'use client'

import { Box, Heading, Text, VStack } from '@chakra-ui/react'
import { keyframes } from '@emotion/react'
import { Sparkles, Music, Zap } from 'lucide-react'

const float = keyframes`
  0%, 100% { transform: translateY(0px); }
  50% { transform: translateY(-20px); }
`

const pulse = keyframes`
  0%, 100% { transform: scale(1); opacity: 1; }
  50% { transform: scale(1.1); opacity: 0.8; }
`

const fadeIn = keyframes`
  from { opacity: 0; transform: scale(0.8); }
  to { opacity: 1; transform: scale(1); }
`

interface SuccessAnimationProps {
  count: number
  subject: string
}

export default function SuccessAnimation({ count, subject }: SuccessAnimationProps) {
  return (
    <VStack 
      spacing={6} 
      py={12} 
      animation={`${fadeIn} 0.5s ease-out`}
      bg="rgba(26, 26, 46, 0.6)"
      borderRadius="2xl"
      border="2px solid"
      borderColor="rgba(34, 197, 94, 0.3)"
      position="relative"
      overflow="hidden"
    >
      {/* Animated background particles */}
      <Box position="absolute" top="20%" left="10%" animation={`${float} 3s ease-in-out infinite`}>
        <Sparkles size={24} color="#22c55e" opacity={0.6} />
      </Box>
      <Box position="absolute" top="30%" right="15%" animation={`${float} 2.5s ease-in-out infinite 0.5s`}>
        <Music size={28} color="#d946ef" opacity={0.6} />
      </Box>
      <Box position="absolute" bottom="25%" left="20%" animation={`${float} 2.8s ease-in-out infinite 1s`}>
        <Zap size={20} color="#f97316" opacity={0.6} />
      </Box>
      <Box position="absolute" bottom="30%" right="10%" animation={`${float} 3.2s ease-in-out infinite 1.5s`}>
        <Sparkles size={20} color="#22c55e" opacity={0.6} />
      </Box>

      <Box
        w="120px"
        h="120px"
        bgGradient="linear(135deg, success.500 0%, brand.500 100%)"
        borderRadius="full"
        display="flex"
        alignItems="center"
        justifyContent="center"
        animation={`${pulse} 2s ease-in-out infinite`}
        boxShadow="0 0 60px rgba(34, 197, 94, 0.4)"
      >
        <Sparkles size={60} color="#ffffff" strokeWidth={2} />
      </Box>

      <VStack spacing={2}>
        <Heading 
          fontSize="3xl" 
          fontWeight="900"
          bgGradient="linear(135deg, success.400 0%, brand.400 100%)"
          bgClip="text"
          textAlign="center"
        >
          Study Set Created!
        </Heading>
        <Text fontSize="lg" color="whiteAlpha.700" fontWeight="600" textAlign="center">
          {count} jingles for "{subject}"
        </Text>
      </VStack>

      <VStack spacing={1}>
        <Text fontSize="md" color="whiteAlpha.600" textAlign="center">
          Your brain is about to thank you!
        </Text>
        <Text fontSize="sm" color="whiteAlpha.500" textAlign="center">
          Listen, learn, and ace that test
        </Text>
      </VStack>
    </VStack>
  )
}

