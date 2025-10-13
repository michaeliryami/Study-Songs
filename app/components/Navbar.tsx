'use client'

import { Box, Container, Flex, Heading, HStack, Button, Text, Menu, MenuButton, MenuList, MenuItem, Avatar, Badge } from '@chakra-ui/react'
import { Music, Library, Sparkles, LogOut, User as UserIcon, BarChart3, DollarSign, Coins } from 'lucide-react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { useAuth } from '../contexts/AuthContext'
import { useSubscription } from '../hooks/useSubscription'

export default function Navbar() {
  const pathname = usePathname()
  const router = useRouter()
  const { user, signOut } = useAuth()
  const { currentTokens, tier, loading: subscriptionLoading } = useSubscription()
  const isCreatePage = pathname === '/create'
  const isMySetsPage = pathname === '/my-sets'
  const isProfilePage = pathname === '/profile'

  const handleSignOut = async () => {
    await signOut()
    router.push('/')
  }

  return (
    <Box 
      bg="rgba(15, 15, 26, 0.95)" 
      backdropFilter="blur(20px)"
      borderBottom="1px solid" 
      borderColor="rgba(217, 70, 239, 0.15)" 
      py={4}
      position="sticky"
      top={0}
      zIndex={1000}
      boxShadow="0 4px 20px rgba(0, 0, 0, 0.3)"
    >
      <Container maxW="container.xl" px={{ base: 3, sm: 4, md: 8 }}>
        <Flex justify="space-between" align="center">
          <Link href="/">
            <Flex 
              align="center" 
              gap={{ base: 2, sm: 3 }} 
              cursor="pointer"
              transition="all 0.2s"
              _hover={{ transform: 'translateY(-1px)' }}
            >
              <Box
                w={{ base: "36px", sm: "44px" }}
                h={{ base: "36px", sm: "44px" }}
                bgGradient="linear(135deg, brand.500 0%, accent.500 100%)"
                borderRadius="xl"
                display="flex"
                alignItems="center"
                justifyContent="center"
                boxShadow="0 8px 25px rgba(217, 70, 239, 0.4)"
                position="relative"
                _before={{
                  content: '""',
                  position: 'absolute',
                  inset: '-2px',
                  bgGradient: 'linear(135deg, brand.400 0%, accent.400 100%)',
                  borderRadius: 'xl',
                  opacity: 0.3,
                  filter: 'blur(8px)',
                  zIndex: -1,
                }}
              >
                <Music size={24} color="#ffffff" strokeWidth={2.5} />
              </Box>
              <Box display={{ base: 'none', sm: 'block' }}>
                <Heading 
                  size={{ base: "md", sm: "lg" }} 
                  fontWeight="900" 
                  bgGradient="linear(135deg, brand.300 0%, accent.300 100%)" 
                  bgClip="text"
                  letterSpacing="tight"
                >
                  Noomo AI
                </Heading>
                <Text fontSize="2xs" color="whiteAlpha.500" fontWeight="600" textTransform="uppercase" letterSpacing="wider">
                  AI Mnemonics
                </Text>
              </Box>
            </Flex>
          </Link>

          <HStack spacing={{ base: 1, sm: 2, md: 3 }}>
            {user ? (
              <>
                {/* Mobile Navigation - Show on small screens */}
                <HStack spacing={1} display={{ base: 'flex', md: 'none' }}>
                  <Link href="/create">
                    <Button
                      size="sm"
                      fontWeight="600"
                      leftIcon={<Sparkles size={16} />}
                      bg={isCreatePage ? 'rgba(217, 70, 239, 0.15)' : 'transparent'}
                      color={isCreatePage ? 'brand.300' : 'whiteAlpha.700'}
                      borderWidth={isCreatePage ? '1px' : '0'}
                      borderColor={isCreatePage ? 'brand.500' : 'transparent'}
                      _hover={{
                        bg: 'rgba(217, 70, 239, 0.1)',
                        color: 'white',
                        transform: 'translateY(-1px)',
                      }}
                      transition="all 0.2s"
                    >
                      Create
                    </Button>
                  </Link>
                  <Link href="/my-sets">
                    <Button
                      size="sm"
                      fontWeight="600"
                      leftIcon={<Library size={16} />}
                      bg={isMySetsPage ? 'rgba(217, 70, 239, 0.15)' : 'transparent'}
                      color={isMySetsPage ? 'brand.300' : 'whiteAlpha.700'}
                      borderWidth={isMySetsPage ? '1px' : '0'}
                      borderColor={isMySetsPage ? 'brand.500' : 'transparent'}
                      _hover={{
                        bg: 'rgba(217, 70, 239, 0.1)',
                        color: 'white',
                        transform: 'translateY(-1px)',
                      }}
                      transition="all 0.2s"
                    >
                      My Sets
                    </Button>
                  </Link>
                </HStack>

                {/* Desktop Navigation - Show on medium+ screens */}
                <HStack spacing={{ base: 1, md: 2 }} display={{ base: 'none', md: 'flex' }}>
                  <Link href="/create">
                    <Button
                      size="md"
                      fontWeight="600"
                      leftIcon={<Sparkles size={18} />}
                      bg={isCreatePage ? 'rgba(217, 70, 239, 0.15)' : 'transparent'}
                      color={isCreatePage ? 'brand.300' : 'whiteAlpha.700'}
                      borderWidth={isCreatePage ? '1px' : '0'}
                      borderColor={isCreatePage ? 'brand.500' : 'transparent'}
                      _hover={{
                        bg: 'rgba(217, 70, 239, 0.1)',
                        color: 'white',
                        transform: 'translateY(-1px)',
                      }}
                      transition="all 0.2s"
                    >
                      Create
                    </Button>
                  </Link>
                  <Link href="/my-sets">
                    <Button
                      size="md"
                      fontWeight="600"
                      leftIcon={<Library size={18} />}
                      bg={isMySetsPage ? 'rgba(217, 70, 239, 0.15)' : 'transparent'}
                      color={isMySetsPage ? 'brand.300' : 'whiteAlpha.700'}
                      borderWidth={isMySetsPage ? '1px' : '0'}
                      borderColor={isMySetsPage ? 'brand.500' : 'transparent'}
                      _hover={{
                        bg: 'rgba(217, 70, 239, 0.1)',
                        color: 'white',
                        transform: 'translateY(-1px)',
                      }}
                      transition="all 0.2s"
                    >
                      My Sets
                    </Button>
                  </Link>
                  <Link href="/pricing">
                    <Button
                      size="md"
                      fontWeight="600"
                      leftIcon={<DollarSign size={18} />}
                      bg={pathname === '/pricing' ? 'rgba(217, 70, 239, 0.15)' : 'transparent'}
                      color={pathname === '/pricing' ? 'brand.300' : 'whiteAlpha.700'}
                      borderWidth={pathname === '/pricing' ? '1px' : '0'}
                      borderColor={pathname === '/pricing' ? 'brand.500' : 'transparent'}
                      _hover={{
                        bg: 'rgba(217, 70, 239, 0.1)',
                        color: 'white',
                        transform: 'translateY(-1px)',
                      }}
                      transition="all 0.2s"
                    >
                      Pricing
                    </Button>
                  </Link>
                </HStack>
                <Menu>
                  <MenuButton
                    as={Button}
                    variant="ghost"
                    p={1}
                    minW="auto"
                    h="auto"
                    borderRadius="full"
                    _hover={{ bg: 'rgba(217, 70, 239, 0.1)' }}
                    _active={{ bg: 'rgba(217, 70, 239, 0.15)' }}
                    transition="all 0.2s"
                  >
                    <Avatar
                      size={{ base: "sm", sm: "md" }}
                      name={user.email}
                      bg="linear-gradient(135deg, #d946ef 0%, #f97316 100%)"
                      color="white"
                      fontWeight="700"
                      border="2px solid"
                      borderColor="rgba(217, 70, 239, 0.3)"
                    />
                  </MenuButton>
                  <MenuList
                    bg="rgba(15, 15, 26, 0.98)"
                    borderColor="rgba(217, 70, 239, 0.25)"
                    borderWidth="2px"
                    boxShadow="0 10px 40px rgba(0, 0, 0, 0.5)"
                    borderRadius="xl"
                    py={2}
                    minW={{ base: "200px", sm: "220px" }}
                    maxW={{ base: "90vw", sm: "none" }}
                  >
                    <Box px={3} py={2} borderBottom="1px solid" borderColor="rgba(217, 70, 239, 0.15)" mb={2}>
                      <Text fontSize="xs" color="whiteAlpha.500" fontWeight="600" textTransform="uppercase" mb={1}>
                        Signed in as
                      </Text>
                      <Text fontSize="sm" color="white" fontWeight="600" isTruncated>
                        {user.email}
                      </Text>
                    </Box>
                    
                    {/* Tokens Display */}
                    {!subscriptionLoading && (
                      <Box px={3} py={2} borderBottom="1px solid" borderColor="rgba(217, 70, 239, 0.15)" mb={2}>
                        <HStack spacing={2} align="center">
                          <Coins size={16} color="#d946ef" />
                          <Text fontSize="sm" color="white" fontWeight="600">
                            {currentTokens >= 999999 ? '∞' : currentTokens} tokens
                          </Text>
                          <Badge 
                            colorScheme={tier === 'premium' ? 'purple' : tier === 'basic' ? 'blue' : 'gray'} 
                            variant="subtle"
                            fontSize="xs"
                            textTransform="capitalize"
                          >
                            {tier}
                          </Badge>
                        </HStack>
                      </Box>
                    )}
                    <MenuItem
                      bg="transparent"
                      color="whiteAlpha.800"
                      _hover={{ bg: 'rgba(217, 70, 239, 0.1)', color: 'white' }}
                      icon={<UserIcon size={18} />}
                      onClick={() => router.push('/profile')}
                      fontWeight="500"
                      borderRadius="md"
                      mx={1}
                    >
                      Profile & Stats
                    </MenuItem>
                    <Box h="1px" bg="rgba(217, 70, 239, 0.15)" my={2} />
                    <MenuItem
                      bg="transparent"
                      color="red.300"
                      _hover={{ bg: 'rgba(239, 68, 68, 0.1)', color: 'red.400' }}
                      icon={<LogOut size={18} />}
                      onClick={handleSignOut}
                      fontWeight="600"
                      borderRadius="md"
                      mx={1}
                    >
                      Sign Out
                    </MenuItem>
                  </MenuList>
                </Menu>
              </>
            ) : (
              <>
                <Link href="/auth">
                  <Button
                    variant="ghost"
                    color="whiteAlpha.700"
                    fontWeight="600"
                    size={{ base: "sm", sm: "md" }}
                    _hover={{
                      bg: 'rgba(217, 70, 239, 0.1)',
                      color: 'white',
                    }}
                    transition="all 0.2s"
                    display={{ base: 'none', sm: 'flex' }}
                  >
                    Sign In
                  </Button>
                </Link>
                <Link href="/auth">
                  <Button
                    bgGradient="linear(135deg, brand.500 0%, accent.500 100%)"
                    color="white"
                    fontWeight="700"
                    size={{ base: "sm", sm: "md" }}
                    px={{ base: 4, sm: 6 }}
                    boxShadow="0 4px 15px rgba(217, 70, 239, 0.3)"
                    _hover={{
                      bgGradient: 'linear(135deg, brand.600 0%, accent.600 100%)',
                      transform: 'translateY(-2px)',
                      boxShadow: '0 6px 20px rgba(217, 70, 239, 0.4)',
                    }}
                    transition="all 0.2s"
                  >
                    <Text display={{ base: 'none', sm: 'inline' }}>Get Started</Text>
                    <Text display={{ base: 'inline', sm: 'none' }}>Start</Text>
                  </Button>
                </Link>
              </>
            )}
          </HStack>
        </Flex>
      </Container>
    </Box>
  )
}
