import React, { useEffect, useState } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { apiClient } from '../lib/apiClient';
import { useAuth } from '../contexts/AuthContext';
import { UserRole } from '../types/common.types';

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
        setIsMaintenance(false);
      } finally {
        setIsChecking(false);
      }
    };

    checkMaintenanceMode();
  }, []);

  useEffect(() => {
    if (!authLoading && user) {
      const checkMaintenanceMode = async () => {
        try {
          const modeRes = await apiClient.get('/SystemConfiguration/MAINTENANCE_MODE');
          const maintenanceActive = modeRes.data?.configValue?.toLowerCase() === 'true';
          setIsMaintenance(maintenanceActive);
        } catch (error) {
        }
      };

      checkMaintenanceMode();
    }
  }, [user, authLoading]);

  if (authLoading || isChecking) {
    return null;
  }

  if (!isMaintenance) {
    return null;
  }

  const isAllowedRoute = ALLOWED_ROUTES.some(route => 
    location.pathname === route || location.pathname.startsWith(route)
  );
  
  if (isAllowedRoute) {
    return null;
  }

  if (user && user.role === UserRole.ADMIN) {
    return null;
  }

  if (location.pathname === '/maintenance') {
    return null;
  }

  return <Navigate to="/maintenance" replace />;
};

