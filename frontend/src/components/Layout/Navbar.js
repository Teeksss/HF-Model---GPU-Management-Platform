import React from 'react';
import {
  Box,
  Flex,
  IconButton,
  Button,
  Text,
  HStack,
  Menu,
  MenuButton,
  MenuList,
  MenuItem,
  MenuDivider,
  useColorMode,
  useColorModeValue,
  Avatar,
  useBreakpointValue,
  Tooltip,
} from '@chakra-ui/react';
import {
  HamburgerIcon,
  CloseIcon,
  MoonIcon,
  SunIcon,
  ChevronDownIcon,
} from '@chakra-ui/icons';
import { Link, useNavigate } from 'react-router-dom';
import { clearTokens, getUserData, isAuthenticated } from '../../services/auth';

const Navbar = ({ toggleSidebar }) => {
  const { colorMode, toggleColorMode } = useColorMode();
  const navigate = useNavigate();
  const userData = getUserData();
  const isAuth = isAuthenticated();
  
  const bgColor = useColorModeValue('white', 'gray.800');
  const borderColor = useColorModeValue('gray.200', 'gray.700');
  
  const isMobile = useBreakpointValue({ base: true, md: false });
  
  const handleLogout = () => {
    clearTokens();
    navigate('/login');
  };
  
  return (
    <Box
      bg={bgColor}
      borderBottom="1px"
      borderColor={borderColor}
      px={4}
      position="sticky"
      top={0}
      zIndex={10}
    >
      <Flex h={16} alignItems="center" justifyContent="space-between">
        <HStack spacing={4} alignItems="center">
          {isAuth && (
            <IconButton
              variant="ghost"
              icon={<HamburgerIcon />}
              onClick={toggleSidebar}
              aria-label="Sidebar Aç/Kapat"
              size="md"
            />
          )}
          
          <Link to="/">
            <Flex alignItems="center">
              <Text
                fontWeight="bold"
                fontSize="lg"
                bgGradient="linear(to-r, blue.400, teal.400)"
                bgClip="text"
              >
                AI Model Platform
              </Text>
            </Flex>
          </Link>
        </HStack>
        
        <HStack spacing={4}>
          <Tooltip label={colorMode === 'light' ? 'Koyu Tema' : 'Açık Tema'}>
            <IconButton
              size="md"
              fontSize="lg"
              aria-label={colorMode === 'light' ? 'Koyu Tema' : 'Açık Tema'}
              variant="ghost"
              color="current"
              onClick={toggleColorMode}
              icon={colorMode === 'light' ? <MoonIcon /> : <SunIcon />}
            />
          </Tooltip>
          
          {isAuth ? (
            <Menu>
              <MenuButton
                as={Button}
                variant="ghost"
                rightIcon={<ChevronDownIcon />}
                py={2}
              >
                <Flex alignItems="center">
                  <Avatar
                    size="sm"
                    name={userData?.full_name || userData?.username || 'User'}
                    mr={2}
                  />
                  {!isMobile && (
                    <Text>{userData?.full_name || userData?.username || 'Kullanıcı'}</Text>
                  )}
                </Flex>
              </MenuButton>
              <MenuList>
                <MenuItem onClick={() => navigate('/profile')}>Profil</MenuItem>
                <MenuItem onClick={() => navigate('/models')}>Modellerim</MenuItem>
                {userData?.is_admin && (
                  <MenuItem onClick={() => navigate('/users')}>Kullanıcı Yönetimi</MenuItem>
                )}
                <MenuDivider />
                <MenuItem onClick={handleLogout}>Çıkış Yap</MenuItem>
              </MenuList>
            </Menu>
          ) : (
            <Button variant="solid" colorScheme="blue" onClick={() => navigate('/login')}>
              Giriş Yap
            </Button>
          )}
        </HStack>
      </Flex>
    </Box>
  );
};

export default Navbar;