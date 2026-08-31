/**
 * frontend/src/App.jsx
 * Root application component configuring React Router, Auth Provider, and Theme Provider.
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

function ProtectedRoute({ children }) {
  const { token, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-theme-base flex items-center justify-center text-theme-muted text-body-sm animate-pulse">
        Initializing RazorRecover secure session...
      </div>
    );
  }

  if (!token) {
    return <Navigate to="/login" replace />;
  }

  return children;
}

export default function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/login" element={<LoginPage />} />

            <Route
              path="/"
              element={
                <ProtectedRoute>
                  <DashboardLayout />
                </ProtectedRoute>
              }
            >
              <Route index element={<OverviewPage />} />
              <Route path="cases" element={<RecoveryCasesPage />} />
              <Route path="cases/:id" element={<CaseDetailPage />} />
              <Route path="review-queue" element={<ReviewQueuePage />} />
              <Route path="payments" element={<PaymentsPage />} />
              <Route path="simulator" element={<SimulatorPage />} />
            </Route>

            {/* Catch-all redirect */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </ThemeProvider>
  );
}
