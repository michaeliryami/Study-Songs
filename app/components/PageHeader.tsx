import { Box, Heading, Text, VStack } from '@chakra-ui/react'

interface PageHeaderProps {
  title: string
  subtitle: string
}

export default function PageHeader({ title, subtitle }: PageHeaderProps) {
  return (
    <Box textAlign="center">
      <Heading
        as="h1"
        fontSize={{ base: 'xl', sm: '2xl', md: '4xl' }}
        fontWeight="900"
        mb={3}
        letterSpacing="-0.03em"
        bgGradient="linear(135deg, brand.400 0%, accent.400 100%)"
        bgClip="text"
        px={{ base: 2, sm: 0 }}
      >
        {title}
      </Heading>
      <Text
        fontSize={{ base: 'sm', sm: 'md' }}
        color="whiteAlpha.600"
        fontWeight="500"
        maxW="xl"
        mx="auto"
        px={{ base: 4, sm: 0 }}
      >
        {subtitle}
      </Text>
    </Box>
  )
}
