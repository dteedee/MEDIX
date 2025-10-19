import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { User, AuthResponse, LoginRequest, RegisterRequest, PatientRegistration } from '../types/auth.types';
import { UserRole } from '../types/common.types';
import { authService } from '../services/authService';
import { apiClient } from '../lib/apiClient';

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (credentials: LoginRequest) => Promise<void>;
  register: (userData: RegisterRequest) => Promise<void>;
  registerPatient: (patientData: PatientRegistration) => Promise<void>;
  logout: () => Promise<void>;
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

  const isAuthenticated = !!user;

  // Initialize auth state on app start
  useEffect(() => {
    initializeAuth();
  }, []);

  const initializeAuth = async () => {
    try {
      const accessToken = localStorage.getItem('accessToken');
      const refreshToken = localStorage.getItem('refreshToken');

      if (accessToken && refreshToken) {
        // Try to get user info with current token
        // If it fails, the interceptor will try to refresh
        await loadUserProfile();
      }
    } catch (error) {
      console.error('Failed to initialize auth:', error);
      // Clear invalid tokens
      apiClient.clearTokens();
    } finally {
      setIsLoading(false);
    }
  };

  const loadUserProfile = async () => {
    try {
      // You would need to implement a profile endpoint in your backend
      // For now, we'll decode from token or store user data during login
      const userData = localStorage.getItem('userData');
      if (userData) {
        setUser(JSON.parse(userData));
        // Dispatch auth changed event for Header component
        window.dispatchEvent(new Event('authChanged'));
      }
    } catch (error) {
      console.error('Failed to load user profile:', error);
      throw error;
    }
  };

  const login = async (credentials: LoginRequest) => {
    try {
      setIsLoading(true);
      const authResponse: AuthResponse = await authService.login(credentials);
      
      // Store tokens
      apiClient.setTokens(authResponse.accessToken, authResponse.refreshToken);
      
      // Store user data
      localStorage.setItem('userData', JSON.stringify(authResponse.user));
      localStorage.setItem('currentUser', JSON.stringify(authResponse.user));
      setUser(authResponse.user);
      
      // Dispatch auth changed event for Header component
      window.dispatchEvent(new Event('authChanged'));
    } catch (error) {
      console.error('Login failed:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const register = async (userData: RegisterRequest) => {
    try {
      setIsLoading(true);
      const authResponse: AuthResponse = await authService.register(userData);
      
      // Store tokens
      apiClient.setTokens(authResponse.accessToken, authResponse.refreshToken);
      
      // Store user data
      localStorage.setItem('userData', JSON.stringify(authResponse.user));
      localStorage.setItem('currentUser', JSON.stringify(authResponse.user));
      setUser(authResponse.user);
      
      // Dispatch auth changed event for Header component
      window.dispatchEvent(new Event('authChanged'));
    } catch (error) {
      console.error('Registration failed:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const registerPatient = async (patientData: PatientRegistration) => {
    try {
      setIsLoading(true);
      const authResponse: AuthResponse = await authService.registerPatient(patientData);
      
      // Store tokens
      apiClient.setTokens(authResponse.accessToken, authResponse.refreshToken);
      
      // Store user data
      localStorage.setItem('userData', JSON.stringify(authResponse.user));
      localStorage.setItem('currentUser', JSON.stringify(authResponse.user));
      setUser(authResponse.user);
      
      // Dispatch auth changed event for Header component
      window.dispatchEvent(new Event('authChanged'));
    } catch (error) {
      console.error('Patient registration failed:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async () => {
    try {
      await authService.logout();
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      // Always clear local state
      setUser(null);
      localStorage.removeItem('userData');
      localStorage.removeItem('currentUser');
      apiClient.clearTokens();
      
      // Dispatch auth changed event for Header component
      window.dispatchEvent(new Event('authChanged'));
    }
  };

  const checkRole = (requiredRoles: UserRole[]): boolean => {
    if (!user) return false;
    return requiredRoles.some(role => user.role === role);
  };

  const hasPermission = (permission: string): boolean => {
    if (!user) return false;
    
    // Define permissions based on roles
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
    isLoading,
    isAuthenticated,
    login,
    register,
    registerPatient,
    logout,
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