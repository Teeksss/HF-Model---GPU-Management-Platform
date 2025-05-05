import axios from 'axios';
import { getToken, clearTokens } from './auth';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:8000';

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor - her istekte token ekle
api.interceptors.request.use(
  (config) => {
    const token = getToken();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor - 401 hata durumunda kullanıcıyı logout yap
api.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    if (error.response && error.response.status === 401) {
      // Eğer bir 401 hatası (Unauthorized) alırsak token'ı temizle ve login sayfasına yönlendir
      clearTokens();
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export default api;