import React from 'react';
import {
  Box,
  Flex,
  VStack,
  Text,
  Icon,
  useColorModeValue,
  Divider,
  Tooltip,
} from '@chakra-ui/react';
import { Link, useLocation } from 'react-router-dom';
import {
  FaHome,
  FaBrain,
  FaMicrochip,
  FaUsers,
  FaUserCog,
  FaChartLine,
} from 'react-icons/fa';
import { getUserData, isAdmin } from '../../services/auth';

// Sidebar öğeleri
const SidebarItems = [
  { name: 'Dashboard', icon: FaHome, path: '/dashboard' },
  { name: 'Model Yönetimi', icon: FaBrain, path: '/models' },
  { name: 'GPU İzleme', icon: FaMicrochip, path: '/gpu-monitor' },
];

// Admin öğeleri
const AdminItems = [
  { name: 'Kullanıcı Yönetimi', icon: FaUsers, path: '/users' },
  { name: 'İstatistikler', icon: FaChartLine, path: '/stats' },
];

const Sidebar = ({ isOpen }) => {
  const location = useLocation();
  const userData = getUserData();
  const userIsAdmin = isAdmin();
  
  const bgColor = useColorModeValue('white', 'gray.800');
  const borderColor = useColorModeValue('gray.200', 'gray.700');
  
  return (
    <Box
      position="fixed"
      left={0}
      h="calc(100vh - 4rem)"
      w="250px"
      bg={bgColor}
      borderRight="1px"
      borderColor={borderColor}
      transform={isOpen ? 'translateX(0)' : 'translateX(-100%)'}
      transition="transform 0.3s"
      zIndex={5}
      pt={4}
      overflowY="auto"
    >
      <VStack spacing={1} align="stretch">
        {SidebarItems.map((item) => (
          <NavItem
            key={item.name}
            icon={item.icon}
            path={item.path}
            active={location.pathname === item.path}
          >
            {item.name}
          </NavItem>
        ))}
        
        {userIsAdmin && (
          <>
            <Divider my={2} />
            <Text
              px={4}
              fontSize="xs"
              fontWeight="semibold"
              textTransform="uppercase"
              color="gray.500"
              mb={1}
            >
              Admin
            </Text>
            
            {AdminItems.map((item) => (
              <NavItem
                key={item.name}
                icon={item.icon}
                path={item.path}
                active={location.pathname === item.path}
              >
                {item.name}
              </NavItem>
            ))}
          </>
        )}
        
        <Divider my={2} />
        <NavItem
          icon={FaUserCog}
          path="/profile"
          active={location.pathname === '/profile'}
        >
          Profil
        </NavItem>
      </VStack>
      
      <Flex
        position="absolute"
        bottom={0}
        left={0}
        right={0}
        p={4}
        flexDirection="column"
        alignItems="flex-start"
      >
        <Text fontSize="xs" color="gray.500">
          Oturum açık:
        </Text>
        <Text fontSize="sm" fontWeight="medium">
          {userData?.full_name || userData?.username || 'Kullanıcı'}
        </Text>
      </Flex>
    </Box>
  );
};

// Sidebar öğesi
const NavItem = ({ icon, children, path, active }) => {
  const activeColor = useColorModeValue('blue.500', 'blue.300');
  const hoverBg = useColorModeValue('gray.100', 'gray.700');
  const activeBg = useColorModeValue('blue.50', 'gray.700');
  
  return (
    <Tooltip label={children} placement="right" openDelay={500}>
      <Link to={path}>
        <Flex
          align="center"
          p="4"
          mx="2"
          borderRadius="lg"
          role="group"
          cursor="pointer"
          bg={active ? activeBg : 'transparent'}
          color={active ? activeColor : 'inherit'}
          _hover={{
            bg: hoverBg,
          }}
        >
          {icon && (
            <Icon
              mr="4"
              fontSize="16"
              as={icon}
              color={active ? activeColor : 'inherit'}
            />
          )}
          {children}
        </Flex>
      </Link>
    </Tooltip>
  );
};

export default Sidebar;