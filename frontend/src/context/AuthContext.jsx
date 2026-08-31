/**
 * frontend/src/context/AuthContext.jsx
 * Authentication state provider with auto-token management and 1-click Demo credentials login.
 */

import React, { createContext, useContext, useState, useEffect } from 'react';
import { apiClient } from '../api/client';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('razorrecover_token'));
  const [loading, setLoading] = useState(true);

  // Fetch current user on startup if token exists
  useEffect(() => {
    async function loadUser() {
      if (!token) {
        setUser(null);
        setLoading(false);
        return;
      }
      try {
        const res = await apiClient.get('/auth/me');
        setUser(res.data.data.user);
      } catch (err) {
        localStorage.removeItem('razorrecover_token');
        setToken(null);
        setUser(null);
      } finally {
        setLoading(false);
      }
    }
    loadUser();
  }, [token]);

  const login = async (email, password) => {
    const res = await apiClient.post('/auth/login', { email, password });
    const { token: receivedToken, user: receivedUser } = res.data.data;
    localStorage.setItem('razorrecover_token', receivedToken);
    setToken(receivedToken);
    setUser(receivedUser);
    return receivedUser;
  };

  const register = async (name, email, password, role = 'merchant_admin') => {
    const res = await apiClient.post('/auth/register', { name, email, password, role });
    const { token: receivedToken, user: receivedUser } = res.data.data;
    localStorage.setItem('razorrecover_token', receivedToken);
    setToken(receivedToken);
    setUser(receivedUser);
    return receivedUser;
  };

  const logout = () => {
    localStorage.removeItem('razorrecover_token');
    setToken(null);
    setUser(null);
  };

  // Demo Login Helper: Auto registers or logs into default demo merchant
  const demoLogin = async (role = 'merchant_admin') => {
    const email = role === 'merchant_admin' ? 'admin@demo-merchant.internal' : 'operator@demo-merchant.internal';
    const password = 'DemoPassword2026!';
    try {
      return await login(email, password);
    } catch (loginErr) {
      // If demo user doesn't exist yet, auto-register
      return await register('Demo Merchant Owner', email, password, role);
    }
  };

  return (
    <AuthContext.Provider value={{ user, token, loading, login, register, logout, demoLogin }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
