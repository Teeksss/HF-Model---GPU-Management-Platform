import React, { useState } from 'react';
import {
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalFooter,
  ModalBody,
  ModalCloseButton,
  Button,
  Text,
  useToast,
  Spinner,
  Box,
  Alert,
  AlertIcon,
} from '@chakra-ui/react';
import api from '../../services/api';

const ModelDeleteModal = ({ isOpen, onClose, model, onSuccess }) => {
  const [isDeleting, setIsDeleting] = useState(false);
  const [error, setError] = useState(null);
  const toast = useToast();
  
  const handleDelete = async () => {
    setIsDeleting(true);
    setError(null);
    
    try {
      await api.delete(`/models/${model.model_id}`);
      
      toast({
        title: 'Model silindi',
        description: `${model.model_name} başarıyla silindi.`,
        status: 'success',
        duration: 5000,
        isClosable: true,
      });
      
      if (onSuccess) onSuccess();
      onClose();
    } catch (err) {
      setError(err.response?.data?.detail || 'Model silinirken bir hata oluştu');
      toast({
        title: 'Model silinemedi',
        description: err.response?.data?.detail || 'Bir hata oluştu',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setIsDeleting(false);
    }
  };
  
  return (
    <Modal isOpen={isOpen} onClose={onClose}>
      <ModalOverlay />
      <ModalContent>
        <ModalHeader>Modeli Sil</ModalHeader>
        <ModalCloseButton />
        <ModalBody>
          <Text>
            <strong>{model.model_name}</strong> modelini silmek istediğinizden emin misiniz?
          </Text>
          <Text mt={2} fontSize="sm" color="gray.600">
            Bu işlem geri alınamaz ve modelle ilgili tüm veriler silinecektir.
          </Text>
          
          {error && (
            <Alert status="error" mt={4}>
              <AlertIcon />
              {error}
            </Alert>
          )}
        </ModalBody>

        <ModalFooter>
          <Button variant="ghost" mr={3} onClick={onClose} isDisabled={isDeleting}>
            İptal
          </Button>
          <Button 
            colorScheme="red" 
            onClick={handleDelete}
            isLoading={isDeleting}
            loadingText="Siliniyor..."
          >
            Sil
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
};

export default ModelDeleteModal;