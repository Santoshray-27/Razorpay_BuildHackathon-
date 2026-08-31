/**
 * frontend/src/App.jsx
 * Root application component configuring React Router and Auth Provider guards.
 */

import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import DashboardLayout from './layouts/DashboardLayout';
import LoginPage from './pages/LoginPage';
import OverviewPage from './pages/OverviewPage';
import RecoveryCasesPage from './pages/RecoveryCasesPage';
import CaseDetailPage from './pages/CaseDetailPage';
import ReviewQueuePage from './pages/ReviewQueuePage';
import PaymentsPage from './pages/PaymentsPage';

function ProtectedRoute({ children }) {
  const { token, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center text-slate-400 text-xs animate-pulse">
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
          </Route>

          {/* Catch-all redirect */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
