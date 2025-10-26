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
import PublicLayout from './components/layout/PublicLayout';

// Auth pages
import HomePage from './pages/public/HomePage';
import Login from './pages/auth/Login';
import { PatientRegister } from './pages/auth/PatientRegister';
import ForgotPassword from './pages/auth/ForgotPassword';
import ResetPassword from './pages/auth/ResetPassword';
import ChangePassword from './pages/auth/ChangePassword';
import AuthLayout from './components/layout/AuthLayout';
import AuthStatus from './pages/auth/AuthStatus';
import { Unauthorized } from './pages/error/Unauthorized';

// Dashboard pages  
import AdminDashboard from './pages/admin/AdminDashboard';
import { ManageDashboard } from './pages/manager/ManageDashboard';
import DoctorRegister from './pages/doctor/DoctorRegister';
import { AIChatBot } from './pages/ai/AIChatBot';
import { PatientDashboard } from './pages/patient/patientdashboard';
import { PatientProfile } from './pages/patient/patientProfile';
import DoctorDetails from './pages/doctor/DoctorDetails';
import ScheduleManagement from './pages/doctor/ScheduleManagement';
import DoctorProfileEdit from './pages/doctor/DoctorProfileEdit';
import MedicalRecordDetails from './pages/doctor/MedicalRecordDetails'; // New import

// CMS Management pages
import BannerList from './pages/manager/BannerList';
import ArticleList from './pages/manager/ArticleList';
import CategoryList from './pages/manager/CategoryList';
import CmsPageList from './pages/manager/CmsPageList';
import ArticleEditPage from './pages/manager/ArticleEditPage';
import CategoryEditPage from './pages/manager/CategoryEditPage';
import BannerEditPage from './pages/manager/BannerEditPage';
import CmsPageEditPage from './pages/manager/CmsPageEditPage';
import UserList from './pages/admin/UserList';
import UserEditPage from './pages/admin/UserEditPage';
import TrackingPage from './pages/admin/TrackingPage';
import SettingsPage from './pages/admin/SettingsPage';

// Reader pages
import ArticleReaderPage from './pages/patient/ArticleReaderPage';
import ArticleDetailPage from './pages/patient/ArticleDetailPage';
import DoctorBookingList from './pages/patient/DoctorBookingList';
import ErrorPageWrapper from './pages/error/ErrorPageWrapper';

// Legal pages
import PrivacyPolicy from './pages/public/PrivacyPolicy';
import TermsOfService from './pages/public/TermsOfService';
import AboutUs from './pages/public/AboutUs';

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
              <Route path="/change-password" element={<ChangePassword />} />

              <Route path="/doctor/details/:username" element={<DoctorDetails />} />

              {/* ---------- Public pages with header/footer ---------- */}
              <Route element={<PublicLayout />}>
                <Route index element={<HomePage />} />
                <Route path="/doctors" element={<DoctorBookingList />} />
                <Route path="/privacy" element={<PrivacyPolicy />} />
                <Route path="/terms" element={<TermsOfService />} />
                <Route path="/about" element={<AboutUs />} />
              </Route>

              {/* ---------- Change password route (Protected) ---------- */}
              <Route path="/change-password" element={<ProtectedRoute><ChangePassword /></ProtectedRoute>} />

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
                  <Route path="users" element={<UserList />} />
                  <Route path="users/new" element={<UserEditPage />} />
                  <Route path="users/edit/:id" element={<UserEditPage />} />
                  <Route path="tracking" element={<TrackingPage />} />
                  <Route path="settings" element={<SettingsPage />} />
                </Route>

                {/* ---------- Manager routes ---------- */}
                <Route path="manager/*" element={
                  // <ProtectedRoute requiredRoles={[UserRole.MANAGER, UserRole.ADMIN]}>
                    <Routes>
                      <Route index element={<ManageDashboard />} />
                      <Route path="banners" element={<BannerList />} />
                      <Route path="banners/new" element={<BannerEditPage />} />
                      <Route path="banners/edit/:id" element={<BannerEditPage />} />
                      <Route path="articles" element={<ArticleList />} />
                      <Route path="articles/new" element={<ArticleEditPage />} />
                      <Route path="articles/edit/:id" element={<ArticleEditPage />} />
                      <Route path="categories" element={<CategoryList />} />
                      <Route path="categories/new" element={<CategoryEditPage />} />
                      <Route path="categories/edit/:id" element={<CategoryEditPage />} />
                      <Route path="cms-pages" element={<CmsPageList />} />
                      <Route path="cms-pages/new" element={<CmsPageEditPage />} />
                      <Route path="cms-pages/edit/:id" element={<CmsPageEditPage />} />
                    </Routes>
                  // </ProtectedRoute>
                } />

                {/* ---------- Patient routes ---------- */}
                <Route path="patient/*" element={
                  <ProtectedRoute requiredRoles={[UserRole.PATIENT]}>
                    <Routes>
                      <Route index element={<Navigate to="dashboard" replace />} />
                      <Route path="dashboard" element={<PatientDashboard />} />
                      <Route path="profile" element={<PatientProfile />} />
                    </Routes>
                  </ProtectedRoute>
                } />

                {/* ---------- Doctor routes (inside /app) ---------- */}
                <Route path="doctor/*" element={
                  // <ProtectedRoute requiredRoles={[UserRole.DOCTOR]}>
                    <Routes>
                      {/* <Route index element={<Navigate to="schedules" replace />} /> */}
                      <Route path="profile/edit" element={<DoctorProfileEdit />} />
                      <Route path="schedules" element={<ScheduleManagement />} />
                      <Route path="medical-records/:appointmentId" element={<MedicalRecordDetails />} /> {/* New route */}
                    </Routes>
                  // </ProtectedRoute>
                } />

                {/* ---------- Reader ---------- */}
                <Route path="articles" element={<ArticleReaderPage />} />
                <Route path="articles/:slug" element={<ProtectedRoute><ArticleDetailPage /></ProtectedRoute>} />

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
