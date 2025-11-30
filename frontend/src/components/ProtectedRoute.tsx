import React, { useEffect } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { UserRole } from '../types/common.types';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requiredRoles?: UserRole[];
  requiredPermissions?: string[];
  fallbackPath?: string;
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({
  children,
  requiredRoles = [],
  requiredPermissions = [],
  fallbackPath = '/login',
}) => {
  const { isAuthenticated, user, checkRole, hasPermission, isLoading } = useAuth();
  const location = useLocation();

  useEffect(() => {
   
  }, [location.pathname, isLoading, isAuthenticated, user, requiredRoles]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to={fallbackPath} state={{ from: location }} replace />;
  }

  if (requiredRoles.length > 0 && !checkRole(requiredRoles)) {
    return <Navigate to="/unauthorized" replace />;
  }

  if (requiredPermissions.length > 0) {
    const hasRequiredPermissions = requiredPermissions.every(permission =>
      hasPermission(permission)
    );
    
    if (!hasRequiredPermissions) {
      return <Navigate to="/unauthorized" replace />;
    }
  }

  return <>{children}</>;
};

export const PublicRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated, user, isLoading } = useAuth();
  const location = useLocation();

  // Debug logs in useEffect to prevent infinite re-renders
  useEffect(() => {
  
  }, [location.pathname, isLoading, isAuthenticated, user]);
  
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (isAuthenticated && user) {
    const dashboardPath = getDashboardPath(user.role as UserRole);
    return <Navigate to={dashboardPath} replace />;
  }

  return <>{children}</>;
};

const getDashboardPath = (role: UserRole): string => {
  switch (role) {
    case UserRole.ADMIN:
      return '/app/admin';
    case UserRole.MANAGER:
      return '/app/manager';
    case UserRole.DOCTOR:
      return '/app/doctor';
    case UserRole.PATIENT:
      return '/app/patient';
    default:
      return '/';
  }
};
