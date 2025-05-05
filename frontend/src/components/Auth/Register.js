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

const Register = () => {
  const [showPassword, setShowPassword] = useState(false);
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [fullName, setFullName] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [formErrors, setFormErrors] = useState({});
  
  const navigate = useNavigate();
  
  const bgColor = useColorModeValue('white', 'gray.700');
  const textColor = useColorModeValue('gray.600', 'gray.400');
  
  const togglePasswordVisibility = () => setShowPassword(!showPassword);
  
  const validateForm = () => {
    const errors = {};
    
    if (!username.trim()) {
      errors.username = 'Kullanıcı adı gerekli';
    } else if (username.length < 3) {
      errors.username = 'Kullanıcı adı en az 3 karakter olmalıdır';
    }
    
    if (!email.trim()) {
      errors.email = 'E-posta adresi gerekli';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      errors.email = 'Geçerli bir e-posta adresi girin';
    }
    
    if (!password) {
      errors.password = 'Şifre gerekli';
    } else if (password.length < 8) {
      errors.password = 'Şifre en az 8 karakter olmalıdır';
    }
    
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }
    
    setLoading(true);
    setError('');
    
    try {
      // Kayıt ol
      await api.post('/auth/register', {
        username,
        email,
        password,
        full_name: fullName,
      });
      
      // Başarı mesajı ve giriş sayfasına yönlendirme
      navigate('/login', { 
        state: { 
          message: 'Kayıt başarılı! Şimdi giriş yapabilirsiniz.' 
        } 
      });
    } catch (err) {
      setError(
        err.response?.data?.detail || 
        'Kayıt olurken bir hata oluştu. Lütfen tekrar deneyin.'
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
            Kayıt Ol
          </Heading>
          
          {error && (
            <Alert status="error" rounded="md">
              <AlertIcon />
              {error}
            </Alert>
          )}
          
          <form onSubmit={handleSubmit}>
            <Stack spacing={4}>
              <FormControl isInvalid={!!formErrors.username} isRequired>
                <FormLabel>Kullanıcı Adı</FormLabel>
                <Input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="Kullanıcı adınızı girin"
                />
                <FormErrorMessage>{formErrors.username}</FormErrorMessage>
              </FormControl>
              
              <FormControl isInvalid={!!formErrors.email} isRequired>
                <FormLabel>E-posta Adresi</FormLabel>
                <Input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="E-posta adresinizi girin"
                />
                <FormErrorMessage>{formErrors.email}</FormErrorMessage>
              </FormControl>
              
              <FormControl>
                <FormLabel>Tam Ad</FormLabel>
                <Input
                  type="text"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="Tam adınızı girin (isteğe bağlı)"
                />
              </FormControl>
              
              <FormControl isInvalid={!!formErrors.password} isRequired>
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
                <FormErrorMessage>{formErrors.password}</FormErrorMessage>
              </FormControl>
              
              <Button
                colorScheme="blue"
                isLoading={loading}
                type="submit"
                size="lg"
                mt={6}
              >
                Kayıt Ol
              </Button>
            </Stack>
          </form>
          
          <Text align="center" fontSize="sm" color={textColor}>
            Zaten hesabınız var mı?{' '}
            <ChakraLink as={Link} to="/login" color="blue.500">
              Giriş yap
            </ChakraLink>
          </Text>
        </Stack>
      </Box>
    </Flex>
  );
};

export default Register;