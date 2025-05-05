import React, { useState, useEffect } from 'react';
import {
  Box,
  Button,
  Flex,
  Heading,
  Text,
  Badge,
  SimpleGrid,
  Stat,
  StatLabel,
  StatNumber,
  StatHelpText,
  Tabs,
  TabList,
  TabPanels,
  Tab,
  TabPanel,
  Spinner,
  useToast,
  Alert,
  AlertIcon,
  Card,
  CardHeader,
  CardBody,
  Divider,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  FormControl,
  FormLabel,
  Select,
  Switch,
  HStack,
  Tag,
  TagLabel,
  Textarea,
  useDisclosure,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalFooter,
  ModalBody,
  ModalCloseButton,
  Modal,
} from '@chakra-ui/react';
import { useParams, useNavigate } from 'react-router-dom';
import { formatDistanceToNow, format } from 'date-fns';
import api from '../../services/api';
import { FaMemory, FaNetworkWired, FaGithub, FaServer } from 'react-icons/fa';

const ModelDetail = () => {
  const { modelId } = useParams();
  const [model, setModel] = useState(null);
  const [versions, setVersions] = useState([]);
  const [gpus, setGpus] = useState([]);
  const [selectedGpu, setSelectedGpu] = useState('auto');
  const [optimizationOptions, setOptimizationOptions] = useState({
    quantize: true,
    use_fp16: true,
    use_onnx: false,
  });
  const [loading, setLoading] = useState(true);
  const [optimizing, setOptimizing] = useState(false);
  const [updating, setUpdating] = useState(false);
  const [description, setDescription] = useState('');
  const [isPublic, setIsPublic] = useState(true);
  const [error, setError] = useState('');
  
  const navigate = useNavigate();
  const toast = useToast();
  const { isOpen, onOpen, onClose } = useDisclosure();
  
  // Model ve versiyonları yükle
  useEffect(() => {
    const fetchModelData = async () => {
      try {
        setLoading(true);
        
        // Model detayları
        const modelResponse = await api.get(`/models/${modelId}`);
        setModel(modelResponse.data);
        setDescription(modelResponse.data.description || '');
        setIsPublic(modelResponse.data.is_public);
        
        // Model versiyonları
        const versionsResponse = await api.get(`/models/${modelId}/versions`);
        setVersions(versionsResponse.data);
        
        // GPU listesi
        const gpuResponse = await api.get('/gpus');
        setGpus(gpuResponse.data);
        
        setError('');
      } catch (err) {
        setError('Model detayları yüklenemedi');
        toast({
          title: 'Hata',
          description: err.response?.data?.detail || 'Model bilgileri alınamadı',
          status: 'error',
          duration: 5000,
          isClosable: true,
        });
      } finally {
        setLoading(false);
      }
    };
    
    fetchModelData();
  }, [modelId, toast]);
  
  // Model güncelleme işlemi
  const handleUpdateModel = async () => {
    setUpdating(true);
    
    try {
      const response = await api.put(`/models/${modelId}`, {
        description,
        is_public: isPublic,
      });
      
      setModel(response.data);
      
      toast({
        title: 'Model güncellendi',
        description: 'Model bilgileri başarıyla güncellendi',
        status: 'success',
        duration: 3000,
        isClosable: true,
      });
    } catch (err) {
      toast({
        title: 'Güncelleme hatası',
        description: err.response?.data?.detail || 'Model güncellenemedi',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setUpdating(false);
    }
  };
  
  // Model silme işlemi
  const handleDeleteModel = async () => {
    try {
      await api.delete(`/models/${modelId}`);
      
      toast({
        title: 'Model silindi',
        description: 'Model başarıyla silindi',
        status: 'success',
        duration: 3000,
        isClosable: true,
      });
      
      navigate('/models');
    } catch (err) {
      toast({
        title: 'Silme hatası',
        description: err.response?.data?.detail || 'Model silinemedi',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    } finally {
      onClose();
    }
  };
  
  // Model optimize etme işlemi
  const handleOptimizeModel = async () => {
    setOptimizing(true);
    
    try {
      // Optimizasyon verilerini hazırla
      const optimizationData = {
        ...optimizationOptions,
        gpu_index: selectedGpu === 'auto' ? null : parseInt(selectedGpu),
      };
      
      // Optimize et
      const response = await api.post(`/models/${modelId}/optimize`, optimizationData);
      
      toast({
        title: 'Model optimize edildi',
        description: response.data.message || 'Model başarıyla yüklendi ve optimize edildi',
        status: 'success',
        duration: 5000,
        isClosable: true,
      });
    } catch (err) {
      toast({
        title: 'Optimizasyon hatası',
        description: err.response?.data?.detail || 'Model optimize edilemedi',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setOptimizing(false);
    }
  };
  
  // Yükleniyor gösterimi
  if (loading) {
    return (
      <Flex justify="center" align="center" minH="70vh">
        <Spinner size="xl" />
      </Flex>
    );
  }
  
  if (error && !model) {
    return (
      <Box p={4} textAlign="center">
        <Alert status="error" mb={4}>
          <AlertIcon />
          {error}
        </Alert>
        <Button onClick={() => navigate('/models')}>Geri Dön</Button>
      </Box>
    );
  }
  
  return (
    <Box p={4}>
      <Flex justifyContent="space-between" alignItems="center" mb={6} flexWrap="wrap">
        <Heading size="lg">{model.model_name}</Heading>
        
        <HStack spacing={3} mt={{ base: 4, md: 0 }}>
          <Button colorScheme="red" variant="outline" onClick={onOpen}>
            Modeli Sil
          </Button>
          <Button colorScheme="blue" onClick={() => navigate('/models')}>
            Tüm Modeller
          </Button>
        </HStack>
      </Flex>
      
      <SimpleGrid columns={{ base: 1, lg: 2 }} spacing={6}>
        <Card>
          <CardHeader>
            <Heading size="md">Model Bilgileri</Heading>
          </CardHeader>
          <Divider />
          <CardBody>
            <SimpleGrid columns={{ base: 1, sm: 2 }} spacing={4} mb={6}>
              <Stat>
                <StatLabel>Model ID</StatLabel>
                <StatNumber fontSize="md">{model.model_id}</StatNumber>
                <StatHelpText>
                  {formatDistanceToNow(new Date(model.created_at), { addSuffix: true })} eklendi
                </StatHelpText>
              </Stat>
              
              <Stat>
                <StatLabel>Son Güncelleme</StatLabel>
                <StatNumber fontSize="md">
                  {format(new Date(model.last_updated), 'dd.MM.yyyy')}
                </StatNumber>
                <StatHelpText>
                  {format(new Date(model.last_updated), 'HH:mm')}
                </StatHelpText>
              </Stat>
            </SimpleGrid>
            
            <Box mb={6}>
              <Flex mb={2}>
                <Badge colorScheme={model.is_public ? 'green' : 'red'} mr={2}>
                  {model.is_public ? 'Public' : 'Private'}
                </Badge>
                
                {model.task && (
                  <Badge colorScheme="purple" mr={2}>{model.task}</Badge>
                )}
                
                {model.framework && (
                  <Badge colorScheme="blue">{model.framework}</Badge>
                )}
              </Flex>
              
              <Text>
                {model.description || 'Bu model için açıklama bulunmuyor.'}
              </Text>
            </Box>
            
            <Divider mb={6} />
            
            <Box>
              <Heading size="sm" mb={4}>Model Bilgilerini Güncelle</Heading>
              
              <FormControl mb={4}>
                <FormLabel>Açıklama</FormLabel>
                <Textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Model açıklaması..."
                  rows={3}
                />
              </FormControl>
              
              <FormControl display="flex" alignItems="center" mb={4}>
                <Switch
                  id="is-public"
                  isChecked={isPublic}
                  onChange={(e) => setIsPublic(e.target.checked)}
                  colorScheme="blue"
                  mr={3}
                />
                <FormLabel htmlFor="is-public" mb={0}>
                  Diğer kullanıcılar görebilir
                </FormLabel>
              </FormControl>
              
              <Button
                colorScheme="blue"
                onClick={handleUpdateModel}
                isLoading={updating}
              >
                Güncelle
              </Button>
            </Box>
          </CardBody>
        </Card>
        
        <Card>
          <CardHeader>
            <Heading size="md">Model Optimizasyonu</Heading>
          </CardHeader>
          <Divider />
          <CardBody>
            <Box mb={6}>
              <Heading size="sm" mb={4}>GPU Ayarları</Heading>
              
              <FormControl mb={4}>
                <FormLabel>GPU Seçimi</FormLabel>
                <Select
                  value={selectedGpu}
                  onChange={(e) => setSelectedGpu(e.target.value)}
                >
                  <option value="auto">Otomatik Seç (Optimal)</option>
                  {gpus.map((gpu) => (
                    <option key={gpu.index} value={gpu.index}>
                      GPU {gpu.index}: {gpu.name} ({(gpu.free_memory_mb / 1024).toFixed(2)} GB Boş)
                    </option>
                  ))}
                </Select>
              </FormControl>
              
              <Heading size="sm" mb={4}>Optimizasyon Seçenekleri</Heading>
              
              <FormControl display="flex" alignItems="center" mb={3}>
                <Switch
                  id="quantize"
                  isChecked={optimizationOptions.quantize}
                  onChange={(e) => setOptimizationOptions({...optimizationOptions, quantize: e.target.checked})}
                  colorScheme="blue"
                  mr={3}
                />
                <FormLabel htmlFor="quantize" mb={0}>
                  Quantization Uygula (INT8)
                </FormLabel>
              </FormControl>
              
              <FormControl display="flex" alignItems="center" mb={3}>
                <Switch
                  id="use_fp16"
                  isChecked={optimizationOptions.use_fp16}
                  onChange={(e) => setOptimizationOptions({...optimizationOptions, use_fp16: e.target.checked})}
                  colorScheme="blue"
                  mr={3}
                />
                <FormLabel htmlFor="use_fp16" mb={0}>
                  FP16 (Half Precision) Kullan
                </FormLabel>
              </FormControl>
              
              <FormControl display="flex" alignItems="center" mb={5}>
                <Switch
                  id="use_onnx"
                  isChecked={optimizationOptions.use_onnx}
                  onChange={(e) => setOptimizationOptions({...optimizationOptions, use_onnx: e.target.checked})}
                  colorScheme="blue"
                  mr={3}
                />
                <FormLabel htmlFor="use_onnx" mb={0}>
                  ONNX Runtime Kullan
                </FormLabel>
              </FormControl>
              
              <Button
                colorScheme="green"
                onClick={handleOptimizeModel}
                isLoading={optimizing}
                width="full"
              >
                Modeli Optimize Et ve Yükle
              </Button>
            </Box>
          </CardBody>
        </Card>
      </SimpleGrid>
      
      <Card mt={6}>
        <CardHeader>
          <Heading size="md">Model Versiyonları</Heading>
        </CardHeader>
        <Divider />
        <CardBody>
          {versions.length === 0 ? (
            <Text>Henüz versiyon bilgisi yok</Text>
          ) : (
            <Table variant="simple">
              <Thead>
                <Tr>
                  <Th>Versiyon</Th>
                  <Th>Commit Hash</Th>
                  <Th>İndirme Tarihi</Th>
                  <Th>Dosya Boyutu</Th>
                </Tr>
              </Thead>
              <Tbody>
                {versions.map((version) => (
                  <Tr key={version.id}>
                    <Td>{version.version}</Td>
                    <Td>{version.commit_hash ? version.commit_hash.substring(0, 8) : 'N/A'}</Td>
                    <Td>{format(new Date(version.download_date), 'dd.MM.yyyy HH:mm')}</Td>
                    <Td>
                      {version.file_size 
                        ? `${(version.file_size / (1024 * 1024)).toFixed(2)} MB` 
                        : 'Bilinmiyor'}
                    </Td>
                  </Tr>
                ))}
              </Tbody>
            </Table>
          )}
        </CardBody>
      </Card>
      
      {/* Model Silme Modalı */}
      <Modal isOpen={isOpen} onClose={onClose}>
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>Modeli Sil</ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            <Text>{model.model_name} modelini silmek istediğinizden emin misiniz?</Text>
            <Text mt={2} fontSize="sm" color="red.500">
              Bu işlem geri alınamaz ve modelle ilgili tüm veriler silinecektir.
            </Text>
          </ModalBody>
          <ModalFooter>
            <Button variant="ghost" mr={3} onClick={onClose}>
              İptal
            </Button>
            <Button colorScheme="red" onClick={handleDeleteModel}>
              Sil
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </Box>
  );
};

export default ModelDetail;