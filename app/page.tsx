'use client'

import {
  Box,
  Button,
  Container,
  Heading,
  Text,
  VStack,
  HStack,
  SimpleGrid,
  Badge,
} from '@chakra-ui/react'
import { keyframes } from '@emotion/react'
import { Music, Brain, Zap, BookOpen, Sparkles, ArrowRight, TrendingUp, Users, Headphones, Clock, Star, CheckCircle, ChevronDown } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useAuth } from './contexts/AuthContext'

const float = keyframes`
  0%, 100% { transform: translateY(0px); }
  50% { transform: translateY(-20px); }
`

const pulse = keyframes`
  0%, 100% { opacity: 1; }
  50% { opacity: 0.5; }
`

const glow = keyframes`
  0%, 100% { box-shadow: 0 10px 40px rgba(217, 70, 239, 0.4); }
  50% { box-shadow: 0 10px 60px rgba(217, 70, 239, 0.8); }
`

const bounce = keyframes`
  0%, 100% { transform: translateY(0px); }
  50% { transform: translateY(10px); }
`

export default function Home() {
  const router = useRouter()
  const { user } = useAuth()

  const handleGetStarted = () => {
    if (user) {
    router.push('/create')
    } else {
      router.push('/auth')
    }
  }

  return (
    <Box minH="100vh" bg="#0f0f1a" position="relative" overflow="hidden">
      {/* Animated Background Elements */}
      <Box
        position="absolute"
        top="10%"
        right="10%"
        w="300px"
        h="300px"
        bgGradient="radial(circle, brand.500, transparent)"
        opacity={0.1}
        filter="blur(60px)"
        animation={`${pulse} 4s ease-in-out infinite`}
      />
      <Box
        position="absolute"
        bottom="10%"
        left="5%"
        w="400px"
        h="400px"
        bgGradient="radial(circle, accent.500, transparent)"
        opacity={0.1}
        filter="blur(80px)"
        animation={`${pulse} 6s ease-in-out infinite`}
      />

      <Container maxW="1400px" w="100%" px={{ base: 4, md: 8 }} py={{ base: 8, md: 12 }} position="relative" zIndex={1}>
        <VStack spacing={{ base: 16, md: 24 }} align="stretch">
          {/* Hero Section */}
          <VStack spacing={8} textAlign="center" pt={{ base: 12, md: 20 }}>
            <Badge
              bgGradient="linear(135deg, brand.500 0%, accent.500 100%)"
              color="white"
              px={4}
              py={2}
              borderRadius="full"
              fontSize="sm"
              fontWeight="600"
              animation={`${float} 3s ease-in-out infinite`}
            >
              🎵 AI-Powered Study Tool
            </Badge>
            
            <Heading
              fontSize={{ base: "3xl", sm: "5xl", md: "7xl", lg: "8xl" }}
              fontWeight="900"
              letterSpacing="-0.04em"
              lineHeight="0.95"
              px={{ base: 2, sm: 0 }}
            >
              <Text
                as="span"
                bgGradient="linear(135deg, brand.400 0%, accent.400 100%)"
                bgClip="text"
              >
                Study Smarter
              </Text>
              <br />
              <Text as="span" color="white">
                With Music
              </Text>
            </Heading>
            
            <Text
              fontSize={{ base: "md", sm: "lg", md: "2xl" }}
              color="whiteAlpha.700"
              fontWeight="500"
              maxW={{ base: "100%", sm: "4xl" }}
              mx="auto"
              lineHeight="1.6"
              px={{ base: 4, sm: 0 }}
            >
              Turn any study material into catchy, memorable jingles. Start with 30 free tokens and unlock unlimited learning potential.
            </Text>

            <VStack spacing={4} pt={6} w="full" maxW={{ base: "100%", sm: "auto" }}>
              <HStack spacing={4} flexWrap="wrap" justify="center" w="full">
                <Button
                  bgGradient="linear(135deg, brand.500 0%, accent.500 100%)"
                  color="white"
                  size={{ base: "md", sm: "lg" }}
                  h={{ base: "56px", sm: "72px" }}
                  px={{ base: 6, sm: 10 }}
                  fontSize={{ base: "lg", sm: "xl" }}
                  fontWeight="700"
                  rightIcon={<ArrowRight size={24} />}
                  onClick={handleGetStarted}
                  _hover={{
                    bgGradient: "linear(135deg, brand.600 0%, accent.600 100%)",
                    transform: "translateY(-4px)",
                    boxShadow: "0 20px 60px rgba(217, 70, 239, 0.5)"
                  }}
                  transition="all 0.3s"
                  animation={`${glow} 3s ease-in-out infinite`}
                  w={{ base: "full", sm: "auto" }}
                  minW={{ base: "280px", sm: "auto" }}
                >
                  Start Creating Now
                </Button>
                <Button
                  bg="rgba(26, 26, 46, 0.8)"
                  color="white"
                  size={{ base: "md", sm: "lg" }}
                  h={{ base: "56px", sm: "72px" }}
                  px={{ base: 6, sm: 10 }}
                  fontSize={{ base: "lg", sm: "xl" }}
                  fontWeight="600"
                  borderWidth={2}
                  borderColor="rgba(217, 70, 239, 0.3)"
                  w={{ base: "full", sm: "auto" }}
                  minW={{ base: "280px", sm: "auto" }}
                onClick={() => router.push('/my-sets')}
                _hover={{
                  bg: "rgba(37, 37, 64, 0.9)",
                  transform: "translateY(-4px)",
                  borderColor: "brand.500"
                }}
                transition="all 0.3s"
              >
                View Demo
              </Button>
            </HStack>
            </VStack>

            {/* Key Benefits */}
            <SimpleGrid columns={{ base: 2, md: 4 }} spacing={8} pt={12} w="100%">
              <VStack>
                <HStack>
                  <Star size={20} color="#f97316" fill="#f97316" />
                  <Heading fontSize="3xl" fontWeight="900" bgGradient="linear(135deg, brand.400 0%, accent.400 100%)" bgClip="text">
                    10x
                  </Heading>
                </HStack>
                <Text fontSize="sm" color="whiteAlpha.600" fontWeight="500">
                  Better Retention
                </Text>
              </VStack>
              <VStack>
                <HStack>
                  <Clock size={20} color="#f97316" />
                  <Heading fontSize="3xl" fontWeight="900" bgGradient="linear(135deg, brand.400 0%, accent.400 100%)" bgClip="text">
                    30s
                  </Heading>
                </HStack>
                <Text fontSize="sm" color="whiteAlpha.600" fontWeight="500">
                  Per Jingles
                </Text>
              </VStack>
              <VStack>
                <HStack>
                  <Zap size={20} color="#f97316" />
                  <Heading fontSize="3xl" fontWeight="900" bgGradient="linear(135deg, brand.400 0%, accent.400 100%)" bgClip="text">
                    30
                  </Heading>
                </HStack>
                <Text fontSize="sm" color="whiteAlpha.600" fontWeight="500">
                  Free Tokens
                </Text>
              </VStack>
              <VStack>
                <HStack>
                  <Music size={20} color="#f97316" />
                  <Heading fontSize="3xl" fontWeight="900" bgGradient="linear(135deg, brand.400 0%, accent.400 100%)" bgClip="text">
                    ∞
                  </Heading>
                </HStack>
                <Text fontSize="sm" color="whiteAlpha.600" fontWeight="500">
                  Genres
                </Text>
              </VStack>
            </SimpleGrid>

            {/* Scroll Indicator */}
            <VStack pt={2} spacing={2}>
              <Text fontSize="xs" color="whiteAlpha.500" fontWeight="500" textTransform="uppercase" letterSpacing="wider">
                Scroll to explore
              </Text>
              <Box
                animation={`${bounce} 2s ease-in-out infinite`}
                cursor="pointer"
                onClick={() => {
                  window.scrollTo({
                    top: window.innerHeight,
                    behavior: 'smooth'
                  })
                }}
                _hover={{
                  transform: 'scale(1.1)',
                  color: 'brand.400'
                }}
                transition="all 0.2s"
              >
                <ChevronDown size={32} color="rgba(217, 70, 239, 0.8)" strokeWidth={3} />
              </Box>
            </VStack>
          </VStack>

          {/* Features Section */}
          <VStack spacing={6} pt={8}>
            <VStack spacing={3} textAlign="center">
              <Badge colorScheme="purple" fontSize="sm" px={3} py={1} borderRadius="full">
                FEATURES
              </Badge>
              <Heading fontSize={{ base: "3xl", md: "5xl" }} fontWeight="900" color="white">
                Why Noomo AI Works
              </Heading>
              <Text fontSize="lg" color="whiteAlpha.600" maxW="3xl">
                Backed by neuroscience, powered by AI
              </Text>
            </VStack>

            <SimpleGrid columns={{ base: 1, md: 3 }} spacing={8} w="100%" pt={8}>
              <Box
                bg="rgba(26, 26, 46, 0.6)"
                p={10}
                borderRadius="3xl"
                borderWidth={2}
                borderColor="brand.500"
                transition="all 0.3s"
                position="relative"
                overflow="hidden"
                h="400px"
                display="flex"
                flexDirection="column"
                _hover={{
                  transform: "translateY(-8px)",
                  boxShadow: "0 30px 60px rgba(217, 70, 239, 0.4)",
                  borderColor: "brand.400"
                }}
              >
                <Box
                  position="absolute"
                  top={-20}
                  right={-20}
                  w="150px"
                  h="150px"
                  bgGradient="radial(circle, brand.500, transparent)"
                  opacity={0.2}
                  filter="blur(40px)"
                />
                <Box
                  display="inline-flex"
                  alignItems="center"
                  justifyContent="center"
                  w="72px"
                  h="72px"
                  bgGradient="linear(135deg, brand.500 0%, accent.500 100%)"
                  borderRadius="2xl"
                  mb={6}
                  boxShadow="0 10px 30px rgba(217, 70, 239, 0.4)"
                >
                  <Brain size={36} color="white" strokeWidth={2} />
                </Box>
                <Heading size="lg" color="white" mb={4}>
                  10x Better Retention
                </Heading>
                <Text color="whiteAlpha.700" fontSize="md" lineHeight="tall" flex="1">
                  Music activates multiple brain regions simultaneously, creating stronger neural pathways and dramatically improving long-term memory retention.
                </Text>
                <HStack mt={6} spacing={2}>
                  <CheckCircle size={18} color="#10b981" />
                  <Text fontSize="sm" color="green.300" fontWeight="600">Science-backed approach</Text>
                </HStack>
              </Box>

              <Box
                bg="rgba(26, 26, 46, 0.6)"
                p={10}
                borderRadius="3xl"
                borderWidth={2}
                borderColor="brand.500"
                transition="all 0.3s"
                position="relative"
                overflow="hidden"
                h="400px"
                display="flex"
                flexDirection="column"
                _hover={{
                  transform: "translateY(-8px)",
                  boxShadow: "0 30px 60px rgba(217, 70, 239, 0.4)",
                  borderColor: "brand.400"
                }}
              >
                <Box
                  position="absolute"
                  top={-20}
                  right={-20}
                  w="150px"
                  h="150px"
                  bgGradient="radial(circle, accent.500, transparent)"
                  opacity={0.2}
                  filter="blur(40px)"
                />
                <Box
                  display="inline-flex"
                  alignItems="center"
                  justifyContent="center"
                  w="72px"
                  h="72px"
                  bgGradient="linear(135deg, brand.500 0%, accent.500 100%)"
                  borderRadius="2xl"
                  mb={6}
                  boxShadow="0 10px 30px rgba(217, 70, 239, 0.4)"
                >
                  <Zap size={36} color="white" strokeWidth={2} />
                </Box>
                <Heading size="lg" color="white" mb={4}>
                  Lightning Fast
                </Heading>
                <Text color="whiteAlpha.700" fontSize="md" lineHeight="tall" flex="1">
                  Generate professional-quality study jingles in under 30 seconds. Stop wasting hours on flashcards and start studying smarter.
                </Text>
                <HStack mt={6} spacing={2}>
                  <CheckCircle size={18} color="#10b981" />
                  <Text fontSize="sm" color="green.300" fontWeight="600">Instant generation</Text>
                </HStack>
              </Box>

              <Box
                bg="rgba(26, 26, 46, 0.6)"
                p={10}
                borderRadius="3xl"
                borderWidth={2}
                borderColor="brand.500"
                transition="all 0.3s"
                position="relative"
                overflow="hidden"
                h="400px"
                display="flex"
                flexDirection="column"
                _hover={{
                  transform: "translateY(-8px)",
                  boxShadow: "0 30px 60px rgba(217, 70, 239, 0.4)",
                  borderColor: "brand.400"
                }}
              >
                <Box
                  position="absolute"
                  top={-20}
                  right={-20}
                  w="150px"
                  h="150px"
                  bgGradient="radial(circle, brand.500, transparent)"
                  opacity={0.2}
                  filter="blur(40px)"
                />
                <Box
                  display="inline-flex"
                  alignItems="center"
                  justifyContent="center"
                  w="72px"
                  h="72px"
                  bgGradient="linear(135deg, brand.500 0%, accent.500 100%)"
                  borderRadius="2xl"
                  mb={6}
                  boxShadow="0 10px 30px rgba(217, 70, 239, 0.4)"
                >
                  <Sparkles size={36} color="white" strokeWidth={2} />
                </Box>
                <Heading size="lg" color="white" mb={4}>
                  Actually Enjoyable
                </Heading>
                <Text color="whiteAlpha.700" fontSize="md" lineHeight="tall" flex="1">
                  Choose from Pop, R&B, Hip-Hop, and more. Turn tedious memorization into an experience you&apos;ll actually look forward to.
                </Text>
                <HStack mt={6} spacing={2}>
                  <CheckCircle size={18} color="#10b981" />
                  <Text fontSize="sm" color="green.300" fontWeight="600">Multiple genres available</Text>
                </HStack>
              </Box>
            </SimpleGrid>
          </VStack>

          {/* How It Works */}
          <VStack spacing={12} pt={16}>
            <VStack spacing={3} textAlign="center">
              <Badge colorScheme="orange" fontSize="sm" px={3} py={1} borderRadius="full">
                HOW IT WORKS
              </Badge>
              <Heading
                fontSize={{ base: "3xl", md: "5xl" }}
                fontWeight="900"
                color="white"
              >
                From Notes to Mnemonics in 3 Steps
              </Heading>
              <Text fontSize="lg" color="whiteAlpha.600" maxW="3xl">
                Your path to effortless memorization starts here
              </Text>
            </VStack>

            <SimpleGrid columns={{ base: 1, md: 3 }} spacing={8} w="100%">
              <Box
                bg="rgba(26, 26, 46, 0.6)"
                p={8}
                borderRadius="2xl"
                borderWidth={2}
                borderColor="rgba(217, 70, 239, 0.3)"
                position="relative"
                transition="all 0.3s"
                _hover={{
                  transform: "translateY(-4px)",
                  borderColor: "brand.500",
                  boxShadow: "0 20px 40px rgba(217, 70, 239, 0.3)"
                }}
              >
                <Box
                  position="absolute"
                  top={-6}
                  left={8}
                  w="48px"
                  h="48px"
                  bgGradient="linear(135deg, brand.500 0%, accent.500 100%)"
                  borderRadius="xl"
                  display="flex"
                  alignItems="center"
                  justifyContent="center"
                  fontWeight="900"
                  color="white"
                  fontSize="2xl"
                  boxShadow="0 10px 30px rgba(217, 70, 239, 0.5)"
                >
                  1
                </Box>
                <VStack align="start" spacing={4} pt={8}>
                  <Box
                    w="48px"
                    h="48px"
                    bg="rgba(217, 70, 239, 0.1)"
                    borderRadius="xl"
                    display="flex"
                    alignItems="center"
                    justifyContent="center"
                  >
                    <BookOpen size={24} color="rgba(217, 70, 239, 0.8)" />
                  </Box>
                  <Heading size="md" color="white">
                    Paste Your Notes
                  </Heading>
                  <Text color="whiteAlpha.700" fontSize="md" lineHeight="tall">
                    Simply copy-paste your study material. Use the format &quot;Term — Definition&quot; and our AI handles the rest.
                  </Text>
                </VStack>
              </Box>

              <Box
                bg="rgba(26, 26, 46, 0.6)"
                p={8}
                borderRadius="2xl"
                borderWidth={2}
                borderColor="rgba(217, 70, 239, 0.3)"
                position="relative"
                transition="all 0.3s"
                _hover={{
                  transform: "translateY(-4px)",
                  borderColor: "brand.500",
                  boxShadow: "0 20px 40px rgba(217, 70, 239, 0.3)"
                }}
              >
                <Box
                  position="absolute"
                  top={-6}
                  left={8}
                  w="48px"
                  h="48px"
                  bgGradient="linear(135deg, brand.500 0%, accent.500 100%)"
                  borderRadius="xl"
                  display="flex"
                  alignItems="center"
                  justifyContent="center"
                  fontWeight="900"
                  color="white"
                  fontSize="2xl"
                  boxShadow="0 10px 30px rgba(217, 70, 239, 0.5)"
                >
                  2
                </Box>
                <VStack align="start" spacing={4} pt={8}>
                  <Box
                    w="48px"
                    h="48px"
                    bg="rgba(217, 70, 239, 0.1)"
                    borderRadius="xl"
                    display="flex"
                    alignItems="center"
                    justifyContent="center"
                  >
                    <Music size={24} color="rgba(217, 70, 239, 0.8)" />
                  </Box>
                  <Heading size="md" color="white">
                    AI Creates Jingles
                  </Heading>
                  <Text color="whiteAlpha.700" fontSize="md" lineHeight="tall">
                    Our AI generates catchy, memorable jingles with full audio in your chosen genre. Pop, Hip-Hop, R&B, and more!
                  </Text>
                </VStack>
              </Box>

              <Box
                bg="rgba(26, 26, 46, 0.6)"
                p={8}
                borderRadius="2xl"
                borderWidth={2}
                borderColor="rgba(217, 70, 239, 0.3)"
                position="relative"
                transition="all 0.3s"
                _hover={{
                  transform: "translateY(-4px)",
                  borderColor: "brand.500",
                  boxShadow: "0 20px 40px rgba(217, 70, 239, 0.3)"
                }}
              >
                <Box
                  position="absolute"
                  top={-6}
                  left={8}
                  w="48px"
                  h="48px"
                  bgGradient="linear(135deg, brand.500 0%, accent.500 100%)"
                  borderRadius="xl"
                  display="flex"
                  alignItems="center"
                  justifyContent="center"
                  fontWeight="900"
                  color="white"
                  fontSize="2xl"
                  boxShadow="0 10px 30px rgba(217, 70, 239, 0.5)"
                >
                  3
                </Box>
                <VStack align="start" spacing={4} pt={8}>
                  <Box
                    w="48px"
                    h="48px"
                    bg="rgba(217, 70, 239, 0.1)"
                    borderRadius="xl"
                    display="flex"
                    alignItems="center"
                    justifyContent="center"
                  >
                    <TrendingUp size={24} color="rgba(217, 70, 239, 0.8)" />
                  </Box>
                  <Heading size="md" color="white">
                    Ace Your Exams
                  </Heading>
                  <Text color="whiteAlpha.700" fontSize="md" lineHeight="tall">
                    Study anywhere with your personalized playlist. Watch your retention skyrocket and grades improve effortlessly.
                  </Text>
                </VStack>
              </Box>
            </SimpleGrid>
          </VStack>

          {/* Pricing Section */}
          <VStack spacing={12} pt={16}>
            <VStack spacing={3} textAlign="center">
              <Badge colorScheme="green" fontSize="sm" px={3} py={1} borderRadius="full">
                PRICING
              </Badge>
              <Heading
                fontSize={{ base: "3xl", md: "5xl" }}
                fontWeight="900"
                color="white"
              >
                Choose Your Plan
              </Heading>
              <Text fontSize="lg" color="whiteAlpha.600" maxW="3xl">
                Start free, upgrade when you&apos;re ready
              </Text>
            </VStack>

            <SimpleGrid columns={{ base: 1, md: 3 }} spacing={8} w="100%" maxW="1200px">
              {/* Free Tier */}
              <Box
                bg="rgba(26, 26, 46, 0.6)"
                p={8}
                borderRadius="2xl"
                borderWidth={2}
                borderColor="rgba(217, 70, 239, 0.2)"
                transition="all 0.3s"
                _hover={{
                  transform: "translateY(-4px)",
                  borderColor: "rgba(217, 70, 239, 0.4)",
                  boxShadow: "0 20px 40px rgba(217, 70, 239, 0.2)"
                }}
              >
                <VStack align="stretch" spacing={6}>
                  <VStack align="start" spacing={2}>
                    <Text fontSize="xl" fontWeight="700" color="whiteAlpha.800">
                      Free
                    </Text>
                    <HStack align="baseline">
                      <Heading size="2xl" color="white" fontWeight="900">
                        $0
                      </Heading>
                      <Text color="whiteAlpha.600" fontSize="md">/month</Text>
                    </HStack>
                  </VStack>
                  <VStack align="start" spacing={3} flex="1">
                    <HStack>
                      <Box color="green.400">✓</Box>
                      <Text color="whiteAlpha.800" fontSize="sm">30 tokens (30 jingles)</Text>
                    </HStack>
                    <HStack>
                      <Box color="green.400">✓</Box>
                      <Text color="whiteAlpha.800" fontSize="sm">1 study set</Text>
                    </HStack>
                    <HStack>
                      <Box color="green.400">✓</Box>
                      <Text color="whiteAlpha.800" fontSize="sm">All genres</Text>
                    </HStack>
                    <HStack>
                      <Box color="red.400">✗</Box>
                      <Text color="whiteAlpha.600" fontSize="sm">Download MP3s</Text>
                    </HStack>
                  </VStack>
                </VStack>
              </Box>

              {/* Pro Tier */}
              <Box
                bg="rgba(26, 26, 46, 0.8)"
                p={8}
                borderRadius="2xl"
                borderWidth={3}
                borderColor="brand.500"
                position="relative"
                transition="all 0.3s"
                _hover={{
                  transform: "translateY(-4px)",
                  boxShadow: "0 20px 40px rgba(217, 70, 239, 0.4)"
                }}
              >
                <Badge
                  position="absolute"
                  top={-3}
                  right={6}
                  colorScheme="purple"
                  fontSize="xs"
                  px={3}
                  py={1}
                  borderRadius="full"
                >
                  POPULAR
                </Badge>
                <VStack align="stretch" spacing={6}>
                  <VStack align="start" spacing={2}>
                    <Text fontSize="xl" fontWeight="700" color="white">
                      Pro
                    </Text>
                    <HStack align="baseline">
                      <Heading size="2xl" color="white" fontWeight="900">
                        $10
                      </Heading>
                      <Text color="whiteAlpha.700" fontSize="md">/month</Text>
                    </HStack>
                  </VStack>
                  <VStack align="start" spacing={3} flex="1">
                    <HStack>
                      <Box color="green.400">✓</Box>
                      <Text color="white" fontSize="sm" fontWeight="600">300 tokens per month</Text>
                    </HStack>
                    <HStack>
                      <Box color="green.400">✓</Box>
                      <Text color="white" fontSize="sm" fontWeight="600">Unlimited study sets</Text>
                    </HStack>
                    <HStack>
                      <Box color="green.400">✓</Box>
                      <Text color="white" fontSize="sm" fontWeight="600">Download MP3s</Text>
                    </HStack>
                    <HStack>
                      <Box color="green.400">✓</Box>
                      <Text color="white" fontSize="sm" fontWeight="600">All genres</Text>
                    </HStack>
                    <HStack>
                      <Box color="green.400">✓</Box>
                      <Text color="white" fontSize="sm" fontWeight="600">Share jingles</Text>
                    </HStack>
                  </VStack>
                </VStack>
              </Box>

              {/* Premium Tier */}
              <Box
                bg="rgba(26, 26, 46, 0.6)"
                p={8}
                borderRadius="2xl"
                borderWidth={2}
                borderColor="rgba(251, 146, 60, 0.5)"
                transition="all 0.3s"
                _hover={{
                  transform: "translateY(-4px)",
                  borderColor: "accent.500",
                  boxShadow: "0 20px 40px rgba(251, 146, 60, 0.3)"
                }}
              >
                <VStack align="stretch" spacing={6}>
                  <VStack align="start" spacing={2}>
                    <HStack spacing={2}>
                      <Text fontSize="xl" fontWeight="700" color="whiteAlpha.800">
                        Premium
                      </Text>
                      <Sparkles size={18} color="#f97316" />
                    </HStack>
                    <HStack align="baseline">
                      <Heading size="2xl" color="white" fontWeight="900">
                        $14
                      </Heading>
                      <Text color="whiteAlpha.600" fontSize="md">/month</Text>
                    </HStack>
                  </VStack>
                  <VStack align="start" spacing={3} flex="1">
                    <HStack>
                      <Box color="green.400">✓</Box>
                      <Text color="whiteAlpha.800" fontSize="sm" fontWeight="600">Unlimited tokens</Text>
                    </HStack>
                    <HStack>
                      <Box color="green.400">✓</Box>
                      <Text color="whiteAlpha.800" fontSize="sm" fontWeight="600">Unlimited study sets</Text>
                    </HStack>
                    <HStack>
                      <Box color="green.400">✓</Box>
                      <Text color="whiteAlpha.800" fontSize="sm" fontWeight="600">Download MP3s</Text>
                    </HStack>
                    <HStack>
                      <Box color="green.400">✓</Box>
                      <Text color="whiteAlpha.800" fontSize="sm" fontWeight="600">All genres</Text>
                    </HStack>
                    <HStack>
                      <Box color="green.400">✓</Box>
                      <Text color="whiteAlpha.800" fontSize="sm" fontWeight="600">Priority generation</Text>
                    </HStack>
                    <HStack>
                      <Box color="green.400">✓</Box>
                      <Text color="whiteAlpha.800" fontSize="sm" fontWeight="600">Advanced analytics</Text>
                    </HStack>
                  </VStack>
                </VStack>
              </Box>
            </SimpleGrid>
          </VStack>

        </VStack>
      </Container>
    </Box>
  )
}
