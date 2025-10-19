// Updated AuthService to match backend API structure

import { apiClient } from '../lib/apiClient';
import {
  LoginRequest,
  RegisterRequest,
  AuthResponse,
  ForgotPasswordRequest,
  ResetPasswordRequest,
  BloodType,
  Gender,
  PatientRegistration,
} from '../types/auth.types';

export class AuthService {
  // ===================== LOGIN =====================
  async login(credentials: LoginRequest): Promise<AuthResponse> {
    try {
      const response = await apiClient.post<AuthResponse>('/auth/login', credentials);
      return response.data;
    } catch (error: any) {
      throw this.handleApiError(error);
    }
  }

  // ===================== REGISTER (GENERAL) =====================
  async register(userData: RegisterRequest): Promise<AuthResponse> {
    try {
      const response = await apiClient.post<AuthResponse>('/auth/register', userData);
      return response.data;
    } catch (error: any) {
      throw this.handleApiError(error);
    }
  }

  // ===================== REGISTER (PATIENT) =====================
  async registerPatient(patientData: PatientRegistration): Promise<AuthResponse> {
    try {
      // Transform data to match backend RegistrationPayloadDTO structure
      const payload = {
        registerRequest: {
          email: patientData.registerRequest.email,
          password: patientData.registerRequest.password,
          passwordConfirmation: patientData.registerRequest.passwordConfirmation,
          fullName: patientData.registerRequest.fullName,
          phoneNumber: patientData.registerRequest.phoneNumber || null,
          address: patientData.registerRequest.address || null,
          dateOfBirth: patientData.registerRequest.dateOfBirth || null,
          identificationNumber: patientData.registerRequest.identificationNumber || null,
          genderCode: patientData.registerRequest.genderCode || null,
        },
        patientDTO: {
          bloodTypeCode: patientData.patientDTO.bloodTypeCode || null,
          height: patientData.patientDTO.height || null,
          weight: patientData.patientDTO.weight || null,
          medicalHistory: patientData.patientDTO.medicalHistory || null,
          allergies: patientData.patientDTO.allergies || null,
          emergencyContactName: patientData.patientDTO.emergencyContactName || null,
          emergencyContactPhone: patientData.patientDTO.emergencyContactPhone || null,
          isActive: true, // Default to active
        },
      };

      // Debug payload being sent to backend
      console.log('Final payload being sent to backend:', JSON.stringify(payload, null, 2));

      const response = await apiClient.post<AuthResponse>('/register/registerPatient', payload);
      return response.data;
    } catch (error: any) {
      throw this.handleApiError(error);
    }
  }

  // ===================== FORGOT PASSWORD =====================
  async forgotPassword(data: ForgotPasswordRequest): Promise<void> {
    try {
      await apiClient.post('/auth/forgot-password', data);
    } catch (error: any) {
      throw this.handleApiError(error);
    }
  }

  // ===================== RESET PASSWORD =====================
  async resetPassword(data: ResetPasswordRequest): Promise<void> {
    try {
      await apiClient.post('/auth/reset-password', data);
    } catch (error: any) {
      throw this.handleApiError(error);
    }
  }

  // ===================== REFRESH TOKEN =====================
  async refreshToken(refreshToken: string): Promise<AuthResponse> {
    try {
      const response = await apiClient.post<AuthResponse>('/auth/refresh-token', { refreshToken });
      return response.data;
    } catch (error: any) {
      throw this.handleApiError(error);
    }
  }

  // ===================== LOGOUT =====================
  async logout(): Promise<void> {
    try {
      await apiClient.post('/auth/logout');
    } catch (error: any) {
      console.error('Logout API error:', error);
    } finally {
      apiClient.clearTokens();
    }
  }

  // ===================== CHECK EMAIL EXIST =====================
  async checkEmailExists(email: string): Promise<boolean> {
    try {
      const response = await apiClient.post<boolean>(
        '/register/checkEmailExist',
        JSON.stringify(email),
        {
          headers: { 'Content-Type': 'application/json' },
        }
      );
      return response.data;
    } catch (error: any) {
      console.error('Check email exists error:', error);
      return false;
    }
  }

  // ===================== GET BLOOD TYPES =====================
  async getBloodTypes(): Promise<BloodType[]> {
    try {
      const response = await apiClient.get<BloodType[]>('/register/getBloodTypes');
      return response.data;
    } catch (error: any) {
      console.error('Get blood types error:', error);
      throw this.handleApiError(error);
    }
  }

  // ===================== SEND EMAIL VERIFICATION =====================
  async sendEmailVerification(email: string): Promise<void> {
    try {
      await apiClient.post('/register/sendEmailVerified', JSON.stringify(email), {
        headers: { 'Content-Type': 'application/json' },
      });
    } catch (error: any) {
      throw this.handleApiError(error);
    }
  }

  // ===================== GENDER OPTIONS =====================
  getGenderOptions(): Gender[] {
    return [
      { code: 'Male', displayName: 'Nam', isActive: true },
      { code: 'Female', displayName: 'Nữ', isActive: true },
      { code: 'Others', displayName: 'Khác', isActive: true },
    ];
  }

  // ===================== HELPER: ERROR HANDLER =====================
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

  // ===================== HELPER: EMAIL FORMAT =====================
  validateEmailFormat(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  // ===================== HELPER: PASSWORD COMPLEXITY =====================
  validatePasswordComplexity(password: string): boolean {
    // Must contain at least 1 uppercase, 1 lowercase, 1 digit, 1 special character, min 6 chars
    const complexityRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[\W_]).{6,}$/;
    return complexityRegex.test(password);
  }
}

export const authService = new AuthService();
