/**
 * frontend/src/App.jsx
 * Root application component configuring React Router, Auth Provider, and Protected/Public routes.
 */

import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
import DashboardLayout from './layouts/DashboardLayout';
import LoginPage from './pages/LoginPage';
import OverviewPage from './pages/OverviewPage';
import RecoveryCasesPage from './pages/RecoveryCasesPage';
import CaseDetailPage from './pages/CaseDetailPage';
import ReviewQueuePage from './pages/ReviewQueuePage';
import PaymentsPage from './pages/PaymentsPage';
import SimulatorPage from './pages/SimulatorPage';
import SettingsPage from './pages/SettingsPage';

function ProtectedRoute({ children }) {
  const { token, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-theme-base flex items-center justify-center text-theme-secondary text-body-sm font-medium animate-pulse">
        Initializing RazorRecover secure session...
      </div>
    );
  }

  if (!token) {
    return <Navigate to="/login" replace />;
  }

  return children;
}

function PublicAuthRoute({ children }) {
  const { token, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-theme-base flex items-center justify-center text-theme-secondary text-body-sm font-medium animate-pulse">
        Initializing RazorRecover secure session...
      </div>
    );
  }

  if (token) {
    return <Navigate to="/dashboard" replace />;
  }

  return children;
}

export default function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <BrowserRouter>
          <Routes>
            {/* Public Authentication Routes */}
            <Route
              path="/login"
              element={
                <PublicAuthRoute>
                  <LoginPage />
                </PublicAuthRoute>
              }
            />
            <Route
              path="/register"
              element={
                <PublicAuthRoute>
                  <LoginPage />
                </PublicAuthRoute>
              }
            />

            {/* Protected Merchant Application Routes */}
            <Route
              path="/"
              element={
                <ProtectedRoute>
                  <DashboardLayout />
                </ProtectedRoute>
              }
            >
              <Route index element={<Navigate to="/dashboard" replace />} />
              <Route path="dashboard" element={<OverviewPage />} />
              <Route path="analytics" element={<Navigate to="/dashboard" replace />} />
              <Route path="overview" element={<Navigate to="/dashboard" replace />} />
              <Route path="cases" element={<RecoveryCasesPage />} />
              <Route path="cases/:id" element={<CaseDetailPage />} />
              <Route path="review-queue" element={<ReviewQueuePage />} />
              <Route path="review" element={<Navigate to="/review-queue" replace />} />
              <Route path="payments" element={<PaymentsPage />} />
              <Route path="simulator" element={<SimulatorPage />} />
              <Route path="settings" element={<SettingsPage />} />
            </Route>

            {/* Catch-all redirect to Dashboard (or login via ProtectedRoute) */}
            <Route path="*" element={<Navigate to="/dashboard" replace />} />
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </ThemeProvider>
  );
}
