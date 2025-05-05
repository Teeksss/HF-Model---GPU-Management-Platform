import React, { useState, useEffect } from 'react';
import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { Box, Flex, useDisclosure } from '@chakra-ui/react';

// Layouts
import Navbar from './components/Layout/Navbar';
import Sidebar from './components/Layout/Sidebar';

// Kimlik doğrulama
import { AuthProvider, useAuth } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
import Login from './components/Auth/Login';
import Register from './components/Auth/Register';

// Ana bileşenler
import Dashboard from './components/Dashboard/Dashboard';
import ModelList from './components/ModelManagement/ModelList';
import AddModel from './components/ModelManagement/AddModel';
import ModelDetail from './components/ModelManagement/ModelDetail';
import GPUMonitor from './components/GPUMonitoring/GPUMonitor';
import UserList from './components/UserManagement/UserList';
import UserProfile from './components/UserManagement/UserProfile';
import SystemStats from './components/Statistics/SystemStats';
import NotFound from './components/NotFound';
import ErrorBoundary from './components/ErrorBoundary';

// Korumalı Route bileşeni
const ProtectedRoute = ({ children, requireAdmin = false }) => {
  const { isAuthenticated, user, loading } = useAuth();

  // Kullanıcı bilgileri yükleniyorsa bekleme ekranı göster
  if (loading) {
    return <Box p={5}>Yükleniyor...</Box>;
  }

  // Kimlik doğrulama kontrolü
  if (!isAuthenticated) {
    return <Navigate to="/login" />;
  }

  // Admin kontrolü
  if (requireAdmin && (!user || !user.is_admin)) {
    return <Navigate to="/dashboard" />;
  }

  return children;
};

const AppContent = () => {
  const { isOpen, onOpen, onClose } = useDisclosure();
  const location = useLocation();
  const { isAuthenticated } = useAuth();

  // Sayfa değiştiğinde mobil menüyü kapat
  useEffect(() => {
    if (isOpen) {
      onClose();
    }
  }, [location.pathname, isOpen, onClose]);

  return (
    <Box minH="100vh">
      <Navbar toggleSidebar={isOpen ? onClose : onOpen} />
      <Flex>
        {isAuthenticated && (
          <Box
            transition="margin-left 0.3s"
            ml={{ base: 0, md: isOpen ? '250px' : 0 }}
            position="relative"
            zIndex="1"
          >
            <Sidebar isOpen={isOpen} />
          </Box>
        )}
        <Box
          width="100%"
          ml={{ base: 0, md: isOpen ? '250px' : 0 }}
          transition="margin-left 0.3s"
          pt={4}
          pb={8}
          minH="calc(100vh - 4rem)"
          bg="gray.50"
          _dark={{ bg: 'gray.800' }}
        >
          <ErrorBoundary>
            <Routes>
              {/* Public routes */}
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />

              {/* Protected routes */}
              <Route path="/" element={<Navigate to="/dashboard" replace />} />
              
              <Route 
                path="/dashboard" 
                element={
                  <ProtectedRoute>
                    <Dashboard />
                  </ProtectedRoute>
                } 
              />
              
              <Route 
                path="/models" 
                element={
                  <ProtectedRoute>
                    <ModelList />
                  </ProtectedRoute>
                } 
              />
              
              <Route 
                path="/models/add" 
                element={
                  <ProtectedRoute>
                    <AddModel />
                  </ProtectedRoute>
                } 
              />
              
              <Route 
                path="/models/:modelId" 
                element={
                  <ProtectedRoute>
                    <ModelDetail />
                  </ProtectedRoute>
                } 
              />
              
              <Route 
                path="/gpu-monitor" 
                element={
                  <ProtectedRoute>
                    <GPUMonitor />
                  </ProtectedRoute>
                } 
              />
              
              <Route 
                path="/profile" 
                element={
                  <ProtectedRoute>
                    <UserProfile />
                  </ProtectedRoute>
                } 
              />
              
              {/* Admin routes */}
              <Route 
                path="/users" 
                element={
                  <ProtectedRoute requireAdmin={true}>
                    <UserList />
                  </ProtectedRoute>
                } 
              />
              
              <Route 
                path="/stats" 
                element={
                  <ProtectedRoute requireAdmin={true}>
                    <SystemStats />
                  </ProtectedRoute>
                } 
              />
              
              {/* 404 Page */}
              <Route path="*" element={<NotFound />} />
            </Routes>
          </ErrorBoundary>
        </Box>
      </Flex>
    </Box>
  );
};

const App = () => {
  return (
    <AuthProvider>
      <ThemeProvider>
        <AppContent />
      </ThemeProvider>
    </AuthProvider>
  );
};

export default App;