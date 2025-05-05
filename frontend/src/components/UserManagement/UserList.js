import React, { useState, useEffect } from 'react';
import {
  Box,
  Button,
  Flex,
  Heading,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  Badge,
  Menu,
  MenuButton,
  MenuList,
  MenuItem,
  IconButton,
  InputGroup,
  Input,
  InputLeftElement,
  Spinner,
  Text,
  useToast,
  useDisclosure,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalFooter,
  ModalBody,
  ModalCloseButton,
  Alert,
  AlertIcon,
} from '@chakra-ui/react';
import { ChevronDownIcon, SearchIcon, RepeatIcon } from '@chakra-ui/icons';
import { FaUserAlt, FaUserCog, FaUserSlash, FaUserCheck } from 'react-icons/fa';
import api from '../../services/api';
import { useAuth } from '../../context/AuthContext';

const UserList = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [actionInProgress, setActionInProgress] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [actionType, setActionType] = useState(null);
  
  const { user: currentUser } = useAuth();
  const toast = useToast();
  const { isOpen, onOpen, onClose } = useDisclosure();
  
  // Kullanıcıları yükle
  const fetchUsers = async () => {
    try {
      setLoading(true);
      const response = await api.get('/users');
      setUsers(response.data);
      setError(null);
    } catch (err) {
      setError('Kullanıcı listesi yüklenemedi');
      toast({
        title: 'Hata',
        description: err.response?.data?.detail || 'Kullanıcılar yüklenemedi',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setLoading(false);
    }
  };
  
  // Sayfa yüklendiğinde kullanıcıları getir
  useEffect(() => {
    fetchUsers();
  }, []);
  
  // Arama sonuçlarını filtrele
  const filteredUsers = users.filter(user => {
    const lowercaseQuery = searchQuery.toLowerCase();
    return (
      user.username.toLowerCase().includes(lowercaseQuery) ||
      (user.email && user.email.toLowerCase().includes(lowercaseQuery)) ||
      (user.full_name && user.full_name.toLowerCase().includes(lowercaseQuery))
    );
  });
  
  // Kullanıcı işlemleri
  const handleUserAction = async () => {
    if (!selectedUser || !actionType) return;
    
    setActionInProgress(true);
    
    try {
      let response;
      
      switch (actionType) {
        case 'activate':
          response = await api.patch(`/users/${selectedUser.id}/activate`);
          toast({
            title: 'Kullanıcı aktifleştirildi',
            description: `${selectedUser.username} kullanıcısı aktifleştirildi`,
            status: 'success',
            duration: 3000,
            isClosable: true,
          });
          break;
          
        case 'deactivate':
          response = await api.patch(`/users/${selectedUser.id}/deactivate`);
          toast({
            title: 'Kullanıcı devre dışı bırakıldı',
            description: `${selectedUser.username} kullanıcısı devre dışı bırakıldı`,
            status: 'success',
            duration: 3000,
            isClosable: true,
          });
          break;
          
        case 'makeAdmin':
          response = await api.patch(`/users/${selectedUser.id}/make-admin`);
          toast({
            title: 'Admin yetkisi verildi',
            description: `${selectedUser.username} kullanıcısına admin yetkisi verildi`,
            status: 'success',
            duration: 3000,
            isClosable: true,
          });
          break;
          
        case 'removeAdmin':
          response = await api.patch(`/users/${selectedUser.id}/remove-admin`);
          toast({
            title: 'Admin yetkisi kaldırıldı',
            description: `${selectedUser.username} kullanıcısından admin yetkisi kaldırıldı`,
            status: 'success',
            duration: 3000,
            isClosable: true,
          });
          break;
          
        default:
          break;
      }
      
      // Kullanıcı listesini güncelle
      fetchUsers();
      
    } catch (err) {
      toast({
        title: 'İşlem başarısız',
        description: err.response?.data?.detail || 'Kullanıcı işlemi gerçekleştirilemedi',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setActionInProgress(false);
      onClose();
    }
  };
  
  // Kullanıcı işlemi modalını aç
  const openActionModal = (user, action) => {
    setSelectedUser(user);
    setActionType(action);
    onOpen();
  };
  
  // İşlem modalının başlığını ve açıklamasını oluştur
  const getModalContent = () => {
    if (!selectedUser || !actionType) return { title: '', description: '' };
    
    switch (actionType) {
      case 'activate':
        return {
          title: 'Kullanıcıyı Aktifleştir',
          description: `${selectedUser.username} kullanıcısını aktifleştirmek istediğinizden emin misiniz?`,
        };
        
      case 'deactivate':
        return {
          title: 'Kullanıcıyı Devre Dışı Bırak',
          description: `${selectedUser.username} kullanıcısını devre dışı bırakmak istediğinizden emin misiniz?`,
        };
        
      case 'makeAdmin':
        return {
          title: 'Admin Yetkisi Ver',
          description: `${selectedUser.username} kullanıcısına admin yetkisi vermek istediğinizden emin misiniz?`,
        };
        
      case 'removeAdmin':
        return {
          title: 'Admin Yetkisini Kaldır',
          description: `${selectedUser.username} kullanıcısından admin yetkisini kaldırmak istediğinizden emin misiniz?`,
        };
        
      default:
        return { title: '', description: '' };
    }
  };
  
  const modalContent = getModalContent();
  
  return (
    <Box p={4}>
      <Heading size="lg" mb={6}>Kullanıcı Yönetimi</Heading>
      
      {/* Arama ve Yenileme */}
      <Flex mb={6} direction={{ base: 'column', sm: 'row' }} justify="space-between" align={{ base: 'stretch', sm: 'center' }}>
        <InputGroup maxW={{ base: '100%', sm: '300px' }} mb={{ base: 4, sm: 0 }}>
          <InputLeftElement pointerEvents="none">
            <SearchIcon color="gray.300" />
          </InputLeftElement>
          <Input
            placeholder="Kullanıcı ara..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </InputGroup>
        
        <Button
          leftIcon={<RepeatIcon />}
          onClick={fetchUsers}
          colorScheme="blue"
          variant="outline"
          isLoading={loading}
        >
          Yenile
        </Button>
      </Flex>
      
      {error && (
        <Alert status="error" mb={6}>
          <AlertIcon />
          {error}
        </Alert>
      )}
      
      {/* Kullanıcı Tablosu */}
      {loading ? (
        <Flex justify="center" align="center" minH="200px">
          <Spinner size="xl" />
        </Flex>
      ) : filteredUsers.length === 0 ? (
        <Box textAlign="center" p={10}>
          <Text fontSize="xl">Kullanıcı bulunamadı</Text>
          <Text mt={2} color="gray.500">
            {searchQuery ? 'Arama kriterlerini değiştirerek tekrar deneyin' : 'Hiç kullanıcı kaydı yok'}
          </Text>
        </Box>
      ) : (
        <Box overflowX="auto">
          <Table variant="simple">
            <Thead>
              <Tr>
                <Th>Kullanıcı</Th>
                <Th>E-posta</Th>
                <Th>Durum</Th>
                <Th>Yetki</Th>
                <Th>İşlemler</Th>
              </Tr>
            </Thead>
            <Tbody>
              {filteredUsers.map((user) => (
                <Tr key={user.id}>
                  <Td>
                    <Flex align="center">
                      <Box mr={3} color="gray.500">
                        <FaUserAlt />
                      </Box>
                      <Box>
                        <Text fontWeight="medium">{user.username}</Text>
                        {user.full_name && (
                          <Text fontSize="sm" color="gray.500">{user.full_name}</Text>
                        )}
                      </Box>
                    </Flex>
                  </Td>
                  <Td>{user.email}</Td>
                  <Td>
                    <Badge colorScheme={user.is_active ? 'green' : 'red'}>
                      {user.is_active ? 'Aktif' : 'Devre dışı'}
                    </Badge>
                  </Td>
                  <Td>
                    <Badge colorScheme={user.is_admin ? 'purple' : 'gray'}>
                      {user.is_admin ? 'Admin' : 'Kullanıcı'}
                    </Badge>
                  </Td>
                  <Td>
                    {/* Kendi hesabıma işlem yapamam */}
                    {user.id !== currentUser?.id ? (
                      <Menu>
                        <MenuButton
                          as={Button}
                          rightIcon={<ChevronDownIcon />}
                          size="sm"
                        >
                          İşlemler
                        </MenuButton>
                        <MenuList>
                          {user.is_active ? (
                            <MenuItem 
                              icon={<FaUserSlash />} 
                              onClick={() => openActionModal(user, 'deactivate')}
                            >
                              Devre Dışı Bırak
                            </MenuItem>
                          ) : (
                            <MenuItem 
                              icon={<FaUserCheck />} 
                              onClick={() => openActionModal(user, 'activate')}
                            >
                              Aktifleştir
                            </MenuItem>
                          )}
                          
                          {user.is_admin ? (
                            <MenuItem 
                              icon={<FaUserAlt />} 
                              onClick={() => openActionModal(user, 'removeAdmin')}
                            >
                              Admin Yetkisini Kaldır
                            </MenuItem>
                          ) : (
                            <MenuItem 
                              icon={<FaUserCog />} 
                              onClick={() => openActionModal(user, 'makeAdmin')}
                            >
                              Admin Yetkisi Ver
                            </MenuItem>
                          )}
                        </MenuList>
                      </Menu>
                    ) : (
                      <Badge>Mevcut Hesap</Badge>
                    )}
                  </Td>
                </Tr>
              ))}
            </Tbody>
          </Table>
        </Box>
      )}
      
      {/* İşlem Onay Modalı */}
      <Modal isOpen={isOpen} onClose={onClose}>
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>{modalContent.title}</ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            <Text>{modalContent.description}</Text>
          </ModalBody>
          <ModalFooter>
            <Button variant="ghost" mr={3} onClick={onClose} isDisabled={actionInProgress}>
              İptal
            </Button>
            <Button 
              colorScheme="blue" 
              onClick={handleUserAction}
              isLoading={actionInProgress}
            >
              Onayla
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </Box>
  );
};

export default UserList;