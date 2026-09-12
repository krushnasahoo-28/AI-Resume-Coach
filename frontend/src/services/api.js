import axios from 'axios';

// Priority: VITE_API_URL -> VITE_API_BASE_URL -> safe fallback
const rawApiUrl = (import.meta.env.VITE_API_URL || import.meta.env.VITE_API_BASE_URL || 'http://127.0.0.1:8000').replace(/\/+$/, '');

// Extract root server URL for health check
export const SERVER_ROOT = rawApiUrl.replace(/\/api$/, '');
export const API_BASE_URL = `${SERVER_ROOT}/api`;

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Interceptor to add JWT token if available
apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
}, (error) => {
  return Promise.reject(error);
});

export const checkHealth = async () => {
  try {
    const response = await axios.get(`${SERVER_ROOT}/health`);
    return { ...response.data, url: `${SERVER_ROOT}/health` };
  } catch (error) {
    console.error('Backend health check error:', error);
    throw error;
  }
};

export default apiClient;

