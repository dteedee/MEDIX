import React, { useEffect, useState } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { apiClient } from '../lib/apiClient';
import { useAuth } from '../contexts/AuthContext';
import { UserRole } from '../types/common.types';

// Danh sách các route được phép truy cập ngay cả khi bảo trì (để đăng nhập, đăng ký, etc.)
const ALLOWED_ROUTES = [
  '/login',
  '/patient-register',
  '/doctor/register',
  '/forgot-password',
  '/reset-password',
  '/auth-status',
  '/maintenance',
  '/error',
];

export const MaintenanceRedirect: React.FC = () => {
  const { user, isLoading: authLoading } = useAuth();
  const location = useLocation();
  const [isMaintenance, setIsMaintenance] = useState<boolean | null>(null);
  const [isChecking, setIsChecking] = useState(true);

  useEffect(() => {
    const checkMaintenanceMode = async () => {
      try {
        const modeRes = await apiClient.get('/SystemConfiguration/MAINTENANCE_MODE');
        const maintenanceActive = modeRes.data?.configValue?.toLowerCase() === 'true';
        setIsMaintenance(maintenanceActive);
      } catch (error) {
        console.error('Failed to check maintenance mode', error);
        setIsMaintenance(false);
      } finally {
        setIsChecking(false);
      }
    };

    checkMaintenanceMode();
  }, []);

  // Re-check maintenance mode when user changes (e.g., after login)
  useEffect(() => {
    if (!authLoading && user) {
      const checkMaintenanceMode = async () => {
        try {
          const modeRes = await apiClient.get('/SystemConfiguration/MAINTENANCE_MODE');
          const maintenanceActive = modeRes.data?.configValue?.toLowerCase() === 'true';
          setIsMaintenance(maintenanceActive);
        } catch (error) {
          console.error('Failed to check maintenance mode', error);
        }
      };

      checkMaintenanceMode();
    }
  }, [user, authLoading]);

  // Wait for auth to load
  if (authLoading || isChecking) {
    return null;
  }

  // If maintenance mode is not active, don't redirect
  if (!isMaintenance) {
    return null;
  }

  // Allow access to auth routes (login, register, etc.) so users can log in
  const isAllowedRoute = ALLOWED_ROUTES.some(route => 
    location.pathname === route || location.pathname.startsWith(route)
  );
  
  if (isAllowedRoute) {
    return null;
  }

  // If user is Admin, allow access (don't redirect) - Admin can access to turn off maintenance
  if (user && user.role === UserRole.ADMIN) {
    return null;
  }

  // If already on maintenance page, don't redirect again
  if (location.pathname === '/maintenance') {
    return null;
  }

  // Redirect non-admin users to maintenance page
  return <Navigate to="/maintenance" replace />;
};

