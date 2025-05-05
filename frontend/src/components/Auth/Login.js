import React, { useState } from 'react';
import {
  Box,
  Button,
  FormControl,
  FormLabel,
  Input,
  InputGroup,
  InputRightElement,
  Stack,
  Heading,
  Text,
  useColorModeValue,
  Link as ChakraLink,
  FormErrorMessage,
  Alert,
  AlertIcon,
  Center,
  Flex,
} from '@chakra-ui/react';
import { ViewIcon, ViewOffIcon } from '@chakra-ui/icons';
import { Link, useNavigate } from 'react-router-dom';
import api from '../../services/api';
import { setToken, setUserData } from '../../services/auth';

const Login = () => {
  const [showPassword, setShowPassword] = useState(false);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [usernameError, setUsernameError] = useState('');
  const [passwordError, setPasswordError] = useState('');
  
  const navigate = useNavigate();
  
  const bgColor = useColorModeValue('white', 'gray.700');
  const textColor = useColorModeValue('gray.600', 'gray.400');
  
  const togglePasswordVisibility = () => setShowPassword(!showPassword);
  
  const validateForm = () => {
    let isValid = true;
    
    if (!username.trim()) {
      setUsernameError('Kullanıcı adı gerekli');
      isValid = false;
    } else {
      setUsernameError('');
    }
    
    if (!password) {
      setPasswordError('Şifre gerekli');
      isValid = false;
    } else {
      setPasswordError('');
    }
    
    return isValid;
  };
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }
    
    setLoading(true);
    setError('');
    
    try {
      // Form verileri oluştur (OAuth2 şeması kullanılıyor)
      const formData = new FormData();
      formData.append('username', username);
      formData.append('password', password);
      
      // Giriş yap
      const response = await api.post('/auth/token', formData);
      
      // Token'ı kaydet
      setToken(response.data.access_token);
      
      // Kullanıcı bilgilerini al
      const userResponse = await api.get('/auth/me');
      setUserData(userResponse.data);
      
      // Dashboard'a yönlendir
      navigate('/dashboard');
    } catch (err) {
      setError(
        err.response?.data?.detail || 
        'Giriş yapılırken bir hata oluştu. Lütfen tekrar deneyin.'
      );
    } finally {
      setLoading(false);
    }
  };
  
  return (
    <Flex minH="calc(100vh - 4rem)" align="center" justify="center" p={4}>
      <Box
        maxW="md"
        w="full"
        bg={bgColor}
        boxShadow="lg"
        rounded="lg"
        p={8}
      >
        <Stack spacing={6}>
          <Center>
            <Heading size="lg">AI Model Platform</Heading>
          </Center>
          
          <Heading size="md" textAlign="center">
            Giriş Yap
          </Heading>
          
          {error && (
            <Alert status="error" rounded="md">
              <AlertIcon />
              {error}
            </Alert>
          )}
          
          <form onSubmit={handleSubmit}>
            <Stack spacing={4}>
              <FormControl isInvalid={!!usernameError} isRequired>
                <FormLabel>Kullanıcı Adı</FormLabel>
                <Input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="Kullanıcı adınızı girin"
                />
                <FormErrorMessage>{usernameError}</FormErrorMessage>
              </FormControl>
              
              <FormControl isInvalid={!!passwordError} isRequired>
                <FormLabel>Şifre</FormLabel>
                <InputGroup>
                  <Input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Şifrenizi girin"
                  />
                  <InputRightElement h="full">
                    <Button
                      variant="ghost"
                      onClick={togglePasswordVisibility}
                    >
                      {showPassword ? <ViewOffIcon /> : <ViewIcon />}
                    </Button>
                  </InputRightElement>
                </InputGroup>
                <FormErrorMessage>{passwordError}</FormErrorMessage>
              </FormControl>
              
              <Button
                colorScheme="blue"
                isLoading={loading}
                type="submit"
                size="lg"
                mt={6}
              >
                Giriş Yap
              </Button>
            </Stack>
          </form>
          
          <Text align="center" fontSize="sm" color={textColor}>
            Hesabınız yok mu?{' '}
            <ChakraLink as={Link} to="/register" color="blue.500">
              Kayıt ol
            </ChakraLink>
          </Text>
        </Stack>
      </Box>
    </Flex>
  );
};

export default Login;