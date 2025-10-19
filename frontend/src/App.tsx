import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { ProtectedRoute, PublicRoute } from './components/ProtectedRoute';
import { MainLayout } from './components/layout/MainLayout';
import { UserRole } from './types/common.types';

// Pages
import { HomePage } from './pages/HomePage';
import Login from './pages/auth/Login';
import { Register } from './pages/auth/Register';
import { PatientRegister } from './pages/auth/PatientRegister';
import { Unauthorized } from './pages/Unauthorized';

// Dashboard pages  
import { AdminDashboard } from './pages/admin/AdminDashboard';
import { ManageDashboard } from './pages/manager/ManageDashboard';
import { DoctorRegister } from './pages/doctor/DoctorRegister';
import { AIChatBot } from './pages/ai/AIChatBot';
import { PatientDashboard } from './pages/patient/patientdashboard';
import { PatientProfile } from './pages/patient/patientProfile';
import DoctorBooking from './pages/patient/DoctorBooking';

export function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          {/* Public routes - redirect if authenticated */}
          <Route path="/login" element={
            <PublicRoute>
              <Login />
            </PublicRoute>
          } />
          <Route path="/register" element={
            <PublicRoute>
              <Register />
            </PublicRoute>
          } />
          <Route path="/patient-register" element={
            <PublicRoute>
              <PatientRegister />
            </PublicRoute>
          } />

          {/* Home page - standalone layout */}
          <Route index element={<HomePage />} />
          
          {/* Main layout routes */}
          <Route path="/app" element={<MainLayout />}> 

            {/* Protected routes */}
            <Route path="dashboard" element={
              <ProtectedRoute>
                <DashboardRedirect />
              </ProtectedRoute>
            } />

            {/* Admin routes */}
            <Route path="admin/*" element={
              <ProtectedRoute requiredRoles={[UserRole.ADMIN]}>
                <AdminDashboard />
              </ProtectedRoute>
            } />

            {/* Manager routes */}
            <Route path="manager/*" element={
              <ProtectedRoute requiredRoles={[UserRole.MANAGER, UserRole.ADMIN]}>
                <ManageDashboard />
              </ProtectedRoute>
            } />

            {/* Doctor routes */}
            <Route path="doctor/*" element={
              <ProtectedRoute requiredRoles={[UserRole.DOCTOR]}>
                <Routes>
                  <Route index element={<Navigate to="dashboard" replace />} />
                  <Route path="dashboard" element={<div>Doctor Dashboard</div>} />
                  <Route path="register" element={<DoctorRegister />} />
                </Routes>
              </ProtectedRoute>
            } />

            {/* Public booking route - anyone can view */}
            <Route path="booking" element={<DoctorBooking />} />
            <Route path="booking/:doctorId" element={<div>Booking Details</div>} />

            {/* Patient routes */}
            <Route path="patient/*" element={
              <ProtectedRoute requiredRoles={[UserRole.PATIENT]}>
                <Routes>
                  <Route index element={<Navigate to="dashboard" replace />} />
                  <Route path="dashboard" element={<PatientDashboard />} />
                  <Route path="profile" element={<PatientProfile />} />
                </Routes>
              </ProtectedRoute>
            } />

            {/* AI Chat Bot */}
            <Route path="ai-chat" element={
              <ProtectedRoute>
                <AIChatBot />
              </ProtectedRoute>
            } />

            {/* Error routes */}
            <Route path="unauthorized" element={<Unauthorized />} />
            <Route path="*" element={<NotFound />} />
          </Route>
        </Routes>
      </Router>
    </AuthProvider>
  );
}

// Component to redirect to appropriate dashboard based on role
const DashboardRedirect: React.FC = () => {
  const userRole = JSON.parse(localStorage.getItem('userData') || '{}')?.role;
  
  switch (userRole) {
    case UserRole.ADMIN:
      return <Navigate to="/app/admin" replace />;
    case UserRole.MANAGER:
      return <Navigate to="/app/manager" replace />;
    case UserRole.DOCTOR:
      return <Navigate to="/app/doctor" replace />;
    case UserRole.PATIENT:
      return <Navigate to="/app/patient" replace />;
    default:
      return <Navigate to="/" replace />;
  }
};

// 404 Not Found component
const NotFound: React.FC = () => (
  <div className="min-h-screen flex items-center justify-center bg-gray-50">
    <div className="text-center">
      <h1 className="text-6xl font-bold text-gray-900">404</h1>
      <p className="text-xl text-gray-600 mt-4">Trang không tồn tại</p>
      <a
        href="/"
        className="mt-6 inline-block bg-blue-600 text-white px-6 py-2 rounded-md hover:bg-blue-700"
      >
        Về trang chủ
      </a>
    </div>
  </div>
);