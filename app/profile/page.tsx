'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import {
  Box,
  Container,
  VStack,
  HStack,
  Heading,
  Text,
  Avatar,
  Badge,
  SimpleGrid,
  Stat,
  StatLabel,
  StatNumber,
  StatHelpText,
  Button,
  Divider,
  Card,
  CardBody,
  Progress,
  Icon,
} from '@chakra-ui/react'
import { useAuth } from '../contexts/AuthContext'
import { supabase } from '../lib/supabase'
import { 
  User, 
  BookOpen, 
  FileText, 
  TrendingUp, 
  Calendar,
  Crown,
  Sparkles,
  Music,
  Clock,
} from 'lucide-react'

interface ProfileStats {
  sets_count: number
  total_terms: number
  subscription_tier: string
  created_at: string
  full_name: string | null
}

export default function ProfilePage() {
  const router = useRouter()
  const { user, loading: authLoading } = useAuth()
  const [stats, setStats] = useState<ProfileStats | null>(null)
  const [loading, setLoading] = useState(true)

  // Redirect if not logged in
  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/auth')
    }
  }, [user, authLoading, router])

  // Load user profile stats
  useEffect(() => {
    async function loadProfile() {
      if (!supabase || !user) return

      try {
        const { data, error } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', user.id)
          .single()

        if (error) throw error
        setStats(data)
      } catch (error) {
        console.error('Error loading profile:', error)
      } finally {
        setLoading(false)
      }
    }

    if (user) {
      loadProfile()
    }
  }, [user])

  if (authLoading || loading) {
    return (
      <Box minH="100vh" bg="#0f0f1a" display="flex" alignItems="center" justifyContent="center">
        <Text color="white" fontSize="lg">Loading profile...</Text>
      </Box>
    )
  }

  if (!user || !stats) {
    return null
  }

  const tierColors = {
    free: { bg: 'gray', text: 'Free', icon: User },
    pro: { bg: 'purple', text: 'Pro', icon: Sparkles },
    premium: { bg: 'orange', text: 'Premium', icon: Crown },
  }

  const currentTier = tierColors[stats.subscription_tier as keyof typeof tierColors] || tierColors.free
  const joinedDate = new Date(stats.created_at).toLocaleDateString('en-US', { 
    month: 'long', 
    year: 'numeric' 
  })

  return (
    <Box minH="100vh" bg="#0f0f1a" py={{ base: 6, md: 12 }}>
      <Container maxW="1200px" px={{ base: 3, sm: 4, md: 8 }}>
        <VStack spacing={{ base: 6, md: 8 }} align="stretch">
          {/* Header Card */}
          <Card
            bg="rgba(26, 26, 46, 0.6)"
            borderWidth={2}
            borderColor="brand.500"
            borderRadius="2xl"
            overflow="hidden"
            position="relative"
          >
            {/* Background Gradient */}
            <Box
              position="absolute"
              top={0}
              left={0}
              right={0}
              h="120px"
              bgGradient="linear(135deg, brand.500 0%, accent.500 100%)"
              opacity={0.3}
            />

            <CardBody p={{ base: 4, sm: 6, md: 8 }} position="relative">
              <VStack spacing={{ base: 4, sm: 6 }} align="center">
                <Avatar
                  size={{ base: "xl", sm: "2xl" }}
                  name={stats.full_name || user.email}
                  bg="linear-gradient(135deg, #d946ef 0%, #f97316 100%)"
                  color="white"
                  fontWeight="900"
                  fontSize={{ base: "2xl", sm: "3xl" }}
                  border="4px solid"
                  borderColor="rgba(217, 70, 239, 0.3)"
                  boxShadow="0 10px 40px rgba(217, 70, 239, 0.4)"
                />

                <VStack spacing={2} textAlign="center">
                  <Heading
                    size={{ base: "lg", sm: "xl" }}
                    bgGradient="linear(135deg, brand.300 0%, accent.300 100%)"
                    bgClip="text"
                    fontWeight="900"
                    px={{ base: 2, sm: 0 }}
                  >
                    {stats.full_name || 'Student'}
                  </Heading>
                  <Text color="whiteAlpha.600" fontSize={{ base: "sm", sm: "md" }} px={{ base: 4, sm: 0 }}>
                    {user.email}
                  </Text>
                  <VStack spacing={2} pt={2}>
                    <Badge
                      colorScheme={currentTier.bg}
                      fontSize={{ base: "xs", sm: "sm" }}
                      px={{ base: 2, sm: 3 }}
                      py={1}
                      borderRadius="full"
                      textTransform="uppercase"
                      fontWeight="700"
                    >
                      <HStack spacing={1}>
                        <Icon as={currentTier.icon} boxSize={{ base: 2, sm: 3 }} />
                        <Text>{currentTier.text}</Text>
                      </HStack>
                    </Badge>
                    <Badge
                      colorScheme="blue"
                      fontSize="xs"
                      px={2}
                      py={1}
                      borderRadius="full"
                      textTransform="none"
                      fontWeight="600"
                    >
                      <HStack spacing={1}>
                        <Calendar size={12} />
                        <Text>Joined {joinedDate}</Text>
                      </HStack>
                    </Badge>
                  </VStack>
                </VStack>
              </VStack>
            </CardBody>
          </Card>

          {/* Stats Grid */}
          <SimpleGrid columns={{ base: 1, sm: 2, md: 3 }} spacing={{ base: 4, md: 6 }}>
            {/* Study Sets */}
            <Card
              bg="rgba(26, 26, 46, 0.6)"
              borderWidth={2}
              borderColor="rgba(217, 70, 239, 0.3)"
              borderRadius="xl"
              transition="all 0.3s"
              _hover={{
                transform: 'translateY(-4px)',
                borderColor: 'brand.500',
                boxShadow: '0 10px 30px rgba(217, 70, 239, 0.3)',
              }}
            >
              <CardBody p={{ base: 4, sm: 6 }}>
                <VStack align="start" spacing={{ base: 3, sm: 4 }}>
                  <Box
                    p={{ base: 2, sm: 3 }}
                    bg="rgba(217, 70, 239, 0.1)"
                    borderRadius="lg"
                  >
                    <BookOpen size={{ base: 20, sm: 24 }} color="#d946ef" />
                  </Box>
                  <VStack align="start" spacing={1}>
                    <Text fontSize={{ base: "xs", sm: "sm" }} color="whiteAlpha.600" fontWeight="600" textTransform="uppercase">
                      Study Sets
                    </Text>
                    <Heading size={{ base: "xl", sm: "2xl" }} color="white" fontWeight="900">
                      {stats.sets_count}
                    </Heading>
                    <Text fontSize={{ base: "xs", sm: "sm" }} color="whiteAlpha.500">
                      Total collections created
                    </Text>
                  </VStack>
                </VStack>
              </CardBody>
            </Card>

            {/* Total Terms */}
            <Card
              bg="rgba(26, 26, 46, 0.6)"
              borderWidth={2}
              borderColor="rgba(251, 146, 60, 0.3)"
              borderRadius="xl"
              transition="all 0.3s"
              _hover={{
                transform: 'translateY(-4px)',
                borderColor: 'accent.500',
                boxShadow: '0 10px 30px rgba(251, 146, 60, 0.3)',
              }}
            >
              <CardBody p={6}>
                <VStack align="start" spacing={4}>
                  <Box
                    p={3}
                    bg="rgba(251, 146, 60, 0.1)"
                    borderRadius="lg"
                  >
                    <FileText size={24} color="#f97316" />
                  </Box>
                  <VStack align="start" spacing={1}>
                    <Text fontSize="sm" color="whiteAlpha.600" fontWeight="600" textTransform="uppercase">
                      Total Terms
                    </Text>
                    <Heading size="2xl" color="white" fontWeight="900">
                      {stats.total_terms}
                    </Heading>
                    <Text fontSize="sm" color="whiteAlpha.500">
                      Mnemonics generated
                    </Text>
                  </VStack>
                </VStack>
              </CardBody>
            </Card>

            {/* Avg per Set */}
            <Card
              bg="rgba(26, 26, 46, 0.6)"
              borderWidth={2}
              borderColor="rgba(34, 197, 94, 0.3)"
              borderRadius="xl"
              transition="all 0.3s"
              _hover={{
                transform: 'translateY(-4px)',
                borderColor: 'green.500',
                boxShadow: '0 10px 30px rgba(34, 197, 94, 0.3)',
              }}
            >
              <CardBody p={6}>
                <VStack align="start" spacing={4}>
                  <Box
                    p={3}
                    bg="rgba(34, 197, 94, 0.1)"
                    borderRadius="lg"
                  >
                    <TrendingUp size={24} color="#22c55e" />
                  </Box>
                  <VStack align="start" spacing={1}>
                    <Text fontSize="sm" color="whiteAlpha.600" fontWeight="600" textTransform="uppercase">
                      Average per Set
                    </Text>
                    <Heading size="2xl" color="white" fontWeight="900">
                      {stats.sets_count > 0 ? Math.round(stats.total_terms / stats.sets_count) : 0}
                    </Heading>
                    <Text fontSize="sm" color="whiteAlpha.500">
                      Terms per collection
                    </Text>
                  </VStack>
                </VStack>
              </CardBody>
            </Card>
          </SimpleGrid>

          {/* Subscription Info */}
          <Card
            bg="rgba(26, 26, 46, 0.6)"
            borderWidth={2}
            borderColor="rgba(217, 70, 239, 0.3)"
            borderRadius="xl"
          >
            <CardBody p={6}>
              <VStack align="stretch" spacing={6}>
                <HStack justify="space-between">
                  <VStack align="start" spacing={1}>
                    <Text fontSize="sm" color="whiteAlpha.600" fontWeight="600" textTransform="uppercase">
                      Current Plan
                    </Text>
                    <Heading size="lg" color="white">
                      {currentTier.text} Tier
                    </Heading>
                  </VStack>
                  {stats.subscription_tier === 'free' && (
                    <Button
                      bgGradient="linear(135deg, brand.500 0%, accent.500 100%)"
                      color="white"
                      fontWeight="700"
                      _hover={{
                        bgGradient: 'linear(135deg, brand.600 0%, accent.600 100%)',
                      }}
                      onClick={() => router.push('/')}
                    >
                      Upgrade
                    </Button>
                  )}
                </HStack>

                <Divider borderColor="rgba(217, 70, 239, 0.15)" />

                {stats.subscription_tier === 'free' && (
                  <VStack align="stretch" spacing={3}>
                    <HStack justify="space-between">
                      <Text color="whiteAlpha.700" fontSize="sm">
                        Study Sets: <Text as="span" fontWeight="700">{stats.sets_count} / 1</Text>
                      </Text>
                      <Text color={stats.sets_count >= 1 ? 'red.400' : 'green.400'} fontSize="xs" fontWeight="600">
                        {stats.sets_count >= 1 ? 'Limit Reached' : 'Available'}
                      </Text>
                    </HStack>
                    <Progress
                      value={(stats.sets_count / 1) * 100}
                      size="sm"
                      colorScheme={stats.sets_count >= 1 ? 'red' : 'purple'}
                      borderRadius="full"
                      bg="rgba(42, 42, 64, 0.6)"
                    />
                    <Text color="whiteAlpha.500" fontSize="xs">
                      Upgrade to Pro for 10 sets or Premium for unlimited sets
                    </Text>
                  </VStack>
                )}

                {stats.subscription_tier === 'pro' && (
                  <VStack align="stretch" spacing={3}>
                    <Text color="whiteAlpha.700" fontSize="sm">
                      ✅ Up to 10 study sets
                    </Text>
                    <Text color="whiteAlpha.700" fontSize="sm">
                      ✅ Up to 15 terms per set
                    </Text>
                    <Text color="whiteAlpha.700" fontSize="sm">
                      ✅ Priority support
                    </Text>
                  </VStack>
                )}

                {stats.subscription_tier === 'premium' && (
                  <VStack align="stretch" spacing={3}>
                    <Text color="whiteAlpha.700" fontSize="sm">
                      ✨ Unlimited study sets
                    </Text>
                    <Text color="whiteAlpha.700" fontSize="sm">
                      ✨ Unlimited terms
                    </Text>
                    <Text color="whiteAlpha.700" fontSize="sm">
                      ✨ Premium support
                    </Text>
                    <Text color="whiteAlpha.700" fontSize="sm">
                      ✨ Early access to features
                    </Text>
                  </VStack>
                )}
              </VStack>
            </CardBody>
          </Card>

          {/* Quick Actions */}
          <SimpleGrid columns={{ base: 1, sm: 2 }} spacing={{ base: 3, sm: 4 }}>
            <Button
              h={{ base: "50px", sm: "60px" }}
              bgGradient="linear(135deg, brand.500 0%, accent.500 100%)"
              color="white"
              fontWeight="700"
              fontSize={{ base: "md", sm: "lg" }}
              leftIcon={<Sparkles size={{ base: 18, sm: 20 }} />}
              onClick={() => router.push('/create')}
              _hover={{
                bgGradient: 'linear(135deg, brand.600 0%, accent.600 100%)',
                transform: 'translateY(-2px)',
              }}
              transition="all 0.2s"
            >
              Create New Study Set
            </Button>
            <Button
              h={{ base: "50px", sm: "60px" }}
              bg="rgba(217, 70, 239, 0.1)"
              color="brand.300"
              fontWeight="700"
              fontSize={{ base: "md", sm: "lg" }}
              leftIcon={<Music size={{ base: 18, sm: 20 }} />}
              borderWidth={2}
              borderColor="brand.500"
              onClick={() => router.push('/my-sets')}
              _hover={{
                bg: 'rgba(217, 70, 239, 0.15)',
                transform: 'translateY(-2px)',
              }}
              transition="all 0.2s"
            >
              View My Sets
            </Button>
          </SimpleGrid>
        </VStack>
      </Container>
    </Box>
  )
}

