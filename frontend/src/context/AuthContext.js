import React, { createContext, useState, useContext, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { isAuthenticated, getUserData, clearTokens } from '../services/auth';

// Auth context
const AuthContext = createContext({
  isAuthenticated: false,
  user: null,
  loading: true,
  logout: () => {},
});

// Auth provider bileşeni
export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [authChecked, setAuthChecked] = useState(false);
  const navigate = useNavigate();

  // Sayfa yüklendiğinde kimlik doğrulama durumunu kontrol et
  useEffect(() => {
    const checkAuth = () => {
      const authenticated = isAuthenticated();
      if (authenticated) {
        const userData = getUserData();
        setUser(userData);
      } else {
        setUser(null);
      }
      setLoading(false);
      setAuthChecked(true);
    };

    checkAuth();
  }, []);

  // Kullanıcı çıkışı
  const logout = () => {
    clearTokens();
    setUser(null);
    navigate('/login');
  };

  return (
    <AuthContext.Provider
      value={{
        isAuthenticated: !!user,
        user,
        loading,
        logout,
      }}
    >
      {!loading || authChecked ? children : null}
    </AuthContext.Provider>
  );
};

// Auth context için custom hook
export const useAuth = () => useContext(AuthContext);