import { extendTheme } from '@chakra-ui/react';

const config = {
  initialColorMode: 'light',
  useSystemColorMode: false,
};

const colors = {
  brand: {
    50: '#e3f2fd',
    100: '#bbdefb',
    200: '#90caf9',
    300: '#64b5f6',
    400: '#42a5f5',
    500: '#2196f3',
    600: '#1e88e5',
    700: '#1976d2',
    800: '#1565c0',
    900: '#0d47a1',
  },
};

const fonts = {
  heading: `'Inter', -apple-system, BlinkMacSystemFont, "Segoe UI", Helvetica, Arial, sans-serif, "Apple Color Emoji", "Segoe UI Emoji", "Segoe UI Symbol"`,
  body: `'Inter', -apple-system, BlinkMacSystemFont, "Segoe UI", Helvetica, Arial, sans-serif, "Apple Color Emoji", "Segoe UI Emoji", "Segoe UI Symbol"`,
};

const styles = {
  global: (props) => ({
    body: {
      bg: props.colorMode === 'dark' ? 'gray.800' : 'gray.50',
    },
  }),
};

const components = {
  Heading: {
    baseStyle: {
      fontWeight: '600',
    },
  },
  Button: {
    baseStyle: {
      fontWeight: '500',
      borderRadius: 'md',
    },
    variants: {
      primary: (props) => ({
        bg: 'brand.500',
        color: 'white',
        _hover: {
          bg: 'brand.600',
        },
        _active: {
          bg: 'brand.700',
        },
      }),
    },
  },
  Card: {
    baseStyle: (props) => ({
      container: {
        bg: props.colorMode === 'dark' ? 'gray.700' : 'white',
        borderRadius: 'lg',
        boxShadow: 'sm',
        overflow: 'hidden',
      },
    }),
  },
};

const theme = extendTheme({ config, colors, fonts, styles, components });

export default theme;