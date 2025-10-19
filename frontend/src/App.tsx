import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { ProtectedRoute, PublicRoute } from './components/ProtectedRoute';
import { MainLayout } from './components/layout/MainLayout';
import { UserRole } from './types/common.types';

// Pages
import HomePage from './pages/HomePage';
import Login from './pages/auth/Login';
import { Register } from './pages/auth/Register';
import { PatientRegister } from './pages/auth/PatientRegister';
import ForgotPassword from './pages/auth/ForgotPassword';
import ResetPassword from './pages/auth/ResetPassword';
import ChangePassword from './pages/auth/ChangePassword';
import AuthLayout from './components/layout/AuthLayout';
import AuthStatus from './pages/auth/AuthStatus';
import { Unauthorized } from './pages/Unauthorized';

// Dashboard pages  
import { AdminDashboard } from './pages/admin/AdminDashboard';
import { ManageDashboard } from './pages/manager/ManageDashboard';
import DoctorRegister from './pages/doctor/DoctorRegister';
import { AIChatBot } from './pages/ai/AIChatBot';
import { PatientDashboard } from './pages/patient/patientdashboard';
import { PatientProfile } from './pages/patient/patientProfile';
import DoctorDetails from './pages/doctor/DoctorDetails';
import DoctorProfileEdit from './pages/doctor/DoctorProfileEdit';

export function App() {
  return (
    <AuthProvider>
      <Router>
        <div className="min-h-screen w-full">
          <Routes>
            {/* Public routes */}
            <Route element={<AuthLayout />}>
              <Route path="/login" element={<PublicRoute><Login /></PublicRoute>} />
              <Route path="/patient-register" element={<PublicRoute><PatientRegister /></PublicRoute>} />
              <Route path="/forgot-password" element={<PublicRoute><ForgotPassword /></PublicRoute>} />
              <Route path="/reset-password" element={<PublicRoute><ResetPassword /></PublicRoute>} />
              <Route path="/auth-status" element={<PublicRoute><AuthStatus /></PublicRoute>} />
            </Route>

            {/* Change password route (can be protected) */}
            <Route path="/change-password" element={<ChangePassword />} />

            {/* Doctor public routes */}
            <Route path="/doctor/*" element={
              <PublicRoute>
                <Routes>
                  <Route path="register" element={<DoctorRegister />} />
                  <Route path="details/:username" element={<DoctorDetails />} />
                  <Route path="profile/edit" element={<DoctorProfileEdit />} />
                </Routes>
              </PublicRoute>
            } />

            {/* Home page */}
            <Route index element={<HomePage />} />

            {/* Main layout */}
            <Route path="/app" element={<MainLayout />}>
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

              {/* Error pages */}
              <Route path="unauthorized" element={<Unauthorized />} />
              <Route path="*" element={<NotFound />} />
            </Route>
          </Routes>
        </div>
      </Router>
    </AuthProvider>
  );
}

// Redirect to role-based dashboard
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

// 404 page
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
