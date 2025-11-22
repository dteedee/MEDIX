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

  // Initialize auth state on app start
  useEffect(() => {
    initializeAuth();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Listen for auth changes from external sources (like Google login)
  useEffect(() => {
    const handleAuthChange = () => {
      const userData = localStorage.getItem('userData');
      if (userData && !user) {
        try {
          const parsedUser = JSON.parse(userData);
          setUser(parsedUser);
        } catch (error) {
          console.error('Error parsing user data:', error);
        }
      }
    };
    
    window.addEventListener('authChanged', handleAuthChange);
    
    return () => {
      window.removeEventListener('authChanged', handleAuthChange);
    };
  }, [user]);

  const initializeAuth = async () => {
    try {
      // Check if user data exists in localStorage
      const userData = localStorage.getItem('userData');
      const accessToken = localStorage.getItem('accessToken');
      const refreshToken = localStorage.getItem('refreshToken');
      
      // If we have user data but no tokens, clear everything (Google login error case)
      if (userData && !accessToken && !refreshToken) {
        localStorage.removeItem('userData');
        localStorage.removeItem('currentUser');
        setIsLoading(false);
        return;
      }
      
      if (userData) {
        // Try to restore user session
        // apiClient will automatically handle token refresh if needed
        await loadUserProfile();
      }
    } catch (error) {
      console.error('Failed to initialize auth:', error);
      // Clear invalid tokens
      apiClient.clearTokens();
      localStorage.removeItem('userData');
      localStorage.removeItem('currentUser');
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
        const parsedUser = JSON.parse(userData);
        setUser(parsedUser);
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
      
      let finalUser = authResponse.user;

      // Store tokens immediately so subsequent API calls are authenticated
      apiClient.setTokens(authResponse.accessToken, authResponse.refreshToken);

      // If the user is a doctor, fetch additional profile details
      if (finalUser.role === UserRole.DOCTOR) {
        try {
          const doctorDetails = await doctorService.getDoctorProfileDetails();
          // Merge the details into the user object
          finalUser = { ...finalUser, ...doctorDetails };
        } catch (detailsError) {
          console.error('Could not fetch doctor details:', detailsError);
        }
      }

      // Store user data
      updateUserInStorageAndState(finalUser);
      
      // Dispatch auth changed event for Header component
      window.dispatchEvent(new Event('authChanged'));
    } catch (error: any) {
      console.error('Login failed:', error);
      
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
    // Dispatch event to notify other components of the update
    window.dispatchEvent(new Event('authChanged'));
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
      localStorage.removeItem('accessToken');
      localStorage.removeItem('refreshToken');
      apiClient.clearTokens();
      
      // Dispatch auth changed event for Header component
      window.dispatchEvent(new Event('authChanged'));
      
      // Force reload to clear all state and prevent back navigation
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
    
    // Update localStorage
    localStorage.setItem('userData', JSON.stringify(updatedUser));
    localStorage.setItem('currentUser', JSON.stringify(updatedUser));
    
    // Dispatch auth changed event for other components
    window.dispatchEvent(new Event('authChanged'));
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