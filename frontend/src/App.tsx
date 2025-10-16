import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';

import { AuthProvider } from './contexts/AuthContext';
import HomePage from './pages/HomePage';
import { MainLayout } from './components/layout/MainLayout';
import { ProtectedRoute } from './components/ProtectedRoute';
import { UserRole } from './types/common.types';
import DoctorRegister from './pages/doctor/DoctorRegister';
import Login from './pages/auth/Login';
import ForgotPassword from './pages/auth/ForgotPassword';
import ResetPassword from './pages/auth/ResetPassword';
import ChangePassword from './pages/auth/ChangePassword';
import AuthLayout from './components/layout/AuthLayout';
import AuthStatus from './pages/auth/AuthStatus';

export function App() {

  return (
    <AuthProvider>
      <Router>
        <div className="min-h-screen w-full">
          {/* Prioritize Toaster position from develop */}
          <Routes>
            {/* Home page - standalone layout */}
            <Route index element={<HomePage />} />

            {/* Auth routes with shared Header/Footer */}
            <Route element={<AuthLayout />}>
              <Route path="/login" element={<Login />} />
              <Route path="/forgot-password" element={<ForgotPassword />} />
              <Route path="/reset-password" element={<ResetPassword />} />
              <Route path="/auth-status" element={<AuthStatus />} />
            </Route>
            {/* Change password can be protected or linked separately */}
            <Route path="/change-password" element={<ChangePassword />} />

            {/* Main layout routes */}
            <Route path="/app" element={<MainLayout />} />

            {/* Doctor routes */}
            <Route path="/doctor/*" element={
              <ProtectedRoute requiredRoles={[UserRole.DOCTOR]}>
                <Routes>
                  <Route index element={<Navigate to="dashboard" replace />} />
                  <Route path="dashboard" element={<div>Doctor Dashboard</div>} />
                  <Route path="register" element={<DoctorRegister />} />
                </Routes>
              </ProtectedRoute>
            } />
          </Routes>
        </div>
      </Router>
    </AuthProvider>
  )
}


