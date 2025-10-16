'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import {
  Box,
  Container,
  VStack,
  Heading,
  Text,
  Input,
  Button,
  useToast,
  Tabs,
  TabList,
  TabPanels,
  Tab,
  TabPanel,
  FormControl,
  FormLabel,
  Link,
  HStack,
  InputGroup,
  InputRightElement,
  IconButton,
} from '@chakra-ui/react'
import { Music, Mail, Lock, User, ArrowRight, Eye, EyeOff } from 'lucide-react'
import { supabase } from '../lib/supabase'

export default function AuthPage() {
  const router = useRouter()
  const toast = useToast()
  const [loading, setLoading] = useState(false)
  const [tabIndex, setTabIndex] = useState(0)

  // Sign up state
  const [signupEmail, setSignupEmail] = useState('')
  const [signupPassword, setSignupPassword] = useState('')
  const [signupConfirmPassword, setSignupConfirmPassword] = useState('')
  const [signupName, setSignupName] = useState('')

  // Sign in state
  const [signinEmail, setSigninEmail] = useState('')
  const [signinPassword, setSigninPassword] = useState('')

  // Forgot password state
  const [forgotEmail, setForgotEmail] = useState('')
  const [showForgotPassword, setShowForgotPassword] = useState(false)

  // Show password states
  const [showSigninPassword, setShowSigninPassword] = useState(false)
  const [showSignupPassword, setShowSignupPassword] = useState(false)
  const [showSignupConfirmPassword, setShowSignupConfirmPassword] = useState(false)

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault()
    
    // Validate password confirmation
    if (signupPassword !== signupConfirmPassword) {
      toast({
        title: 'Password mismatch',
        description: 'Passwords do not match',
        status: 'error',
        duration: 3000,
      })
      return
    }

    if (!supabase) {
      toast({
        title: 'Error',
        description: 'Authentication not configured',
        status: 'error',
        duration: 3000,
      })
      return
    }

    setLoading(true)
    try {
      const { data, error } = await supabase.auth.signUp({
        email: signupEmail,
        password: signupPassword,
        options: {
          data: {
            full_name: signupName,
          },
        },
      })

      if (error) throw error

      toast({
        title: 'Success!',
        description: 'Check your email to verify your account',
        status: 'success',
        duration: 5000,
      })
      
      // Clear form
      setSignupEmail('')
      setSignupPassword('')
      setSignupConfirmPassword('')
      setSignupName('')
    } catch (error: any) {
      toast({
        title: 'Sign up failed',
        description: error.message || 'An error occurred',
        status: 'error',
        duration: 5000,
      })
    } finally {
      setLoading(false)
    }
  }

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!supabase) {
      toast({
        title: 'Error',
        description: 'Authentication not configured',
        status: 'error',
        duration: 3000,
      })
      return
    }

    setLoading(true)
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: signinEmail,
        password: signinPassword,
      })

      if (error) throw error

      toast({
        title: 'Welcome back!',
        description: 'Redirecting to your study sets...',
        status: 'success',
        duration: 2000,
      })

      router.push('/my-sets')
    } catch (error: any) {
      toast({
        title: 'Sign in failed',
        description: error.message || 'Invalid email or password',
        status: 'error',
        duration: 5000,
      })
    } finally {
      setLoading(false)
    }
  }

  const handleGoogleSignIn = async () => {
    if (!supabase) {
      toast({
        title: 'Error',
        description: 'Authentication not configured',
        status: 'error',
        duration: 3000,
      })
      return
    }

    setLoading(true)
    try {
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/my-sets`
        }
      })

      if (error) throw error

      toast({
        title: 'Redirecting to Google...',
        description: 'Please complete sign-in with Google',
        status: 'info',
        duration: 3000,
      })
    } catch (error: any) {
      toast({
        title: 'Google sign-in failed',
        description: error.message || 'An error occurred',
        status: 'error',
        duration: 5000,
      })
      setLoading(false)
    }
  }

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!supabase) {
      toast({
        title: 'Error',
        description: 'Authentication not configured',
        status: 'error',
        duration: 3000,
      })
      return
    }

    setLoading(true)
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(forgotEmail, {
        redirectTo: `${window.location.origin}/auth/reset-password`,
      })

      if (error) throw error

      toast({
        title: 'Check your email',
        description: 'Password reset instructions have been sent',
        status: 'success',
        duration: 5000,
      })
      
      setShowForgotPassword(false)
      setForgotEmail('')
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'An error occurred',
        status: 'error',
        duration: 5000,
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <Box minH="100vh" bg="#0f0f1a" py={{ base: 6, md: 16 }}>
      <Container maxW="500px" px={{ base: 4, sm: 6 }}>
        <VStack spacing={{ base: 6, md: 8 }}>
          {/* Logo & Header */}
          <VStack spacing={4} textAlign="center">
            <Box
              w={{ base: "50px", sm: "60px" }}
              h={{ base: "50px", sm: "60px" }}
              bgGradient="linear(135deg, brand.500 0%, accent.500 100%)"
              borderRadius="xl"
              display="flex"
              alignItems="center"
              justifyContent="center"
              boxShadow="0 4px 20px rgba(217, 70, 239, 0.4)"
            >
              <Music size={32} color="#ffffff" strokeWidth={2.5} />
            </Box>
            <Heading
              size={{ base: "lg", sm: "xl" }}
              fontWeight="900"
              bgGradient="linear(135deg, brand.400 0%, accent.400 100%)"
              bgClip="text"
              px={{ base: 2, sm: 0 }}
            >
              Welcome to Noomo AI
            </Heading>
            <Text color="whiteAlpha.600" fontSize={{ base: "md", sm: "lg" }} px={{ base: 4, sm: 0 }}>
              Turn study notes into memorable jingles
            </Text>
          </VStack>

          {/* Auth Form */}
          <Box
            w="100%"
            bg="rgba(26, 26, 46, 0.8)"
            p={{ base: 6, sm: 8 }}
            borderRadius="2xl"
            borderWidth={2}
            borderColor="rgba(217, 70, 239, 0.3)"
            boxShadow="0 10px 40px rgba(0, 0, 0, 0.3)"
          >
            {!showForgotPassword ? (
              <Tabs index={tabIndex} onChange={setTabIndex} colorScheme="purple" variant="soft-rounded">
                <TabList mb={6}>
                  <Tab
                    flex={1}
                    color="whiteAlpha.600"
                    _selected={{
                      color: 'white',
                      bg: 'rgba(217, 70, 239, 0.2)',
                    }}
                    fontWeight="600"
                  >
                    Sign In
                  </Tab>
                  <Tab
                    flex={1}
                    color="whiteAlpha.600"
                    _selected={{
                      color: 'white',
                      bg: 'rgba(217, 70, 239, 0.2)',
                    }}
                    fontWeight="600"
                  >
                    Sign Up
                  </Tab>
                </TabList>

                <TabPanels>
                  {/* Sign In Panel */}
                  <TabPanel p={0}>
                    <form onSubmit={handleSignIn}>
                      <VStack spacing={4}>
                        <FormControl isRequired>
                          <FormLabel color="whiteAlpha.800" fontSize={{ base: "xs", sm: "sm" }} fontWeight="600">
                            Email
                          </FormLabel>
                          <Input
                            type="email"
                            placeholder="your@email.com"
                            value={signinEmail}
                            onChange={(e) => setSigninEmail(e.target.value)}
                            bg="rgba(42, 42, 64, 0.6)"
                            borderColor="rgba(217, 70, 239, 0.2)"
                            color="white"
                            _hover={{ borderColor: 'brand.500' }}
                            _focus={{ borderColor: 'brand.500', boxShadow: '0 0 0 1px #d946ef' }}
                            size={{ base: "md", sm: "lg" }}
                            h={{ base: "48px", sm: "56px" }}
                            fontSize="16px"
                          />
                        </FormControl>

                        <FormControl isRequired>
                          <FormLabel color="whiteAlpha.800" fontSize={{ base: "xs", sm: "sm" }} fontWeight="600">
                            Password
                          </FormLabel>
                          <InputGroup>
                            <Input
                              type={showSigninPassword ? "text" : "password"}
                              placeholder="••••••••"
                              value={signinPassword}
                              onChange={(e) => setSigninPassword(e.target.value)}
                              bg="rgba(42, 42, 64, 0.6)"
                              borderColor="rgba(217, 70, 239, 0.2)"
                              color="white"
                              _hover={{ borderColor: 'brand.500' }}
                              _focus={{ borderColor: 'brand.500', boxShadow: '0 0 0 1px #d946ef' }}
                              size={{ base: "md", sm: "lg" }}
                              h={{ base: "48px", sm: "56px" }}
                              fontSize="16px"
                            />
                            <InputRightElement h="full" pr={3}>
                              <IconButton
                                aria-label={showSigninPassword ? "Hide password" : "Show password"}
                                icon={showSigninPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                                variant="ghost"
                                color="whiteAlpha.600"
                                _hover={{ color: 'white', bg: 'transparent' }}
                                onClick={() => setShowSigninPassword(!showSigninPassword)}
                                size="sm"
                              />
                            </InputRightElement>
                          </InputGroup>
                        </FormControl>

                        <Button
                          type="submit"
                          w="100%"
                          size={{ base: "md", sm: "lg" }}
                          h={{ base: "48px", sm: "56px" }}
                          bgGradient="linear(135deg, brand.500 0%, accent.500 100%)"
                          color="white"
                          fontWeight="700"
                          rightIcon={<ArrowRight size={20} />}
                          isLoading={loading}
                            fontSize="16px"
                          _hover={{
                            bgGradient: 'linear(135deg, brand.600 0%, accent.600 100%)',
                          }}
                        >
                          Sign In
                        </Button>

                        <HStack w="100%" spacing={2}>
                          <Box flex="1" h="1px" bg="whiteAlpha.200" />
                          <Text color="whiteAlpha.500" fontSize="sm" px={2}>
                            or
                          </Text>
                          <Box flex="1" h="1px" bg="whiteAlpha.200" />
                        </HStack>

                        <Button
                          w="100%"
                          size={{ base: "md", sm: "lg" }}
                          h={{ base: "48px", sm: "56px" }}
                          bg="white"
                          color="gray.800"
                          fontWeight="600"
                          leftIcon={
                            <Box w="16px" h="16px" bg="url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjQiIGhlaWdodD0iMjQiIHZpZXdCb3g9IjAgMCAyNCAyNCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHBhdGggZD0iTTIyLjU2IDEyLjI1QzIyLjU2IDExLjQ3IDIyLjQ5IDEwLjggMjIuMzYgMTAuMTJIMTIuNVYxNC4yNUgxOC4xNEMxNy45MyAxNS42MiAxNy4wOCAxNi43NSAxNS42NyAxNy40MlYxOS44NEgxOS4zOEMyMS4xMyAxOC4xMSAyMi41NiAxNS41OCAyMi41NiAxMi4yNVoiIGZpbGw9IiM0Mjg1RjQiLz4KPHBhdGggZD0iTTEyLjUgMjNDMTUuNTMgMjMgMTguMTMgMjEuNjYgMTkuODggMTkuODRMMTUuNjcgMTcuNDJDMTQuNzMgMTguMDcgMTMuNDcgMTguNSAxMi41IDE4LjVDOS41NiAxOC41IDcuMDMgMTYuNDcgNi4xIDEzLjYyTDEuODIgMTUuOTNDMy41NSAxOS4zNSA3LjE4IDIyIDEyLjUgMjJaIiBmaWxsPSIjMzRBODUzIi8+CjxwYXRoIGQ9Ik02LjEgMTMuNjJDNS44MyAxMi44NyA1LjY3IDEyLjE0IDUuNjcgMTEuM0M1LjY3IDEwLjQ2IDUuODMgOS43MyA2LjA5IDguOThMMS44MiA2LjYxQzAuNzMgOC40NiAwIDEwLjU4IDAgMTIuOTlDMCAxNS40MSAwLjczIDE3LjUzIDEuODIgMTkuMzlMNi4xIDEzLjYyWiIgZmlsbD0iI0ZCQkMwNSIvPgo8cGF0aCBkPSJNMTIuNSA0LjU4QzE0LjI0IDQuNTggMTUuNzggNS4yIDE2Ljk2IDYuMThMMTkuOTMgMy4yMUMxOC4xMyAxLjQ1IDE1LjUzIDAgMTIuNSAwQzcuMTggMCAzLjU1IDIuNjUgMS44MiA2LjYxTDYuMDkgOC45OEM3LjAzIDYuMTMgOS41NiA0LjU4IDEyLjUgNC41OFoiIGZpbGw9IiNFQjQzMzUiLz4KPC9zdmc+')" bgSize="contain" bgRepeat="no-repeat" />
                          }
                          onClick={handleGoogleSignIn}
                          isLoading={loading}
                          _hover={{
                            bg: 'gray.50',
                            transform: 'translateY(-1px)',
                          }}
                          _active={{
                            bg: 'gray.100',
                          }}
                        >
                          Continue with Google
                        </Button>

                        <Link
                          color="brand.300"
                          fontSize={{ base: "xs", sm: "sm" }}
                          onClick={() => setShowForgotPassword(true)}
                          cursor="pointer"
                          _hover={{ color: 'brand.400' }}
                        >
                          Forgot password?
                        </Link>
                      </VStack>
                    </form>
                  </TabPanel>

                  {/* Sign Up Panel */}
                  <TabPanel p={0}>
                    <form onSubmit={handleSignUp}>
                      <VStack spacing={4}>
                        <FormControl isRequired>
                          <FormLabel color="whiteAlpha.800" fontSize="sm" fontWeight="600">
                            Full Name
                          </FormLabel>
                          <Input
                            type="text"
                            placeholder="John Doe"
                            value={signupName}
                            onChange={(e) => setSignupName(e.target.value)}
                            bg="rgba(42, 42, 64, 0.6)"
                            borderColor="rgba(217, 70, 239, 0.2)"
                            color="white"
                            _hover={{ borderColor: 'brand.500' }}
                            _focus={{ borderColor: 'brand.500', boxShadow: '0 0 0 1px #d946ef' }}
                            size="lg"
                          />
                        </FormControl>

                        <FormControl isRequired>
                          <FormLabel color="whiteAlpha.800" fontSize="sm" fontWeight="600">
                            Email
                          </FormLabel>
                          <Input
                            type="email"
                            placeholder="your@email.com"
                            value={signupEmail}
                            onChange={(e) => setSignupEmail(e.target.value)}
                            bg="rgba(42, 42, 64, 0.6)"
                            borderColor="rgba(217, 70, 239, 0.2)"
                            color="white"
                            _hover={{ borderColor: 'brand.500' }}
                            _focus={{ borderColor: 'brand.500', boxShadow: '0 0 0 1px #d946ef' }}
                            size="lg"
                          />
                        </FormControl>

                        <FormControl isRequired>
                          <FormLabel color="whiteAlpha.800" fontSize="sm" fontWeight="600">
                            Password
                          </FormLabel>
                          <InputGroup>
                            <Input
                              type={showSignupPassword ? "text" : "password"}
                              placeholder="••••••••"
                              value={signupPassword}
                              onChange={(e) => setSignupPassword(e.target.value)}
                              bg="rgba(42, 42, 64, 0.6)"
                              borderColor="rgba(217, 70, 239, 0.2)"
                              color="white"
                              _hover={{ borderColor: 'brand.500' }}
                              _focus={{ borderColor: 'brand.500', boxShadow: '0 0 0 1px #d946ef' }}
                              size="lg"
                            />
                            <InputRightElement h="full" pr={3}>
                              <IconButton
                                aria-label={showSignupPassword ? "Hide password" : "Show password"}
                                icon={showSignupPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                                variant="ghost"
                                color="whiteAlpha.600"
                                _hover={{ color: 'white', bg: 'transparent' }}
                                onClick={() => setShowSignupPassword(!showSignupPassword)}
                                size="sm"
                              />
                            </InputRightElement>
                          </InputGroup>
                        </FormControl>

                        <FormControl isRequired>
                          <FormLabel color="whiteAlpha.800" fontSize="sm" fontWeight="600">
                            Confirm Password
                          </FormLabel>
                          <InputGroup>
                            <Input
                              type={showSignupConfirmPassword ? "text" : "password"}
                              placeholder="••••••••"
                              value={signupConfirmPassword}
                              onChange={(e) => setSignupConfirmPassword(e.target.value)}
                              bg="rgba(42, 42, 64, 0.6)"
                              borderColor="rgba(217, 70, 239, 0.2)"
                              color="white"
                              _hover={{ borderColor: 'brand.500' }}
                              _focus={{ borderColor: 'brand.500', boxShadow: '0 0 0 1px #d946ef' }}
                              size="lg"
                            />
                            <InputRightElement h="full" pr={3}>
                              <IconButton
                                aria-label={showSignupConfirmPassword ? "Hide password" : "Show password"}
                                icon={showSignupConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                                variant="ghost"
                                color="whiteAlpha.600"
                                _hover={{ color: 'white', bg: 'transparent' }}
                                onClick={() => setShowSignupConfirmPassword(!showSignupConfirmPassword)}
                                size="sm"
                              />
                            </InputRightElement>
                          </InputGroup>
                        </FormControl>

                        <Button
                          type="submit"
                          w="100%"
                          size="lg"
                          bgGradient="linear(135deg, brand.500 0%, accent.500 100%)"
                          color="white"
                          fontWeight="700"
                          rightIcon={<ArrowRight size={20} />}
                          isLoading={loading}
                          _hover={{
                            bgGradient: 'linear(135deg, brand.600 0%, accent.600 100%)',
                          }}
                        >
                          Create Account
                        </Button>

                        <HStack w="100%" spacing={2}>
                          <Box flex="1" h="1px" bg="whiteAlpha.200" />
                          <Text color="whiteAlpha.500" fontSize="sm" px={2}>
                            or
                          </Text>
                          <Box flex="1" h="1px" bg="whiteAlpha.200" />
                        </HStack>

                        <Button
                          w="100%"
                          size="lg"
                          bg="white"
                          color="gray.800"
                          fontWeight="600"
                          leftIcon={
                            <Box w="16px" h="16px" bg="url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjQiIGhlaWdodD0iMjQiIHZpZXdCb3g9IjAgMCAyNCAyNCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHBhdGggZD0iTTIyLjU2IDEyLjI1QzIyLjU2IDExLjQ3IDIyLjQ5IDEwLjggMjIuMzYgMTAuMTJIMTIuNVYxNC4yNUgxOC4xNEMxNy45MyAxNS42MiAxNy4wOCAxNi43NSAxNS42NyAxNy40MlYxOS44NEgxOS4zOEMyMS4xMyAxOC4xMSAyMi41NiAxNS41OCAyMi41NiAxMi4yNVoiIGZpbGw9IiM0Mjg1RjQiLz4KPHBhdGggZD0iTTEyLjUgMjNDMTUuNTMgMjMgMTguMTMgMjEuNjYgMTkuODggMTkuODRMMTUuNjcgMTcuNDJDMTQuNzMgMTguMDcgMTMuNDcgMTguNSAxMi41IDE4LjVDOS41NiAxOC41IDcuMDMgMTYuNDcgNi4xIDEzLjYyTDEuODIgMTUuOTNDMy41NSAxOS4zNSA3LjE4IDIyIDEyLjUgMjJaIiBmaWxsPSIjMzRBODUzIi8+CjxwYXRoIGQ9Ik02LjEgMTMuNjJDNS44MyAxMi44NyA1LjY3IDEyLjE0IDUuNjcgMTEuM0M1LjY3IDEwLjQ2IDUuODMgOS43MyA2LjA5IDguOThMMS44MiA2LjYxQzAuNzMgOC40NiAwIDEwLjU4IDAgMTIuOTlDMCAxNS40MSAwLjczIDE3LjUzIDEuODIgMTkuMzlMNi4xIDEzLjYyWiIgZmlsbD0iI0ZCQkMwNSIvPgo8cGF0aCBkPSJNMTIuNSA0LjU4QzE0LjI0IDQuNTggMTUuNzggNS4yIDE2Ljk2IDYuMThMMTkuOTMgMy4yMUMxOC4xMyAxLjQ1IDE1LjUzIDAgMTIuNSAwQzcuMTggMCAzLjU1IDIuNjUgMS44MiA2LjYxTDYuMDkgOC45OEM3LjAzIDYuMTMgOS41NiA0LjU4IDEyLjUgNC41OFoiIGZpbGw9IiNFQjQzMzUiLz4KPC9zdmc+')" bgSize="contain" bgRepeat="no-repeat" />
                          }
                          onClick={handleGoogleSignIn}
                          isLoading={loading}
                          _hover={{
                            bg: 'gray.50',
                            transform: 'translateY(-1px)',
                          }}
                          _active={{
                            bg: 'gray.100',
                          }}
                        >
                          Continue with Google
                        </Button>

                        <Text color="whiteAlpha.600" fontSize="xs" textAlign="center">
                          By signing up, you agree to our Terms of Service
                        </Text>
                      </VStack>
                    </form>
                  </TabPanel>
                </TabPanels>
              </Tabs>
            ) : (
              <VStack spacing={6}>
                <VStack spacing={2} textAlign="center">
                  <Heading size="md" color="white">
                    Reset Password
                  </Heading>
                  <Text color="whiteAlpha.600" fontSize="sm">
                    Enter your email to receive reset instructions
                  </Text>
                </VStack>

                <form onSubmit={handleForgotPassword} style={{ width: '100%' }}>
                  <VStack spacing={4}>
                    <FormControl isRequired>
                      <FormLabel color="whiteAlpha.800" fontSize="sm" fontWeight="600">
                        Email
                      </FormLabel>
                      <Input
                        type="email"
                        placeholder="your@email.com"
                        value={forgotEmail}
                        onChange={(e) => setForgotEmail(e.target.value)}
                        bg="rgba(42, 42, 64, 0.6)"
                        borderColor="rgba(217, 70, 239, 0.2)"
                        color="white"
                        _hover={{ borderColor: 'brand.500' }}
                        _focus={{ borderColor: 'brand.500', boxShadow: '0 0 0 1px #d946ef' }}
                        size="lg"
                      />
                    </FormControl>

                    <Button
                      type="submit"
                      w="100%"
                      size="lg"
                      bgGradient="linear(135deg, brand.500 0%, accent.500 100%)"
                      color="white"
                      fontWeight="700"
                      isLoading={loading}
                      _hover={{
                        bgGradient: 'linear(135deg, brand.600 0%, accent.600 100%)',
                      }}
                    >
                      Send Reset Link
                    </Button>

                    <Link
                      color="brand.300"
                      fontSize="sm"
                      onClick={() => setShowForgotPassword(false)}
                      cursor="pointer"
                      _hover={{ color: 'brand.400' }}
                    >
                      Back to sign in
                    </Link>
                  </VStack>
                </form>
              </VStack>
            )}
          </Box>
        </VStack>
      </Container>
    </Box>
  )
}

