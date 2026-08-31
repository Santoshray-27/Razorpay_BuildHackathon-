/**
 * frontend/src/api/client.js
 * Configured Axios HTTP client for communication with RazorRecover backend API.
 */

import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api';

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json'
  },
  timeout: 10000
});

// Attach Authorization header if token exists in localStorage
apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem('razorrecover_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
}, (error) => {
  return Promise.reject(error);
});

// Intercept responses for global error handling
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Auto cleanup token on unauthorized response
      localStorage.removeItem('razorrecover_token');
    }
    return Promise.reject(error);
  }
);
