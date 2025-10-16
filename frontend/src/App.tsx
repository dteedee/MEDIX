import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';

import { AuthProvider } from './contexts/AuthContext';
import HomePage from './pages/HomePage';
import { MainLayout } from './components/layout/MainLayout';
import { ProtectedRoute, PublicRoute } from './components/ProtectedRoute';
import { UserRole } from './types/common.types';
import DoctorRegister from './pages/doctor/DoctorRegister';

export function App() {

  return (
    <AuthProvider>
      <Router>
        <div className="min-h-screen w-full">
          {/* Prioritize Toaster position from develop */}
          <Routes>
            {/* Home page - standalone layout */}
            <Route index element={<HomePage />} />

            {/* Main layout routes */}
            <Route path="/app" element={<MainLayout />} />

            {/* Public route for doctor registration */}
            <Route path="/doctor/register" element={
              <PublicRoute>
                <DoctorRegister />
              </PublicRoute>
            } />

            {/* Protected doctor routes */}
            <Route path="/doctor/*" element={
              <ProtectedRoute requiredRoles={[UserRole.DOCTOR]}>
                <Routes>
                  <Route index element={<Navigate to="dashboard" replace />} />
                  <Route path="dashboard" element={<div>Doctor Dashboard</div>} />
                </Routes>
              </ProtectedRoute>
            } />
          </Routes>
        </div>
      </Router>
    </AuthProvider>
  )
}


