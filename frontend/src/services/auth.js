// Token yönetimi ve kimlik doğrulama işlevleri

// Token saklama anahtarları
const ACCESS_TOKEN_KEY = 'access_token';
const USER_DATA_KEY = 'user_data';

/**
 * Token'ı local storage'a kaydet
 * @param {string} token JWT Token
 */
export const setToken = (token) => {
  localStorage.setItem(ACCESS_TOKEN_KEY, token);
};

/**
 * Local storage'dan token'ı al
 * @returns {string|null} JWT Token
 */
export const getToken = () => {
  return localStorage.getItem(ACCESS_TOKEN_KEY);
};

/**
 * Local storage'dan token'ı sil
 */
export const removeToken = () => {
  localStorage.removeItem(ACCESS_TOKEN_KEY);
};

/**
 * Kullanıcı verilerini local storage'a kaydet
 * @param {Object} userData Kullanıcı verileri
 */
export const setUserData = (userData) => {
  localStorage.setItem(USER_DATA_KEY, JSON.stringify(userData));
};

/**
 * Local storage'dan kullanıcı verilerini al
 * @returns {Object|null} Kullanıcı verileri
 */
export const getUserData = () => {
  const userData = localStorage.getItem(USER_DATA_KEY);
  return userData ? JSON.parse(userData) : null;
};

/**
 * Local storage'dan kullanıcı verilerini sil
 */
export const removeUserData = () => {
  localStorage.removeItem(USER_DATA_KEY);
};

/**
 * Kullanıcının giriş yapmış olup olmadığını kontrol et
 * @returns {boolean} Giriş yapmış mı
 */
export const isAuthenticated = () => {
  const token = getToken();
  return !!token;
};

/**
 * Kullanıcının admin olup olmadığını kontrol et
 * @returns {boolean} Admin mi
 */
export const isAdmin = () => {
  const userData = getUserData();
  return userData && userData.is_admin === true;
};

/**
 * Tüm kimlik doğrulama verilerini temizle
 */
export const clearTokens = () => {
  removeToken();
  removeUserData();
};