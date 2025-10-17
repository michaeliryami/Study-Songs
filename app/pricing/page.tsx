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
  List,
  ListItem,
  ListIcon,
  Switch,
  useToast,
  Badge,
} from '@chakra-ui/react'
import { CheckCircle, Sparkles } from 'lucide-react'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '../contexts/AuthContext'
import { useSubscription } from '../hooks/useSubscription'
import PageHeader from '../components/PageHeader'

export default function PricingPage() {
  const [isYearly, setIsYearly] = useState(false)
  const [loading, setLoading] = useState<string | null>(null)
  const { user } = useAuth()
  const { tier, loading: subscriptionLoading } = useSubscription()
  const router = useRouter()
  const toast = useToast()

  const handleSubscribe = async (priceId: string, planName: string) => {
    if (!user) {
      router.push('/auth')
      return
    }

    setLoading(planName)

    try {
      const response = await fetch('/api/create-checkout-session', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          priceId,
          userId: user.id,
          email: user.email,
        }),
      })

      const { url, error } = await response.json()

      if (error) throw new Error(error)

      if (url) {
        window.location.href = url
      }
    } catch (error) {
      console.error('Error:', error)
      toast({
        title: 'Error',
        description: 'Failed to start checkout',
        status: 'error',
        duration: 5000,
      })
    } finally {
      setLoading(null)
    }
  }

  const handleManageSubscription = async () => {
    if (!user) {
      router.push('/auth')
      return
    }

    setLoading('manage')

    try {
      const response = await fetch('/api/create-portal-session', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: user.email,
        }),
      })

      const { url, error } = await response.json()

      if (error) throw new Error(error)

      if (url) {
        window.location.href = url
      }
    } catch (error) {
      console.error('Error:', error)
      toast({
        title: 'Error',
        description: 'Failed to open subscription portal',
        status: 'error',
        duration: 5000,
      })
    } finally {
      setLoading(null)
    }
  }

  const plans = [
    {
      name: 'Basic',
      tier: 'basic',
      monthlyPrice: '$10',
      yearlyPrice: '$96',
      monthlyPriceId: process.env.NEXT_PUBLIC_STRIPE_BASIC_MONTHLY_PRICE_ID!,
      yearlyPriceId: process.env.NEXT_PUBLIC_STRIPE_BASIC_YEARLY_PRICE_ID!,
      description: 'Perfect for students getting started',
      features: [
        '100 tokens per month',
        'Unlimited study sets',
        'Download MP3s',
        'Pre-set music genres',
      ],
      popular: true,
    },
    {
      name: 'Premium',
      tier: 'premium',
      monthlyPrice: '$14',
      yearlyPrice: '$134.40',
      monthlyPriceId: process.env.NEXT_PUBLIC_STRIPE_PREMIUM_MONTHLY_PRICE_ID!,
      yearlyPriceId: process.env.NEXT_PUBLIC_STRIPE_PREMIUM_YEARLY_PRICE_ID!,
      description: 'For power learners',
      features: [
        'Unlimited tokens',
        'Unlimited study sets',
        'Download MP3s',
        'All music genres + Custom genres',
        '🎨 Custom AI prompts for personalized jingles',
        'Priority generation',
        'Audio stitching',
      ],
    },
  ]

  return (
    <Box minH="100vh" bg="#0f0f1a" py={{ base: 6, md: 12 }}>
      <Container maxW="container.xl">
        <VStack spacing={{ base: 6, md: 8 }} align="center">
          <PageHeader
            title="Choose Your Plan"
            subtitle="Turn your study notes into unforgettable jingles"
          />

          <HStack
            spacing={4}
            bg="rgba(26, 26, 46, 0.6)"
            p={2}
            borderRadius="xl"
            border="1px solid"
            borderColor="rgba(217, 70, 239, 0.2)"
          >
            <Text fontSize="md" fontWeight="600" color={!isYearly ? 'white' : 'whiteAlpha.600'}>
              Monthly
            </Text>
            <Switch
              size="lg"
              colorScheme="purple"
              isChecked={isYearly}
              onChange={e => setIsYearly(e.target.checked)}
            />
            <HStack spacing={2}>
              <Text fontSize="md" fontWeight="600" color={isYearly ? 'white' : 'whiteAlpha.600'}>
                Yearly
              </Text>
              <Badge
                bgGradient="linear(135deg, brand.500 0%, accent.500 100%)"
                color="white"
                px={2}
                py={1}
                borderRadius="md"
                fontSize="xs"
                fontWeight="700"
              >
                Save 20%
              </Badge>
            </HStack>
          </HStack>

          <SimpleGrid columns={{ base: 1, md: 2 }} spacing={8} w="full" maxW="5xl">
            {plans.map(plan => {
              const isCurrentPlan = tier === plan.tier
              return (
                <Box
                  key={plan.name}
                  bg={isCurrentPlan ? 'rgba(217, 70, 239, 0.1)' : 'rgba(26, 26, 46, 0.6)'}
                  borderRadius="2xl"
                  p={8}
                  border="2px solid"
                  borderColor={
                    isCurrentPlan
                      ? 'brand.500'
                      : plan.popular
                        ? 'brand.500'
                        : 'rgba(217, 70, 239, 0.1)'
                  }
                  position="relative"
                  transition="all 0.3s"
                  _hover={{
                    transform: 'translateY(-8px)',
                    boxShadow: '0 20px 60px rgba(217, 70, 239, 0.3)',
                  }}
                >
                  {plan.popular && (
                    <Box
                      position="absolute"
                      top="-12px"
                      left="50%"
                      transform="translateX(-50%)"
                      bgGradient="linear(135deg, brand.500 0%, accent.500 100%)"
                      color="white"
                      px={4}
                      py={1}
                      borderRadius="full"
                      fontSize="sm"
                      fontWeight="700"
                    >
                      ⭐ Most Popular
                    </Box>
                  )}
                  {isCurrentPlan && (
                    <Box
                      position="absolute"
                      top="-12px"
                      right="12px"
                      bg="green.500"
                      color="white"
                      px={3}
                      py={1}
                      borderRadius="full"
                      fontSize="xs"
                      fontWeight="700"
                    >
                      ✓ Current Plan
                    </Box>
                  )}

                  <VStack align="stretch" spacing={6} h="full">
                    <VStack align="start" spacing={2}>
                      <Heading size="xl" color="white">
                        {plan.name}
                      </Heading>
                      <Text color="whiteAlpha.600" fontSize="md">
                        {plan.description}
                      </Text>
                    </VStack>

                    <HStack align="baseline" spacing={1}>
                      <Heading
                        size="3xl"
                        bgGradient="linear(135deg, brand.300 0%, accent.300 100%)"
                        bgClip="text"
                      >
                        {isYearly ? plan.yearlyPrice : plan.monthlyPrice}
                      </Heading>
                      <Text color="whiteAlpha.500" fontSize="lg">
                        /{isYearly ? 'year' : 'month'}
                      </Text>
                    </HStack>

                    {isYearly && (
                      <Text fontSize="sm" color="green.300" fontWeight="600">
                        💰 Save ${plan.tier === 'basic' ? '24' : '33.60'} per year
                      </Text>
                    )}

                    <List spacing={3} w="full" flex="1">
                      {plan.features.map(feature => (
                        <ListItem key={feature} color="whiteAlpha.800">
                          <HStack>
                            <ListIcon as={CheckCircle} color="green.400" fontSize="20px" />
                            <Text fontSize="md">{feature}</Text>
                          </HStack>
                        </ListItem>
                      ))}
                    </List>

                    <Button
                      w="full"
                      size="lg"
                      h="60px"
                      bgGradient={
                        plan.popular ? 'linear(135deg, brand.500 0%, accent.500 100%)' : 'none'
                      }
                      bg={plan.popular ? undefined : 'rgba(217, 70, 239, 0.1)'}
                      color="white"
                      fontSize="lg"
                      fontWeight="700"
                      borderWidth={plan.popular ? 0 : 2}
                      borderColor="brand.500"
                      leftIcon={<Sparkles size={20} />}
                      onClick={() => {
                        if (tier === plan.tier) {
                          // Same tier - go to portal to manage
                          handleManageSubscription()
                        } else if (tier === 'free') {
                          // Free user - subscribe to this plan
                          handleSubscribe(
                            isYearly ? plan.yearlyPriceId : plan.monthlyPriceId,
                            plan.name
                          )
                        } else {
                          // Different tier - go to portal to upgrade/downgrade
                          handleManageSubscription()
                        }
                      }}
                      isLoading={loading === plan.name || loading === 'manage'}
                      _hover={{
                        transform: 'translateY(-2px)',
                        boxShadow: '0 10px 30px rgba(217, 70, 239, 0.4)',
                      }}
                    >
                      {tier === plan.tier
                        ? 'Manage Plan'
                        : tier === 'free'
                          ? 'Get Started'
                          : 'Update Plan'}
                    </Button>
                  </VStack>
                </Box>
              )
            })}
          </SimpleGrid>
        </VStack>
      </Container>
    </Box>
  )
}
