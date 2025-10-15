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
import { useSubscription } from '../hooks/useSubscription'
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
  CreditCard,
  Settings as SettingsIcon,
  AlertCircle,
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
  const { tier, features, isPremium, isBasic, isFree, hasUnlimited } = useSubscription()
  const [managingSubscription, setManagingSubscription] = useState(false)
  const [syncing, setSyncing] = useState(false)

  // Auto-sync subscription after checkout success
  useEffect(() => {
    async function syncAfterCheckout() {
      if (!user?.email) return
      
      // Check if we just came from successful checkout
      const urlParams = new URLSearchParams(window.location.search)
      const success = urlParams.get('success')
      
      if (success === 'true' && !syncing) {
        console.log('🔄 Auto-syncing subscription after checkout...')
        
        // Clean up URL immediately to prevent re-triggering
        window.history.replaceState({}, '', '/profile')
        setSyncing(true)
        
        try {
          const response = await fetch('/api/sync-subscription', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email: user.email }),
          })
          
          const data = await response.json()
          
          if (data.success) {
            console.log('✅ Subscription synced successfully')
            // Reload profile data after a short delay
            setTimeout(() => {
              window.location.reload()
            }, 500)
          } else {
            console.error('❌ Sync failed:', data.error)
            setSyncing(false)
          }
        } catch (error) {
          console.error('Error syncing subscription:', error)
          setSyncing(false)
        }
      }
    }
    
    if (user && !authLoading) {
      syncAfterCheckout()
    }
  }, [user, authLoading, syncing])

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

  const handleManageSubscription = async () => {
    if (!user?.email) return
    
    setManagingSubscription(true)
    try {
      const response = await fetch('/api/create-portal-session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: user.email }),
      })

      const { url, error } = await response.json()
      if (error) throw new Error(error)
      
      if (url) {
        window.location.href = url
      }
    } catch (error) {
      console.error('Error opening portal:', error)
    } finally {
      setManagingSubscription(false)
    }
  }


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
                    <BookOpen size={24} color="#d946ef" />
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
            borderColor={isPremium ? 'brand.500' : 'rgba(217, 70, 239, 0.3)'}
            borderRadius="xl"
          >
            <CardBody p={6}>
              <VStack align="stretch" spacing={6}>
                <HStack justify="space-between">
                  <HStack spacing={3}>
                    {isPremium ? <Crown size={24} color="#d946ef" /> : <CreditCard size={24} color="#d946ef" />}
                    <VStack align="start" spacing={0}>
                      <Text fontSize="sm" color="whiteAlpha.600" fontWeight="600" textTransform="uppercase">
                        Current Plan
                      </Text>
                      <Heading size="lg" color="white" textTransform="capitalize">
                        {tier} Tier
                      </Heading>
                    </VStack>
                  </HStack>

                  {isFree && (
                    <Button
                      bgGradient="linear(135deg, brand.500 0%, accent.500 100%)"
                      color="white"
                      fontWeight="700"
                      leftIcon={<Sparkles size={18} />}
                      _hover={{
                        bgGradient: 'linear(135deg, brand.600 0%, accent.600 100%)',
                        transform: 'translateY(-2px)',
                      }}
                      onClick={() => router.push('/pricing')}
                    >
                      Upgrade
                    </Button>
                  )}

                  {!isFree && (
                    <Button
                      bg="rgba(217, 70, 239, 0.1)"
                      color="brand.300"
                      fontWeight="600"
                      borderWidth={1}
                      borderColor="brand.500"
                      leftIcon={<SettingsIcon size={18} />}
                      _hover={{
                        bg: 'rgba(217, 70, 239, 0.2)',
                      }}
                      onClick={handleManageSubscription}
                      isLoading={managingSubscription}
                    >
                      Manage Subscription
                    </Button>
                  )}
                </HStack>

                <Divider borderColor="rgba(217, 70, 239, 0.15)" />

                {/* Features List */}
                <VStack align="stretch" spacing={2}>
                  <Text color="whiteAlpha.700" fontSize="sm" fontWeight="600">
                    Your Features:
                  </Text>
                  <Text color="whiteAlpha.600" fontSize="sm">
                    ✓ {features.tokensPerMonth >= 999999 ? 'Unlimited' : features.tokensPerMonth} tokens per month
                  </Text>
                  <Text color="whiteAlpha.600" fontSize="sm">
                    {features.canDownload ? '✓' : '✗'} Download MP3s
                  </Text>
                  <Text color="whiteAlpha.600" fontSize="sm">
                    ✓ {features.maxSetsPerMonth >= 999 ? 'Unlimited' : features.maxSetsPerMonth} study sets
                  </Text>
                  <Text color="whiteAlpha.600" fontSize="sm">
                    ✓ Save and share jingles
                  </Text>
                  {isPremium && (
                    <>
                      <Text color="whiteAlpha.600" fontSize="sm">
                        ✓ Priority generation
                      </Text>
                      <Text color="whiteAlpha.600" fontSize="sm">
                        ✓ Advanced analytics
                      </Text>
                    </>
                  )}
                </VStack>

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
              leftIcon={<Sparkles size={20} />}
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
              leftIcon={<Music size={20} />}
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

          {/* Subscription Management */}
          {(isPremium || isBasic) && (
            <VStack spacing={3} align="stretch">
              <Text fontSize="sm" color="whiteAlpha.600" textAlign="center">
                Subscription Management
              </Text>
              <HStack spacing={3} justify="center">
                <Button
                  h={{ base: "40px", sm: "45px" }}
                  bg="rgba(59, 130, 246, 0.1)"
                  color="blue.300"
                  fontWeight="600"
                  fontSize={{ base: "sm", sm: "md" }}
                  leftIcon={<CreditCard size={16} />}
                  borderWidth={1}
                  borderColor="blue.500"
                  onClick={handleManageSubscription}
                  isLoading={managingSubscription}
                  loadingText="Opening..."
                  _hover={{
                    bg: 'rgba(59, 130, 246, 0.15)',
                    transform: 'translateY(-1px)',
                  }}
                  transition="all 0.2s"
                >
                  Manage Subscription
                </Button>
              </HStack>
            </VStack>
          )}
        </VStack>
      </Container>
    </Box>
  )
}

