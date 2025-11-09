import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { ToastProvider } from './contexts/ToastContext';
import { LanguageProvider } from './contexts/LanguageContext';
import { ProtectedRoute, PublicRoute } from './components/ProtectedRoute';
import { MainLayout } from './components/layout/MainLayout';
import { UserRole } from './types/common.types';

// Layout
import { Header } from './components/layout/Header';
import Footer from './components/layout/Footer';
import Sidebar from './components/layout/Sidebar';
import AdminLayout from './components/layout/AdminLayout';
import PatientLayout from './components/layout/PatientLayout';
import ManagerLayout from './components/layout/ManagerLayout';
import DoctorLayout from './components/layout/DoctorLayout';
import PublicLayout from './components/layout/PublicLayout';

// Auth pages
import HomePage from './pages/public/HomePage';
import Login from './pages/auth/Login';
import { PatientRegister } from './pages/auth/PatientRegister';
import ForgotPassword from './pages/auth/ForgotPassword';
import ResetPassword from './pages/auth/ResetPassword';
import { ChangePasswordModal } from './pages/auth/ChangePasswordModal';
import AuthLayout from './components/layout/AuthLayout';
import AuthStatus from './pages/auth/AuthStatus';
import { Unauthorized } from './pages/error/Unauthorized';

// Dashboard pages  
import AdminDashboard from './pages/admin/AdminDashboard';
import { ManageDashboard } from './pages/manager/ManageDashboard';
import DoctorRegister from './pages/doctor/DoctorRegister';
import DoctorDashboard from './pages/doctor/DoctorDashboard';
import { DoctorProfile } from './pages/doctor/DoctorProfile';
import DoctorAppointments from './pages/doctor/DoctorAppointments';
import DoctorPatients from './pages/doctor/DoctorPatients';
import DoctorWallet from './pages/doctor/DoctorWallet';
import DoctorPackages from './pages/doctor/DoctorPackages';
import DoctorFeedback from './pages/doctor/DoctorFeedback';
import { AIChatBot } from './pages/ai/AIChatBot';
import { PatientDashboard } from './pages/patient/patientdashboard';
import { PatientProfile } from './pages/patient/patientProfile';
import { PatientAppointments } from './pages/patient/PatientAppointments';
import { PatientResults } from './pages/patient/PatientResults';
import { PatientFinance } from './pages/patient/PatientFinance';
import { ManagerProfile } from './pages/manager/ManagerProfile';
import { AdminProfile } from './pages/admin/AdminProfile';
import DoctorDetails from './pages/doctor/DoctorDetails';
import ScheduleManagement from './pages/doctor/ScheduleManagement';
import DoctorProfileEdit from './pages/doctor/DoctorProfileEdit';
import MedicalRecordDetails from './pages/doctor/MedicalRecordDetails'; // New import

// Manager pages
import ArticleManagement from './pages/manager/ArticleManagement';
import BannerManagement from './pages/manager/BannerManagement';
import DoctorManagement from './pages/manager/DoctorManagement';
import ReportsAndAnalytics from './pages/manager/ReportsAndAnalytics';
import ServicePackageManagement from './pages/manager/ServicePackageManagement';
import CommissionManagement from './pages/manager/CommissionManagement';
import FeedbackManagement from './pages/manager/FeedbackManagement';
import UserList from './pages/admin/UserList';
import UserEditPage from './pages/admin/UserEditPage';
import TrackingPage from './pages/admin/TrackingPage';
import SettingsPage from './pages/admin/SettingsPage';

import ArticleDetailPage from './pages/public/ArticleDetailPage';
import ArticleReaderPage from './pages/public/ArticleReaderPage';
import DoctorBookingList from './pages/patient/DoctorBookingList';
import ErrorPageWrapper from './pages/error/ErrorPageWrapper';

// Legal pages
import PrivacyPolicy from './pages/public/PrivacyPolicy';
import TermsOfService from './pages/public/TermsOfService';
import AboutUs from './pages/public/AboutUs';
import DoctorProfileList from './pages/manager/DoctorProfileList';
import DoctorProfileDetails from './pages/manager/DoctorProfileDetails';
import EMRTimeline from './pages/patient/EMRTimeline';

export function App() {
  return (
    <LanguageProvider>
      <AuthProvider>
        <ToastProvider>
          <Router>
            <div className="min-h-screen w-full flex flex-col">
              <Routes>
                <Route path="/error/:code" element={<ErrorPageWrapper />} />

                {/* ---------- Public routes ---------- */}
                <Route element={<AuthLayout />}>
                  <Route path="/login" element={<PublicRoute><Login /></PublicRoute>} />
                  <Route path="/patient-register" element={<PublicRoute><PatientRegister /></PublicRoute>} />
                  <Route path="/forgot-password" element={<PublicRoute><ForgotPassword /></PublicRoute>} />
                  <Route path="/reset-password" element={<PublicRoute><ResetPassword /></PublicRoute>} />
                  <Route path="/auth-status" element={<PublicRoute><AuthStatus /></PublicRoute>} />
                  <Route path="/doctor/register" element={<PublicRoute><DoctorRegister /></PublicRoute>} />
                </Route>

                {/* ---------- Change password route ---------- */}
                <Route path="/change-password" element={<ChangePasswordModal isOpen={true} onClose={() => window.location.href = '/'} />} />

                <Route path="/doctor/details/:username" element={<DoctorDetails />} />

                {/* ---------- Public pages with header/footer ---------- */}
                <Route element={<PublicLayout />}>
                  <Route index element={<HomePage />} />
                  <Route path="/doctors" element={<DoctorBookingList />} />
                  <Route path="/privacy" element={<PrivacyPolicy />} />
                  <Route path="/terms" element={<TermsOfService />} />
                  <Route path="/about" element={<AboutUs />} />
                  {/* Public article list */}
                  <Route path="/articles" element={<ArticleReaderPage />} />
                  {/* Public article detail */}
                  <Route path="/articles/:slug" element={<ArticleDetailPage />} />
                </Route>

                {/* ---------- Change password route (Protected) ---------- */}
                <Route path="/change-password" element={<ProtectedRoute><ChangePasswordModal isOpen={true} onClose={() => window.location.href = '/'} /></ProtectedRoute>} />

                {/* ---------- Main app layout ---------- */}
                <Route path="/app" element={<MainLayout />}>
                  <Route path="dashboard" element={
                    <ProtectedRoute>
                      <DashboardRedirect />
                    </ProtectedRoute>
                  } />

                  {/* ---------- Admin routes ---------- */}
                  <Route path="admin/*" element={<AdminLayout />}>
                    <Route index element={<AdminDashboard />} />
                    <Route path="dashboard" element={<AdminDashboard />} />
                    <Route path="profile" element={<AdminProfile />} />
                    <Route path="users" element={<UserList />} />
                    <Route path="users/new" element={<UserEditPage />} />
                    <Route path="users/edit/:id" element={<UserEditPage />} />
                    <Route path="tracking" element={<TrackingPage />} />
                    <Route path="settings" element={<SettingsPage />} />
                  </Route>

                  {/* ---------- Manager routes ---------- */}
                  <Route path="manager/*" element={
                    <ProtectedRoute requiredRoles={[UserRole.MANAGER, UserRole.ADMIN]}>
                      <ManagerLayout />
                     </ProtectedRoute>
                  }>
                    <Route index element={<Navigate to="dashboard" replace />} />
                    <Route path="dashboard" element={<ManageDashboard />} />
                    <Route path="profile" element={<ManagerProfile />} />
                    <Route path="doctors" element={<DoctorManagement />} />
                    <Route path="reports" element={<ReportsAndAnalytics />} />
                    <Route path="articles" element={<ArticleManagement />} />
                    <Route path="banners" element={<BannerManagement />} />
                    <Route path="services" element={<ServicePackageManagement />} />
                    <Route path="commissions" element={<CommissionManagement />} />
                    <Route path="feedback" element={<FeedbackManagement />} />
                  </Route>

                  {/* ---------- Patient routes ---------- */}
                  <Route path="patient/*" element={
                    <ProtectedRoute requiredRoles={[UserRole.PATIENT]}>
                      <PatientLayout />
                    </ProtectedRoute>
                  }>
                    <Route index element={<Navigate to="dashboard" replace />} />
                    <Route path="dashboard" element={<PatientDashboard />} />
                    <Route path="profile" element={<PatientProfile />} />
                    <Route path="appointments" element={<PatientAppointments />} />
                    <Route path="results" element={<PatientResults />} />
                    <Route path="finance" element={<PatientFinance />} />
                    <Route path='emr-timeline' element={<EMRTimeline />} />
                  </Route>

                  {/* ---------- Doctor routes ---------- */}
                  <Route path="doctor/*" element={
                    // <ProtectedRoute requiredRoles={[UserRole.DOCTOR]}>
                      <DoctorLayout />
                    // </ProtectedRoute>
                  }>
                    <Route index element={<Navigate to="dashboard" replace />} />
                    <Route path="dashboard" element={<DoctorDashboard />} />
                    <Route path="profile" element={<DoctorProfile />} />
                    <Route path="profile/edit" element={<DoctorProfileEdit />} />
                    <Route path="schedule" element={<ScheduleManagement />} />
                    <Route path="appointments" element={<DoctorAppointments />} />
                    <Route path="patients" element={<DoctorPatients />} />
                    <Route path="wallet" element={<DoctorWallet />} />
                    <Route path="packages" element={<DoctorPackages />} />
                    <Route path="feedback" element={<DoctorFeedback />} />
                    <Route path="medical-records/:appointmentId" element={<MedicalRecordDetails />} />
                  </Route>

                {/* ---------- Reader ---------- */}
                {/* Redirect /app/articles -> public list for consistency */}
                <Route path="articles" element={<Navigate to="/articles" replace />} />
                <Route path="articles/:slug" element={<ArticleDetailPage />} />

                  {/* ---------- AI Chat ---------- */}
                  <Route path="ai-chat" element={
                    <ProtectedRoute>
                      <AIChatBot />
                    </ProtectedRoute>
                  } />

                  {/* ---------- Error pages ---------- */}
                  <Route path="unauthorized" element={<Unauthorized />} />
                  <Route path="*" element={<NotFound />} />
                </Route>
              </Routes>
            </div>
          </Router>
        </ToastProvider>
      </AuthProvider>
    </LanguageProvider>
  );
}

// Redirect to role-based dashboard
const DashboardRedirect: React.FC = () => {
  const { user } = useAuth(); // ✅ Sử dụng hook useAuth để lấy thông tin người dùng

  switch (user?.role) { // ✅ Sử dụng user.role từ context
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
