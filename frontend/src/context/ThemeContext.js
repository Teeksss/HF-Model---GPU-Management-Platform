import React, { createContext, useState, useContext, useEffect } from 'react';
import { useColorMode } from '@chakra-ui/react';

// Theme context
const ThemeContext = createContext({
  colorMode: 'light',
  toggleColorMode: () => {},
  setColorMode: () => {},
});

// Theme provider component
export const ThemeProvider = ({ children }) => {
  const { colorMode, toggleColorMode, setColorMode } = useColorMode();
  
  // Kullanıcı tercihini localStorage'a kaydet
  useEffect(() => {
    localStorage.setItem('color-mode', colorMode);
  }, [colorMode]);
  
  return (
    <ThemeContext.Provider
      value={{
        colorMode,
        toggleColorMode,
        setColorMode,
      }}
    >
      {children}
    </ThemeContext.Provider>
  );
};

// Custom hook for using theme context
export const useTheme = () => useContext(ThemeContext);