import React from 'react';
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
  Box,
  AlertIcon,
  Alert,
} from '@chakra-ui/react';

/**
 * Genel kullanım için onay dialog bileşeni
 * 
 * @param {Object} props
 * @param {boolean} props.isOpen - Dialog'un açık olup olmadığı
 * @param {Function} props.onClose - Dialog'u kapatma fonksiyonu
 * @param {string} props.title - Dialog başlığı
 * @param {string} props.message - Dialog mesajı
 * @param {string} props.confirmText - Onay butonu metni (varsayılan: "Onayla")
 * @param {string} props.cancelText - İptal butonu metni (varsayılan: "İptal")
 * @param {Function} props.onConfirm - Onay butonuna tıklandığında çalışacak fonksiyon
 * @param {string} props.alertType - Uyarı tipi (error, warning, info, success) - opsiyonel
 * @param {boolean} props.isLoading - İşlem devam ediyor mu
 */
const ConfirmDialog = ({
  isOpen,
  onClose,
  title,
  message,
  confirmText = "Onayla",
  cancelText = "İptal",
  onConfirm,
  alertType,
  isLoading = false
}) => {
  // Onay butonuna tıklandığında çalışacak fonksiyon
  const handleConfirm = () => {
    if (onConfirm) {
      onConfirm();
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose}>
      <ModalOverlay />
      <ModalContent>
        <ModalHeader>{title}</ModalHeader>
        <ModalCloseButton />
        <ModalBody>
          {alertType && (
            <Alert status={alertType} mb={4} borderRadius="md">
              <AlertIcon />
              <Text fontWeight="medium">{alertType === 'error' ? 'Hata' : 
                     alertType === 'warning' ? 'Uyarı' : 
                     alertType === 'success' ? 'Başarılı' : 
                     'Bilgi'}</Text>
            </Alert>
          )}
          
          <Text>{message}</Text>
        </ModalBody>

        <ModalFooter>
          <Button variant="ghost" mr={3} onClick={onClose} isDisabled={isLoading}>
            {cancelText}
          </Button>
          <Button 
            colorScheme={alertType === 'error' ? 'red' : 
                        alertType === 'warning' ? 'orange' : 
                        alertType === 'success' ? 'green' : 
                        'blue'}
            onClick={handleConfirm}
            isLoading={isLoading}
          >
            {confirmText}
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
};

export default ConfirmDialog;