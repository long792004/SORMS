import axios from 'axios';
import { useAuthStore } from '../store/authStore';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api';

const API_ORIGIN = import.meta.env.VITE_API_ORIGIN
  || (API_BASE_URL.startsWith('http') ? API_BASE_URL.replace(/\/api\/?$/, '') : 'http://localhost:5183');

export const buildImageUrl = (imagePath?: string | null) => {
  if (!imagePath) return '';
  if (imagePath.startsWith('http://') || imagePath.startsWith('https://')) return imagePath;
  return `${API_ORIGIN}${imagePath}`;
};

const client = axios.create({
  baseURL: API_BASE_URL,
  headers: { 'Content-Type': 'application/json' },
});

// Request interceptor — attach JWT
client.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  
  // 🔍 DEBUG: Log if token exists
  if (!token && !config.url?.includes('/Auth/login') && !config.url?.includes('/Auth/register')) {
    console.warn(`⚠️ No token for request: ${config.method?.toUpperCase()} ${config.url}`);
  }
  
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
    console.log(`✅ Token attached to: ${config.method?.toUpperCase()} ${config.url}`);
  }
  
  return config;
});

// Response interceptor — handle errors
client.interceptors.response.use(
  (response) => {
    console.log(`✅ Response OK: ${response.config.method?.toUpperCase()} ${response.config.url}`);
    return response;
  },
  (error) => {
    const status = error.response?.status;
    const url = error.config?.url;
    
    console.error(`❌ Error ${status}: ${error.config?.method?.toUpperCase()} ${url}`, error.response?.data);
    
    if (status === 401) {
      // Token is invalid/expired → clear auth and redirect to login
      console.warn('🔴 401 Unauthorized - Clearing auth and redirecting to login');
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      useAuthStore.setState({ token: null, user: null, isAuthenticated: false });
      window.location.href = '/login';
    }
    
    if (status === 403) {
      // User doesn't have permission for this endpoint
      console.warn(`⚠️ 403 Forbidden - User lacks permission for ${url}`);
      // Don't redirect, let the component handle it
    }
    
    return Promise.reject(error);
  }
);

export default client;
