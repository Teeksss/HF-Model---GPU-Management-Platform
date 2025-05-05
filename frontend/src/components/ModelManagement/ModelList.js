import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Button,
  Flex,
  Grid,
  Heading,
  Input,
  Select,
  Stack,
  Text,
  useToast,
  useDisclosure,
  Tag,
  Badge,
  Card,
  CardBody,
  CardFooter,
  SimpleGrid,
  Skeleton,
  InputGroup,
  InputLeftElement
} from '@chakra-ui/react';
import { SearchIcon, AddIcon, RepeatIcon } from '@chakra-ui/icons';
import { formatDistanceToNow } from 'date-fns';
import api from '../../services/api';
import ModelDeleteModal from './ModelDeleteModal';

const ModelList = () => {
  const [models, setModels] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [taskFilter, setTaskFilter] = useState('');
  const [frameworkFilter, setFrameworkFilter] = useState('');
  const [availableTasks, setAvailableTasks] = useState([]);
  const [availableFrameworks, setAvailableFrameworks] = useState([]);
  const [modelToDelete, setModelToDelete] = useState(null);
  
  const navigate = useNavigate();
  const toast = useToast();
  const { isOpen, onOpen, onClose } = useDisclosure();
  
  // Modelleri yükle
  const fetchModels = async () => {
    setLoading(true);
    try {
      const response = await api.get('/models', {
        params: {
          search: searchQuery || undefined,
          task: taskFilter || undefined,
          framework: frameworkFilter || undefined,
        }
      });
      setModels(response.data);
      
      // Benzersiz görevleri ve framework'leri çıkar
      const tasks = [...new Set(response.data.map(model => model.task).filter(Boolean))];
      const frameworks = [...new Set(response.data.map(model => model.framework).filter(Boolean))];
      
      setAvailableTasks(tasks);
      setAvailableFrameworks(frameworks);
    } catch (error) {
      toast({
        title: 'Modeller yüklenemedi',
        description: error.response?.data?.detail || 'Bir hata oluştu',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setLoading(false);
    }
  };
  
  // Başlangıçta ve filtrelerde değişiklik olduğunda modelleri yükle
  useEffect(() => {
    fetchModels();
  }, [searchQuery, taskFilter, frameworkFilter]);
  
  // Model silme işlemi
  const handleDelete = (model) => {
    setModelToDelete(model);
    onOpen();
  };
  
  // Detay sayfasına git
  const goToDetail = (modelId) => {
    navigate(`/models/${modelId}`);
  };
  
  return (
    <Box p={4}>
      <Flex justifyContent="space-between" alignItems="center" mb={6}>
        <Heading size="lg">Model Yönetimi</Heading>
        <Button 
          leftIcon={<AddIcon />} 
          colorScheme="blue" 
          onClick={() => navigate('/models/add')}
        >
          Yeni Model Ekle
        </Button>
      </Flex>
      
      {/* Filtreleme araçları */}
      <Flex mb={6} gap={4} direction={{ base: 'column', md: 'row' }}>
        <InputGroup flex={1}>
          <InputLeftElement pointerEvents="none">
            <SearchIcon color="gray.300" />
          </InputLeftElement>
          <Input
            placeholder="Model adı veya ID'ye göre ara..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </InputGroup>
        
        <Select 
          placeholder="Tüm görevler" 
          value={taskFilter} 
          onChange={(e) => setTaskFilter(e.target.value)}
          maxWidth={{ base: '100%', md: '200px' }}
        >
          {availableTasks.map(task => (
            <option key={task} value={task}>{task}</option>
          ))}
        </Select>
        
        <Select 
          placeholder="Tüm frameworkler" 
          value={frameworkFilter} 
          onChange={(e) => setFrameworkFilter(e.target.value)}
          maxWidth={{ base: '100%', md: '200px' }}
        >
          {availableFrameworks.map(framework => (
            <option key={framework} value={framework}>{framework}</option>
          ))}
        </Select>
        
        <Button 
          leftIcon={<RepeatIcon />} 
          onClick={fetchModels}
          colorScheme="gray"
        >
          Yenile
        </Button>
      </Flex>
      
      {/* Model listesi */}
      {loading ? (
        <SimpleGrid columns={{ base: 1, md: 2, lg: 3 }} spacing={6}>
          {[...Array(6)].map((_, i) => (
            <Skeleton key={i} height="200px" />
          ))}
        </SimpleGrid>
      ) : models.length === 0 ? (
        <Box textAlign="center" p={10}>
          <Text fontSize="xl">Hiç model bulunamadı</Text>
          <Text mt={2} color="gray.500">
            {searchQuery || taskFilter || frameworkFilter 
              ? 'Filtreleri değiştirerek tekrar deneyin'
              : 'Yeni bir model eklemek için yukarıdaki düğmeyi kullanın'}
          </Text>
        </Box>
      ) : (
        <SimpleGrid columns={{ base: 1, md: 2, lg: 3 }} spacing={6}>
          {models.map((model) => (
            <Card key={model.id} variant="outline" size="md">
              <CardBody>
                <Flex justifyContent="space-between" alignItems="flex-start">
                  <Heading size="md" noOfLines={1}>{model.model_name}</Heading>
                  {model.is_public ? (
                    <Badge colorScheme="green">Public</Badge>
                  ) : (
                    <Badge colorScheme="red">Private</Badge>
                  )}
                </Flex>
                
                <Text color="gray.500" fontSize="sm" mt={1}>{model.model_id}</Text>
                
                <Flex mt={3} gap={2} wrap="wrap">
                  {model.task && (
                    <Tag size="sm" colorScheme="purple">{model.task}</Tag>
                  )}
                  {model.framework && (
                    <Tag size="sm" colorScheme="blue">{model.framework}</Tag>
                  )}
                </Flex>
                
                <Text mt={4} noOfLines={2} fontSize="sm" color="gray.600">
                  {model.description || 'Açıklama yok'}
                </Text>
                
                <Text fontSize="xs" mt={3} color="gray.500">
                  Son güncelleme: {formatDistanceToNow(new Date(model.last_updated), { addSuffix: true })}
                </Text>
              </CardBody>
              
              <CardFooter pt={0}>
                <Stack direction="row" spacing={2} width="100%">
                  <Button 
                    flex={1} 
                    variant="ghost" 
                    colorScheme="blue"
                    onClick={() => goToDetail(model.model_id)}
                  >
                    Detaylar
                  </Button>
                  <Button 
                    flex={1} 
                    variant="ghost" 
                    colorScheme="red"
                    onClick={() => handleDelete(model)}
                  >
                    Sil
                  </Button>
                </Stack>
              </CardFooter>
            </Card>
          ))}
        </SimpleGrid>
      )}
      
      {/* Model silme modalı */}
      {modelToDelete && (
        <ModelDeleteModal 
          isOpen={isOpen} 
          onClose={() => {
            onClose();
            setModelToDelete(null);
          }}
          model={modelToDelete}
          onSuccess={() => {
            fetchModels();
            setModelToDelete(null);
          }}
        />
      )}
    </Box>
  );
};

export default ModelList;