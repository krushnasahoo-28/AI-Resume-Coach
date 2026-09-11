import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'https://ai-resume-coach-furf.onrender.com/api';
// Extract root server URL for health check
const SERVER_ROOT = API_BASE_URL.replace(/\/api\/?$/, '');

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
    return response.data;
  } catch (error) {
    console.error('Backend health check error:', error);
    throw error;
  }
};

export default apiClient;
