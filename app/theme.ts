import { extendTheme, type ThemeConfig } from '@chakra-ui/react'

const config: ThemeConfig = {
  initialColorMode: 'dark',
  useSystemColorMode: false,
}

const theme = extendTheme({
  config,
  colors: {
    brand: {
      50: '#fef3ff',
      100: '#fce7ff',
      200: '#f9cfff',
      300: '#f5a7ff',
      400: '#ee6fff',
      500: '#d946ef', // Vibrant purple/pink
      600: '#b826d1',
      700: '#991bb1',
      800: '#7d1a8f',
      900: '#671974',
    },
    accent: {
      50: '#fff7ed',
      100: '#ffedd5',
      200: '#fed7aa',
      300: '#fdba74',
      400: '#fb923c',
      500: '#f97316', // Vibrant orange
      600: '#ea580c',
      700: '#c2410c',
      800: '#9a3412',
      900: '#7c2d12',
    },
    success: {
      50: '#f0fdf4',
      100: '#dcfce7',
      200: '#bbf7d0',
      300: '#86efac',
      400: '#4ade80',
      500: '#22c55e', // Vibrant green
      600: '#16a34a',
      700: '#15803d',
      800: '#166534',
      900: '#14532d',
    },
    dark: {
      bg: '#0f0f1a',
      card: '#1a1a2e',
      cardHover: '#252540',
      input: '#2a2a40',
    },
  },
  fonts: {
    heading: `'Outfit', sans-serif`,
    body: `'Outfit', sans-serif`,
  },
  components: {
    Button: {
      baseStyle: {
        fontWeight: '600',
        borderRadius: 'xl',
      },
      variants: {
        solid: {
          bg: 'linear-gradient(135deg, #d946ef 0%, #f97316 100%)',
          color: 'white',
          _hover: {
            bg: 'linear-gradient(135deg, #b826d1 0%, #ea580c 100%)',
            transform: 'translateY(-2px)',
            boxShadow: '0 10px 40px rgba(217, 70, 239, 0.3)',
          },
          _active: {
            transform: 'translateY(0)',
          },
          transition: 'all 0.2s',
        },
      },
    },
    Input: {
      baseStyle: {
        field: {
          borderRadius: 'xl',
        },
      },
    },
  },
  styles: {
    global: {
      body: {
        bg: '#0f0f1a',
        color: 'white',
        fontFamily: `'Outfit', sans-serif`,
      },
      '*::placeholder': {
        color: 'whiteAlpha.400',
      },
    },
  },
})

export default theme
