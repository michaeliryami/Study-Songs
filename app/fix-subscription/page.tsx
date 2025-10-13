'use client'

import { useState } from 'react'
import { Box, Button, Container, Heading, Input, Text, VStack, Code, Alert, AlertIcon } from '@chakra-ui/react'

export default function FixSubscriptionPage() {
  const [customerId, setCustomerId] = useState('cus_TEKwi6ESt7DfTm')
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<any>(null)
  const [error, setError] = useState<string | null>(null)

  const fixSubscription = async () => {
    if (!customerId.trim()) {
      setError('Please enter a customer ID')
      return
    }

    setLoading(true)
    setError(null)
    setResult(null)

    try {
      const response = await fetch('/api/debug-stripe', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ customerId: customerId.trim() }),
      })

      const data = await response.json()

      if (data.success) {
        setResult(data)
      } else {
        setError(data.message || 'No active subscription found')
        setResult(data)
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Container maxW="container.md" py={20}>
      <VStack spacing={6} align="stretch">
        <Box textAlign="center">
          <Heading size="xl" mb={2}>🔧 Fix Missing Subscription</Heading>
          <Text color="whiteAlpha.700">
            Enter your Stripe Customer ID from the database screenshot
          </Text>
        </Box>

        <Input
          value={customerId}
          onChange={(e) => setCustomerId(e.target.value)}
          placeholder="cus_TEKwi6ESt7DfTm"
          size="lg"
          bg="rgba(26, 26, 46, 0.6)"
          borderColor="brand.500"
        />

        <Button
          onClick={fixSubscription}
          isLoading={loading}
          size="lg"
          bgGradient="linear(135deg, brand.600 0%, accent.600 100%)"
          _hover={{
            bgGradient: "linear(135deg, brand.500 0%, accent.500 100%)",
          }}
        >
          Fix Subscription Now
        </Button>

        {error && (
          <Alert status="error" borderRadius="md">
            <AlertIcon />
            {error}
          </Alert>
        )}

        {result?.success && (
          <Alert status="success" borderRadius="md">
            <AlertIcon />
            <Box>
              <Text fontWeight="bold">✅ Success! Your subscription has been fixed!</Text>
              <Text mt={2}><strong>Tier:</strong> {result.tier}</Text>
              <Text><strong>Subscription ID:</strong> {result.subscriptions[0]?.id}</Text>
              <Text mt={2}>
                Go to <a href="/profile" style={{ color: '#d946ef', textDecoration: 'underline' }}>your profile</a> and refresh the page!
              </Text>
            </Box>
          </Alert>
        )}

        {result && (
          <Box>
            <Text fontWeight="bold" mb={2}>Debug Info:</Text>
            <Code
              display="block"
              whiteSpace="pre"
              p={4}
              borderRadius="md"
              overflow="auto"
              maxH="400px"
              bg="rgba(26, 26, 46, 0.8)"
            >
              {JSON.stringify(result, null, 2)}
            </Code>
          </Box>
        )}

        <Box bg="rgba(251, 146, 60, 0.1)" p={4} borderRadius="md" borderWidth={1} borderColor="accent.500">
          <Heading size="sm" mb={2}>Why This Happened</Heading>
          <Text fontSize="sm" color="whiteAlpha.700">
            Webhooks can&apos;t reach localhost without Stripe CLI running. Your payment went through and the 
            subscription exists in Stripe, but the webhook couldn&apos;t update your database. This tool fetches 
            the subscription from Stripe and updates your profile.
          </Text>
        </Box>

        <Box bg="rgba(217, 70, 239, 0.1)" p={4} borderRadius="md" borderWidth={1} borderColor="brand.500">
          <Heading size="sm" mb={2}>For Next Time</Heading>
          <Text fontSize="sm" color="whiteAlpha.700" mb={2}>
            Always run Stripe CLI when testing locally:
          </Text>
          <Code fontSize="xs" p={2} borderRadius="md" display="block">
            stripe listen --forward-to http://localhost:3000/api/webhooks/stripe
          </Code>
        </Box>
      </VStack>
    </Container>
  )
}

