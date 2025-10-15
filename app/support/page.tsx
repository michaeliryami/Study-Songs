'use client'

import { useState } from 'react'
import { Box, Button, Container, FormControl, FormLabel, Input, Textarea, VStack, useToast, Text } from '@chakra-ui/react'
import PageHeader from '../components/PageHeader'

export default function SupportPage() {
  const toast = useToast()
  const [email, setEmail] = useState('')
  const [subject, setSubject] = useState('')
  const [message, setMessage] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!email || !subject || !message) {
      toast({ title: 'Missing fields', description: 'Please fill out all fields', status: 'error', duration: 3000 })
      return
    }
    setSubmitting(true)
    try {
      const res = await fetch('/api/support', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, subject, message }),
      })
      const data = await res.json()
      if (!res.ok || !data.success) throw new Error(data.error || 'Failed to send')
      toast({ title: 'Message sent', description: 'We will get back to you shortly', status: 'success', duration: 4000 })
      setSubject('')
      setMessage('')
    } catch (err: any) {
      toast({ title: 'Failed to send', description: err.message || 'Please try again later', status: 'error', duration: 4000 })
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Box minH="100vh" bg="#0f0f1a" py={{ base: 6, md: 12 }}>
      <Container maxW="900px" px={{ base: 3, sm: 4, md: 8 }}>
        <VStack spacing={{ base: 6, md: 8 }} align="stretch">
          <PageHeader title="Support" subtitle="Send us a question and we'll get back within 24 hours" />
          <Box bg="rgba(26, 26, 46, 0.6)" borderWidth={2} borderColor="rgba(217, 70, 239, 0.3)" borderRadius="2xl" p={6}>
            <form onSubmit={handleSubmit}>
              <VStack spacing={4} align="stretch">
                <FormControl>
                  <FormLabel color="white">Your Email</FormLabel>
                  <Input value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" bg="rgba(42, 42, 64, 0.6)" borderColor="rgba(217, 70, 239, 0.2)" color="white" _hover={{ borderColor: 'brand.500' }} _focus={{ borderColor: 'brand.500', boxShadow: '0 0 0 1px #d946ef' }} h="48px" fontSize="16px" borderRadius="xl" />
                </FormControl>
                <FormControl>
                  <FormLabel color="white">Subject</FormLabel>
                  <Input value={subject} onChange={(e) => setSubject(e.target.value)} placeholder="What's this about?" bg="rgba(42, 42, 64, 0.6)" borderColor="rgba(217, 70, 239, 0.2)" color="white" _hover={{ borderColor: 'brand.500' }} _focus={{ borderColor: 'brand.500', boxShadow: '0 0 0 1px #d946ef' }} h="48px" fontSize="16px" borderRadius="xl" />
                </FormControl>
                <FormControl>
                  <FormLabel color="white">Message</FormLabel>
                  <Textarea value={message} onChange={(e) => setMessage(e.target.value)} placeholder="Describe your issue or question..." bg="rgba(42, 42, 64, 0.6)" borderColor="rgba(217, 70, 239, 0.2)" color="white" _hover={{ borderColor: 'brand.500' }} _focus={{ borderColor: 'brand.500', boxShadow: '0 0 0 1px #d946ef' }} minH="140px" fontSize="16px" borderRadius="xl" />
                </FormControl>
                <Button type="submit" isLoading={submitting} bgGradient="linear(135deg, brand.500 0%, accent.500 100%)" color="white" h="56px" fontWeight="700">Send</Button>
                <Text color="whiteAlpha.600" fontSize="sm">Or email us directly: noomiaihq@gmail.com</Text>
              </VStack>
            </form>
          </Box>
        </VStack>
      </Container>
    </Box>
  )
}


