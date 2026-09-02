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
  timeout: 15000
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
    if (
      error.response?.status === 401 &&
      !error.config?.url?.includes('/auth/login') &&
      !error.config?.url?.includes('/auth/register')
    ) {
      localStorage.removeItem('razorrecover_token');
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('auth:unauthorized'));
      }
    }
    return Promise.reject(error);
  }
);
