import React from 'react';
import {
  Box,
  Heading,
  Text,
  Button,
  Image,
  VStack,
  Flex,
  useColorModeValue
} from '@chakra-ui/react';
import { Link as RouterLink } from 'react-router-dom';

const NotFound = () => {
  const bgColor = useColorModeValue('gray.50', 'gray.800');
  const textColor = useColorModeValue('gray.600', 'gray.400');
  
  return (
    <Flex
      minHeight="70vh"
      direction="column"
      alignItems="center"
      justifyContent="center"
      bg={bgColor}
      p={8}
    >
      <Box textAlign="center" maxW="600px">
        <Heading as="h1" size="2xl" mb={4}>
          404
        </Heading>
        
        <Heading as="h2" size="lg" mb={6}>
          Sayfa Bulunamadı
        </Heading>
        
        <Text fontSize="lg" mb={8} color={textColor}>
          Aradığınız sayfa bulunamadı. URL'nin doğru olduğundan emin olun veya
          aşağıdaki bağlantılardan birini kullanarak gezinmeye devam edin.
        </Text>
        
        <VStack spacing={4}>
          <Button
            as={RouterLink}
            to="/"
            colorScheme="blue"
            size="lg"
          >
            Ana Sayfaya Dön
          </Button>
          
          <Button
            as={RouterLink}
            to="/models"
            variant="outline"
          >
            Model Yönetimine Git
          </Button>
        </VStack>
      </Box>
    </Flex>
  );
};

export default NotFound;