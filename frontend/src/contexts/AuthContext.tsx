import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { User, AuthResponse, LoginRequest, RegisterRequest, PatientRegistration } from '../types/auth.types';
import { UserRole } from '../types/common.types';
import { authService } from '../services/authService';
import { apiClient } from '../lib/apiClient';
import doctorService from '../services/doctorService';

interface AuthContextType {
  user: User | null;
  isBanned: boolean;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (credentials: LoginRequest) => Promise<void>;
  register: (userData: RegisterRequest) => Promise<void>;
  registerPatient: (patientData: PatientRegistration) => Promise<void>;
  logout: () => Promise<void>;
  updateUser: (updatedUserData: Partial<User>) => void;
  checkRole: (requiredRoles: UserRole[]) => boolean;
  hasPermission: (permission: string) => boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isBanned, setIsBanned] = useState(false);

  const isAuthenticated = !!user;

  useEffect(() => {
    if (user && (user as any).startDateBanned && (user as any).endDateBanned) {
      const now = new Date();
      const startDate = new Date((user as any).startDateBanned);
      const endDate = new Date((user as any).endDateBanned);
      const banned = now >= startDate && now <= endDate;
      setIsBanned(banned);
    } else {
      setIsBanned(false);
    }
  }, [user]);

  useEffect(() => {
    initializeAuth();
  }, []);

  useEffect(() => {
    const handleAuthChange = () => {
      const userData = localStorage.getItem('userData');
      if (userData && !user) {
        try {
          const parsedUser = JSON.parse(userData);
          setUser(parsedUser);
        } catch (error) {
        }
      }
    };

    const handleTokenExpired = () => {
      // Clear user state when token expires
      setUser(null);
      localStorage.removeItem('userData');
      localStorage.removeItem('currentUser');
    };
    
    window.addEventListener('authChanged', handleAuthChange);
    window.addEventListener('authTokenExpired', handleTokenExpired);
    
    return () => {
      window.removeEventListener('authChanged', handleAuthChange);
      window.removeEventListener('authTokenExpired', handleTokenExpired);
    };
  }, [user]);

  const initializeAuth = async () => {
    try {
      const userData = localStorage.getItem('userData');
      const accessToken = localStorage.getItem('accessToken');
      const refreshToken = localStorage.getItem('refreshToken');
      
      if (userData && !accessToken && !refreshToken) {
        localStorage.removeItem('userData');
        localStorage.removeItem('currentUser');
        setIsLoading(false);
        return;
      }
      
      const tokenExpiration = localStorage.getItem('tokenExpiration');
      const isTokenExpired = tokenExpiration && Date.now() >= parseInt(tokenExpiration);
      
      if (refreshToken && (!accessToken || isTokenExpired)) {
        try {
          const authResponse = await authService.refreshToken(refreshToken);
          // Store new tokens with expiresAt from backend
          apiClient.setTokens(authResponse.accessToken, authResponse.refreshToken, authResponse.expiresAt);
          // Restore user data
          if (userData) {
            await loadUserProfile();
          }
        } catch (refreshError) {

          apiClient.clearTokens();
          localStorage.removeItem('userData');
          localStorage.removeItem('currentUser');
        }
      } else if (userData && accessToken) {
        await loadUserProfile();
      }
    } catch (error) {
      apiClient.clearTokens();
      localStorage.removeItem('userData');
      localStorage.removeItem('currentUser');
    } finally {
      setIsLoading(false);
    }
  };

  const loadUserProfile = async () => {
    try {
      const userData = localStorage.getItem('userData');
      if (userData) {
        const parsedUser = JSON.parse(userData);
        setUser(parsedUser);
        window.dispatchEvent(new Event('authChanged'));
      }
    } catch (error) {
      throw error;
    }
  };

  const login = async (credentials: LoginRequest) => {
    try {
      setIsLoading(true);
      const authResponse: AuthResponse = await authService.login(credentials);
      
      let finalUser = authResponse.user;

      // Store tokens immediately so subsequent API calls are authenticated
      // Use expiresAt from backend response
      apiClient.setTokens(authResponse.accessToken, authResponse.refreshToken, authResponse.expiresAt);

      if (finalUser.role === UserRole.DOCTOR) {
        try {
          const doctorDetails = await doctorService.getDoctorProfileDetails();
          finalUser = { ...finalUser, ...doctorDetails };
        } catch (detailsError) {
        }
      }

      updateUserInStorageAndState(finalUser);
      
      window.dispatchEvent(new Event('authChanged'));
    } catch (error: any) {
      
      if (error?.message?.includes('Tài khoản bị khóa')) {
        throw new Error('Tài khoản bị khóa, vui lòng liên hệ bộ phận hỗ trợ');
      }
      
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const updateUserInStorageAndState = (userToUpdate: User) => {
    setUser(userToUpdate);
    localStorage.setItem('userData', JSON.stringify(userToUpdate));
    localStorage.setItem('currentUser', JSON.stringify(userToUpdate));
    window.dispatchEvent(new Event('authChanged'));
  };

  const register = async (userData: RegisterRequest) => {
    try {
      setIsLoading(true);
      const authResponse: AuthResponse = await authService.register(userData);
      
      // Store tokens with expiresAt from backend
      apiClient.setTokens(authResponse.accessToken, authResponse.refreshToken, authResponse.expiresAt);
      
      localStorage.setItem('userData', JSON.stringify(authResponse.user));
      localStorage.setItem('currentUser', JSON.stringify(authResponse.user));
      setUser(authResponse.user);
      
      window.dispatchEvent(new Event('authChanged'));
    } catch (error) {
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const registerPatient = async (patientData: PatientRegistration) => {
    try {
      setIsLoading(true);
      const authResponse: AuthResponse = await authService.registerPatient(patientData);
      
      // Store tokens with expiresAt from backend
      apiClient.setTokens(authResponse.accessToken, authResponse.refreshToken, authResponse.expiresAt);
      
      localStorage.setItem('userData', JSON.stringify(authResponse.user));
      localStorage.setItem('currentUser', JSON.stringify(authResponse.user));
      setUser(authResponse.user);
      
      window.dispatchEvent(new Event('authChanged'));
    } catch (error) {
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async () => {
    try {
      await authService.logout();
    } catch (error) { } finally {
      setUser(null);
      localStorage.removeItem('userData');
      localStorage.removeItem('currentUser');
      localStorage.removeItem('accessToken');
      localStorage.removeItem('refreshToken');
      apiClient.clearTokens();
      
      window.dispatchEvent(new Event('authChanged'));
      
      window.location.href = '/login';
    }
  };

  const checkRole = (requiredRoles: UserRole[]): boolean => {
    if (!user) return false;
    return requiredRoles.some(role => user.role === role);
  };

  const updateUser = (updatedUserData: Partial<User>) => {
    if (!user) return;
    
    const updatedUser = { ...user, ...updatedUserData };
    setUser(updatedUser);
    
    localStorage.setItem('userData', JSON.stringify(updatedUser));
    localStorage.setItem('currentUser', JSON.stringify(updatedUser));
    
    window.dispatchEvent(new Event('authChanged'));
  };

  const hasPermission = (permission: string): boolean => {
    if (!user) return false;
    
    const rolePermissions: Record<string, string[]> = {
      [UserRole.ADMIN]: [
        'manage_users',
        'manage_doctors',
        'manage_patients',
        'view_analytics',
        'manage_system',
        'manage_content',
      ],
      [UserRole.MANAGER]: [
        'manage_doctors',
        'manage_patients',
        'view_analytics',
        'manage_content',
      ],
      [UserRole.DOCTOR]: [
        'manage_appointments',
        'view_patient_records',
        'create_prescriptions',
        'manage_profile',
      ],
      [UserRole.PATIENT]: [
        'book_appointments',
        'view_records',
        'manage_profile',
        'view_health_articles',
      ],
    };

    const userPermissions = rolePermissions[user.role as UserRole] || [];
    return userPermissions.includes(permission);
  };

  const value: AuthContextType = {
    user,
    isBanned,
    isLoading,
    isAuthenticated,
    login,
    register,
    registerPatient,
    logout,
    updateUser,
    checkRole,
    hasPermission,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};