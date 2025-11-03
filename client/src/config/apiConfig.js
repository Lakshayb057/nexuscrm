import axios from 'axios';

// Use environment variable or fallback to production API URL
export const API_BASE_URL = process.env.REACT_APP_API_URL || 'https://nexuscrm.onrender.com/api';

// Create and configure axios instance
const createApiInstance = () => {
  const instance = axios.create({
    baseURL: API_BASE_URL,
    withCredentials: true,
    headers: {
      'Content-Type': 'application/json',
    },
    timeout: 10000, // 10 seconds timeout
  });

  // Request interceptor for adding auth token
  instance.interceptors.request.use(
    (config) => {
      const token = localStorage.getItem('token');
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
      return config;
    },
    (error) => {
      return Promise.reject(error);
    }
  );

  // Response interceptor for handling common errors
  instance.interceptors.response.use(
    (response) => response,
    (error) => {
      // Handle common errors here (e.g., 401 Unauthorized)
      if (error.response?.status === 401) {
        // Handle unauthorized access (e.g., redirect to login)
        localStorage.removeItem('token');
        window.location.href = '/login';
      }
      return Promise.reject(error);
    }
  );

  return instance;
};

// Create and export the API instance
const api = createApiInstance();

export default api;
