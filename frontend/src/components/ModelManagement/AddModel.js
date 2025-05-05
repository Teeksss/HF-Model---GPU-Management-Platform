import React, { useState } from 'react';
import {
  Box,
  Button,
  FormControl,
  FormLabel,
  Input,
  Textarea,
  Switch,
  FormHelperText,
  Stack,
  Heading,
  Alert,
  AlertIcon,
  Card,
  CardHeader,
  CardBody,
  Divider,
  useToast,
  InputGroup,
  InputLeftAddon,
} from '@chakra-ui/react';
import { useNavigate } from 'react-router-dom';
import api from '../../services/api';

const AddModel = () => {
  const [modelId, setModelId] = useState('');
  const [description, setDescription] = useState('');
  const [revision, setRevision] = useState('');
  const [isPublic, setIsPublic] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  const navigate = useNavigate();
  const toast = useToast();
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!modelId.trim()) {
      setError('Model ID gerekli');
      return;
    }
    
    setLoading(true);
    setError('');
    
    try {
      // Model oluşturma isteği
      await api.post('/models', {
        model_id: modelId,
        description,
        revision: revision || undefined,
        is_public: isPublic,
      });
      
      toast({
        title: 'Model başarıyla eklendi',
        description: `${modelId} başarıyla indirildi ve eklendi`,
        status: 'success',
        duration: 5000,
        isClosable: true,
      });
      
      // Model listesine yönlendir
      navigate('/models');
    } catch (err) {
      setError(err.response?.data?.detail || 'Model eklenirken bir hata oluştu');
      
      toast({
        title: 'Model eklenemedi',
        description: err.response?.data?.detail || 'Bir hata oluştu',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setLoading(false);
    }
  };
  
  return (
    <Box p={4}>
      <Heading size="lg" mb={6}>Yeni Model Ekle</Heading>
      
      <Card maxW="800px" mx="auto">
        <CardHeader>
          <Heading size="md">Hugging Face Model Ekleme</Heading>
        </CardHeader>
        
        <Divider />
        
        <CardBody>
          {error && (
            <Alert status="error" mb={6} rounded="md">
              <AlertIcon />
              {error}
            </Alert>
          )}
          
          <form onSubmit={handleSubmit}>
            <Stack spacing={6}>
              <FormControl isRequired>
                <FormLabel>Model ID</FormLabel>
                <InputGroup>
                  <InputLeftAddon>huggingface.co/</InputLeftAddon>
                  <Input
                    value={modelId}
                    onChange={(e) => setModelId(e.target.value)}
                    placeholder="Örnek: facebook/bart-large-cnn veya gpt2"
                  />
                </InputGroup>
                <FormHelperText>
                  Hugging Face'te bulunan model kimliğini girin. Örneğin:
                  gpt2, facebook/bart-large-cnn, bert-base-uncased
                </FormHelperText>
              </FormControl>
              
              <FormControl>
                <FormLabel>Açıklama</FormLabel>
                <Textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Model hakkında opsiyonel açıklama..."
                  rows={4}
                />
                <FormHelperText>
                  Model hakkında açıklama girebilirsiniz (isteğe bağlı)
                </FormHelperText>
              </FormControl>
              
              <FormControl>
                <FormLabel>Revizyon/Dal/Tag (opsiyonel)</FormLabel>
                <Input
                  value={revision}
                  onChange={(e) => setRevision(e.target.value)}
                  placeholder="Örnek: main, v1.0, veya bir commit hash'i"
                />
                <FormHelperText>
                  İndirmek istediğiniz belirli bir revizyon, dal veya tag.
                  Boş bırakılırsa varsayılan olarak "main" kullanılır.
                </FormHelperText>
              </FormControl>
              
              <FormControl display="flex" alignItems="center">
                <Switch
                  id="is-public"
                  isChecked={isPublic}
                  onChange={(e) => setIsPublic(e.target.checked)}
                  colorScheme="blue"
                  mr={3}
                />
                <FormLabel htmlFor="is-public" mb={0}>
                  Diğer kullanıcılar bu modeli görebilir
                </FormLabel>
              </FormControl>
              
              <Box pt={4}>
                <Button
                  colorScheme="blue"
                  isLoading={loading}
                  loadingText="İndiriliyor..."
                  type="submit"
                  mr={3}
                >
                  Modeli İndir ve Ekle
                </Button>
                <Button
                  variant="outline"
                  onClick={() => navigate('/models')}
                  isDisabled={loading}
                >
                  İptal
                </Button>
              </Box>
            </Stack>
          </form>
        </CardBody>
      </Card>
    </Box>
  );
};

export default AddModel;