'use client'

import { Box, Container, Flex, Heading, HStack, Button, Text, Menu, MenuButton, MenuList, MenuItem, Avatar } from '@chakra-ui/react'
import { Music, Library, Sparkles, LogOut, User as UserIcon } from 'lucide-react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { useAuth } from '../contexts/AuthContext'

export default function Navbar() {
  const pathname = usePathname()
  const router = useRouter()
  const { user, signOut } = useAuth()
  const isCreatePage = pathname === '/create'
  const isMySetsPage = pathname === '/my-sets'

  const handleSignOut = async () => {
    await signOut()
    router.push('/')
  }

  return (
    <Box 
      bg="rgba(26, 26, 46, 0.8)" 
      backdropFilter="blur(10px)"
      borderBottom="1px solid" 
      borderColor="rgba(217, 70, 239, 0.1)" 
      py={3}
      position="sticky"
      top={0}
      zIndex={100}
    >
      <Container maxW="container.xl">
        <Flex justify="space-between" align="center">
          <Link href="/">
            <Flex align="center" gap={3} cursor="pointer">
              <Box
                w="40px"
                h="40px"
                bgGradient="linear(135deg, brand.500 0%, accent.500 100%)"
                borderRadius="xl"
                display="flex"
                alignItems="center"
                justifyContent="center"
                boxShadow="0 4px 20px rgba(217, 70, 239, 0.3)"
              >
                <Music size={22} color="#ffffff" strokeWidth={2.5} />
              </Box>
              <Box>
                <Heading size="md" fontWeight="800" bgGradient="linear(135deg, brand.400 0%, accent.400 100%)" bgClip="text">
                  Numo AI
                </Heading>
                <Text fontSize="xs" color="whiteAlpha.600" fontWeight="500">AI-Powered Mnemonics</Text>
              </Box>
            </Flex>
          </Link>

          <HStack spacing={3}>
            {user ? (
              <>
                <Link href="/create">
                  <Button
                    variant={isCreatePage ? 'solid' : 'ghost'}
                    colorScheme="whiteAlpha"
                    fontWeight="600"
                    size="md"
                    leftIcon={<Sparkles size={18} />}
                    bg={isCreatePage ? 'linear-gradient(135deg, #d946ef 0%, #f97316 100%)' : 'transparent'}
                    _hover={{
                      bg: isCreatePage 
                        ? 'linear-gradient(135deg, #b826d1 0%, #ea580c 100%)'
                        : 'whiteAlpha.100',
                    }}
                  >
                    Create
                  </Button>
                </Link>
                <Link href="/my-sets">
                  <Button
                    variant={isMySetsPage ? 'solid' : 'ghost'}
                    colorScheme="whiteAlpha"
                    fontWeight="600"
                    size="md"
                    leftIcon={<Library size={18} />}
                    bg={isMySetsPage ? 'linear-gradient(135deg, #d946ef 0%, #f97316 100%)' : 'transparent'}
                    _hover={{
                      bg: isMySetsPage 
                        ? 'linear-gradient(135deg, #b826d1 0%, #ea580c 100%)'
                        : 'whiteAlpha.100',
                    }}
                  >
                    My Sets
                  </Button>
                </Link>
                <Menu>
                  <MenuButton
                    as={Button}
                    variant="ghost"
                    colorScheme="whiteAlpha"
                    p={1}
                    minW="auto"
                    h="auto"
                  >
                    <Avatar
                      size="sm"
                      name={user.email}
                      bg="brand.500"
                      color="white"
                    />
                  </MenuButton>
                  <MenuList
                    bg="rgba(26, 26, 46, 0.95)"
                    borderColor="rgba(217, 70, 239, 0.3)"
                  >
                    <MenuItem
                      bg="transparent"
                      color="whiteAlpha.800"
                      _hover={{ bg: 'rgba(217, 70, 239, 0.1)' }}
                      icon={<UserIcon size={16} />}
                      isDisabled
                    >
                      {user.email}
                    </MenuItem>
                    <MenuItem
                      bg="transparent"
                      color="red.300"
                      _hover={{ bg: 'rgba(239, 68, 68, 0.1)' }}
                      icon={<LogOut size={16} />}
                      onClick={handleSignOut}
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
                    colorScheme="whiteAlpha"
                    fontWeight="600"
                    size="md"
                  >
                    Sign In
                  </Button>
                </Link>
                <Link href="/auth">
                  <Button
                    bgGradient="linear(135deg, brand.500 0%, accent.500 100%)"
                    color="white"
                    fontWeight="600"
                    size="md"
                    _hover={{
                      bgGradient: 'linear(135deg, brand.600 0%, accent.600 100%)',
                    }}
                  >
                    Get Started
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
