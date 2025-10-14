// Updated AuthService to match backend API structure

import { apiClient } from '../lib/apiClient';
import { 
  LoginRequest, 
  RegisterRequest, 
  RegisterRequestPatient,
  AuthResponse, 
  ForgotPasswordRequest,
  ResetPasswordRequest,
  RefreshTokenRequest,
  BloodType,
  Gender,
  PatientRegistration
} from '../types/auth.types';

export class AuthService {
  async login(credentials: LoginRequest): Promise<AuthResponse> {
    try {
      const response = await apiClient.post<AuthResponse>('/auth/login', credentials);
      return response.data;
    } catch (error: any) {
      throw this.handleApiError(error);
    }
  }

  async register(userData: RegisterRequest): Promise<AuthResponse> {
    try {
      const response = await apiClient.post<AuthResponse>('/auth/register', userData);
      return response.data;
    } catch (error: any) {
      throw this.handleApiError(error);
    }
  }

  async registerPatient(patientData: PatientRegistration): Promise<AuthResponse> {
    try {
      // Transform data to match backend RegistrationPayloadDTO structure
      const payload = {
        RegisterRequest: patientData.registerRequest,
        PatientDTO: patientData.patientDTO
      };
      
      const response = await apiClient.post<AuthResponse>('/register/registerPatient', payload);
      return response.data;
    } catch (error: any) {
      throw this.handleApiError(error);
    }
  }

  async forgotPassword(data: ForgotPasswordRequest): Promise<void> {
    try {
      await apiClient.post('/auth/forgot-password', data);
    } catch (error: any) {
      throw this.handleApiError(error);
    }
  }

  async resetPassword(data: ResetPasswordRequest): Promise<void> {
    try {
      await apiClient.post('/auth/reset-password', data);
    } catch (error: any) {
      throw this.handleApiError(error);
    }
  }

  async refreshToken(refreshToken: string): Promise<AuthResponse> {
    try {
      const response = await apiClient.post<AuthResponse>('/auth/refresh-token', { refreshToken });
      return response.data;
    } catch (error: any) {
      throw this.handleApiError(error);
    }
  }

  async logout(): Promise<void> {
    try {
      await apiClient.post('/auth/logout');
    } catch (error: any) {
      // Don't throw error on logout failure, just log it
      console.error('Logout API error:', error);
    } finally {
      // Always clear tokens even if API call fails
      apiClient.clearTokens();
    }
  }

  async checkEmailExists(email: string): Promise<boolean> {
    try {
      // Backend expects JSON body with email string
      const response = await apiClient.post<boolean>('/register/checkEmailExist', JSON.stringify(email), {
        headers: {
          'Content-Type': 'application/json',
        }
      });
      return response.data;
    } catch (error: any) {
      console.error('Check email exists error:', error);
      return false; // Default to false if check fails
    }
  }

  async getBloodTypes(): Promise<BloodType[]> {
    try {
      const response = await apiClient.get<BloodType[]>('/register/getBloodTypes');
      return response.data;
    } catch (error: any) {
      console.error('Get blood types error:', error);
      throw this.handleApiError(error);
    }
  }

  async sendEmailVerification(email: string): Promise<void> {
    try {
      await apiClient.post('/register/sendEmailVerified', JSON.stringify(email), {
        headers: {
          'Content-Type': 'application/json',
        }
      });
    } catch (error: any) {
      throw this.handleApiError(error);
    }
  }

  // Get available gender options (could be from backend or static)
  getGenderOptions(): Gender[] {
    return [
      { code: 'Male', displayName: 'Nam', isActive: true },
      { code: 'Female', displayName: 'Nữ', isActive: true },
      { code: 'Others', displayName: 'Khác', isActive: true },
    ];
  }

  // Helper method to handle API errors consistently
  private handleApiError(error: any): Error {
    if (error.response?.data) {
      const apiError = error.response.data;
      
      // Handle validation errors from backend
      if (apiError.errors) {
        const errorMessages = Object.entries(apiError.errors)
          .flat()
          .filter(msg => typeof msg === 'string')
          .join(', ');
        return new Error(errorMessages || apiError.message || 'Validation error');
      }
      
      return new Error(apiError.message || 'API error occurred');
    }
    
    return new Error(error.message || 'Network error occurred');
  }

  // Validate email format before making API calls
  validateEmailFormat(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  // Check password complexity before making API calls
  validatePasswordComplexity(password: string): boolean {
    // Must contain at least 1 uppercase, 1 lowercase, 1 digit, 1 special character, min 6 chars
    const complexityRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[\W_]).{6,}$/;
    return complexityRegex.test(password);
  }
}

export const authService = new AuthService();