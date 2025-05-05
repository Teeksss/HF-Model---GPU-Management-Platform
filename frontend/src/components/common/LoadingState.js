import React from 'react';
import {
  Flex,
  Spinner,
  Text,
  VStack,
  useColorModeValue,
  Image,
} from '@chakra-ui/react';

/**
 * Yükleme durumunu gösteren bileşen
 * 
 * @param {Object} props
 * @param {string} props.text - Yükleme metni (varsayılan: "Yükleniyor...")
 * @param {string} props.size - Spinner boyutu (varsayılan: "xl")
 * @param {string} props.height - Container yüksekliği (varsayılan: "50vh")
 * @param {string} props.color - Spinner rengi
 * @param {string} props.logoSrc - Logo kaynak dosyası (opsiyonel)
 */
const LoadingState = ({
  text = "Yükleniyor...",
  size = "xl",
  height = "50vh",
  color,
  logoSrc
}) => {
  const spinnerColor = color || useColorModeValue("blue.500", "blue.300");
  const textColor = useColorModeValue("gray.700", "gray.200");

  return (
    <Flex
      justifyContent="center"
      alignItems="center"
      height={height}
      width="100%"
    >
      <VStack spacing={6}>
        {logoSrc && (
          <Image 
            src={logoSrc}
            alt="Logo"
            boxSize="100px"
            opacity={0.8}
          />
        )}
        
        <Spinner
          thickness="4px"
          speed="0.65s"
          emptyColor={useColorModeValue("gray.200", "gray.700")}
          color={spinnerColor}
          size={size}
        />
        
        <Text
          color={textColor}
          fontSize="lg"
          fontWeight="medium"
        >
          {text}
        </Text>
      </VStack>
    </Flex>
  );
};

export default LoadingState;