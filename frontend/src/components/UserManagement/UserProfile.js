import React, { useState, useEffect } from 'react';
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
  FormErrorMessage,
  Alert,
  AlertIcon,
  Flex,
  Avatar,
  Card,
  CardHeader,
  CardBody,
  Divider,
  SimpleGrid,
  Badge,
  Stat,
  StatLabel,
  StatNumber,
  StatHelpText,
  useToast,
  VStack,
  Spinner,
} from '@chakra-ui/react';
import { ViewIcon, ViewOffIcon } from '@chakra-ui/icons';
import api from '../../services/api';
import { getUserData, setUserData } from '../../services/auth';

const UserProfile = () => {
  const [showPassword, setShowPassword] = useState(false);
  const [user, setUser] = useState(null);
  const [email, setEmail] = useState('');
  const [fullName, setFullName] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [error, setError] = useState('');
  const [formErrors, setFormErrors] = useState({});
  const [models, setModels] = useState([]);
  const [gpuUsage, setGpuUsage] = useState([]);
  
  const toast = useToast();
  
  const bgColor = useColorModeValue('white', 'gray.700');
  const textColor = useColorModeValue('gray.600', 'gray.400');
  
  const togglePasswordVisibility = () => setShowPassword(!showPassword);
  
  // Kullanıcı verilerini ve istatistikleri yükle
  useEffect(() => {
    const fetchUserData = async () => {
      try {
        setLoading(true);
        
        // Kullanıcı bilgilerini al
        const userData = getUserData();
        setUser(userData);
        
        // Form alanlarını doldur
        setEmail(userData.email || '');
        setFullName(userData.full_name || '');
        
        // Kullanıcının modellerini al
        const modelsResponse = await api.get('/models');
        setModels(modelsResponse.data);
        
        // Kullanıcının GPU kullanımlarını al
        const gpuResponse = await api.get(`/gpus/usage/user/${userData.id}`);
        setGpuUsage(gpuResponse.data);
        
        setError('');
      } catch (err) {
        setError('Kullanıcı verileri yüklenemedi. Lütfen tekrar deneyin.');
        toast({
          title: 'Hata',
          description: 'Kullanıcı verileri yüklenemedi',
          status: 'error',
          duration: 5000,
          isClosable: true,
        });
      } finally {
        setLoading(false);
      }
    };
    
    fetchUserData();
  }, [toast]);
  
  const validateForm = () => {
    const errors = {};
    
    if (!email.trim()) {
      errors.email = 'E-posta adresi gerekli';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      errors.email = 'Geçerli bir e-posta adresi girin';
    }
    
    if (password && password.length < 8) {
      errors.password = 'Şifre en az 8 karakter olmalıdır';
    }
    
    if (password !== confirmPassword) {
      errors.confirmPassword = 'Şifreler eşleşmiyor';
    }
    
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }
    
    setUpdating(true);
    setError('');
    
    try {
      // Güncelleme verilerini hazırla
      const updateData = {
        email,
        full_name: fullName,
      };
      
      // Şifre değiştiriliyorsa ekle
      if (password) {
        updateData.password = password;
      }
      
      // Profili güncelle
      const response = await api.put(`/auth/me`, updateData);
      
      // Kullanıcı verilerini güncelle
      setUserData(response.data);
      setUser(response.data);
      
      // Şifre alanlarını temizle
      setPassword('');
      setConfirmPassword('');
      
      toast({
        title: 'Profil güncellendi',
        description: 'Profil bilgileriniz başarıyla güncellendi',
        status: 'success',
        duration: 5000,
        isClosable: true,
      });
    } catch (err) {
      setError(
        err.response?.data?.detail || 
        'Profil güncellenirken bir hata oluştu. Lütfen tekrar deneyin.'
      );
      toast({
        title: 'Hata',
        description: err.response?.data?.detail || 'Profil güncellenemedi',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setUpdating(false);
    }
  };
  
  if (loading) {
    return (
      <Flex minH="calc(100vh - 4rem)" align="center" justify="center">
        <Spinner size="xl" />
      </Flex>
    );
  }
  
  return (
    <Box p={4}>
      <Heading size="lg" mb={6}>Kullanıcı Profili</Heading>
      
      <SimpleGrid columns={{ base: 1, lg: 2 }} spacing={6}>
        <Card bg={bgColor}>
          <CardHeader>
            <Flex alignItems="center">
              <Avatar 
                size="xl" 
                name={user?.full_name || user?.username || 'User'} 
                mr={4}
                bg="blue.500"
              />
              <VStack align="start" spacing={1}>
                <Heading size="md">{user?.full_name || 'Kullanıcı'}</Heading>
                <Text color={textColor}>{user?.username}</Text>
                <Badge colorScheme={user?.is_admin ? 'red' : 'green'}>
                  {user?.is_admin ? 'Admin' : 'Kullanıcı'}
                </Badge>
              </VStack>
            </Flex>
          </CardHeader>
          
          <CardBody>
            <SimpleGrid columns={{ base: 1, md: 2 }} spacing={4} mb={6}>
              <Stat>
                <StatLabel>Model Sayısı</StatLabel>
                <StatNumber>{models.length}</StatNumber>
                <StatHelpText>Toplam yüklü model</StatHelpText>
              </Stat>
              
              <Stat>
                <StatLabel>GPU Kullanımı</StatLabel>
                <StatNumber>{gpuUsage.length}</StatNumber>
                <StatHelpText>Toplam GPU görevi</StatHelpText>
              </Stat>
            </SimpleGrid>
            
            <Divider mb={6} />
            
            {error && (
              <Alert status="error" mb={6} rounded="md">
                <AlertIcon />
                {error}
              </Alert>
            )}
            
            <form onSubmit={handleSubmit}>
              <Stack spacing={4}>
                <FormControl id="email" isInvalid={!!formErrors.email}>
                  <FormLabel>E-posta Adresi</FormLabel>
                  <Input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                  />
                  <FormErrorMessage>{formErrors.email}</FormErrorMessage>
                </FormControl>
                
                <FormControl id="fullName">
                  <FormLabel>Ad Soyad</FormLabel>
                  <Input
                    type="text"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                  />
                </FormControl>
                
                <FormControl id="password" isInvalid={!!formErrors.password}>
                  <FormLabel>Yeni Şifre</FormLabel>
                  <InputGroup>
                    <Input
                      type={showPassword ? 'text' : 'password'}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Değiştirmek için yeni şifre girin"
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
                
                <FormControl id="confirmPassword" isInvalid={!!formErrors.confirmPassword}>
                  <FormLabel>Şifre Onayı</FormLabel>
                  <Input
                    type={showPassword ? 'text' : 'password'}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Yeni şifreyi tekrar girin"
                  />
                  <FormErrorMessage>{formErrors.confirmPassword}</FormErrorMessage>
                </FormControl>
                
                <Button
                  colorScheme="blue"
                  isLoading={updating}
                  type="submit"
                  mt={4}
                >
                  Profili Güncelle
                </Button>
              </Stack>
            </form>
          </CardBody>
        </Card>
        
        <Card bg={bgColor}>
          <CardHeader>
            <Heading size="md">Aktiviteler</Heading>
          </CardHeader>
          
          <CardBody>
            <Box mb={6}>
              <Heading size="sm" mb={3}>Son Modeller</Heading>
              {models.length > 0 ? (
                <VStack align="stretch" spacing={2}>
                  {models.slice(0, 5).map((model) => (
                    <Flex key={model.id} justify="space-between" p={2} bg="gray.50" _dark={{ bg: "gray.700" }} rounded="md">
                      <Text fontWeight="medium">{model.model_name}</Text>
                      <Badge colorScheme={model.task ? 'purple' : 'gray'}>
                        {model.task || 'Belirtilmemiş'}
                      </Badge>
                    </Flex>
                  ))}
                </VStack>
              ) : (
                <Text color={textColor}>Hiç model bulunamadı.</Text>
              )}
            </Box>
            
            <Divider mb={6} />
            
            <Box>
              <Heading size="sm" mb={3}>Son GPU Kullanımları</Heading>
              {gpuUsage.length > 0 ? (
                <VStack align="stretch" spacing={2}>
                  {gpuUsage.slice(0, 5).map((usage) => (
                    <Flex key={usage.id} justify="space-between" p={2} bg="gray.50" _dark={{ bg: "gray.700" }} rounded="md">
                      <VStack align="start" spacing={0}>
                        <Text fontWeight="medium">GPU {usage.gpu_index}</Text>
                        <Text fontSize="xs" color={textColor}>
                          {new Date(usage.start_time).toLocaleString()}
                        </Text>
                      </VStack>
                      <Badge colorScheme={usage.is_active ? 'green' : 'gray'}>
                        {usage.is_active ? 'Aktif' : 'Tamamlandı'}
                      </Badge>
                    </Flex>
                  ))}
                </VStack>
              ) : (
                <Text color={textColor}>Hiç GPU kullanımı bulunamadı.</Text>
              )}
            </Box>
          </CardBody>
        </Card>
      </SimpleGrid>
    </Box>
  );
};

export default UserProfile;