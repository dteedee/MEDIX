// src/services/authService.ts
import { apiClient } from '../lib/apiClient';
import {
  LoginRequest,
  RegisterRequest,
  AuthResponse,
  ForgotPasswordRequest,
  RefreshTokenRequest,
  RegisterRequestPatient,
  ResetPasswordRequest,
  BloodType,
  Gender,
  PatientRegistration,
} from '../types/auth.types';

declare global {
  interface ImportMetaEnv {
    readonly VITE_GOOGLE_CLIENT_ID: string;
  }
  interface ImportMeta {
    readonly env: ImportMetaEnv;
  }
}

export class AuthService {
  // ===================== LOGIN =====================
  async login(credentials: LoginRequest): Promise<AuthResponse> {
    try {
      // Map email field to identifier for backend compatibility
      const loginData = {
        identifier: credentials.email,
        password: credentials.password
      };
      const response = await apiClient.post<AuthResponse>('/auth/login', loginData);
      return response.data;
    } catch (error: any) {
      throw this.handleApiError(error);
    }
  }

  // ===================== LOGIN WITH GOOGLE =====================
  async loginWithGoogle(idToken: string): Promise<AuthResponse> {
    try {
      const response = await apiClient.post<AuthResponse>('/auth/login-google', { idToken });
      return response.data;
    } catch (error: any) {
      console.error('❌ Lỗi khi gọi /auth/login-google:', error?.response?.data || error);
      if (error?.response?.data?.message?.includes('JWT must consist')) {
        throw new Error('ID Token từ Google không hợp lệ. Kiểm tra Client ID hoặc cấu hình Google Console.');
      }
      throw new Error(error?.response?.data?.message || 'Đăng nhập Google thất bại.');
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
          isActive: true,
        },
      };

      console.log('📤 Payload gửi lên backend:', JSON.stringify(payload, null, 2));
      const response = await apiClient.post<AuthResponse>('/register/registerPatient', payload);
      return response.data;
    } catch (error: any) {
      throw this.handleApiError(error);
    }
  }

  // ===================== FORGOT PASSWORD =====================
  async sendForgotPasswordCode(email: string): Promise<string> {
    try {
      const response = await apiClient.post('/auth/sendForgotPasswordCode', email);
      return response.data;
    } catch (error: any) {
      throw this.handleApiError(error);
    }
  }

  async verifyForgotPasswordCode(email: string, code: string): Promise<{ success: boolean; message?: string }> {
    try {
      const response = await apiClient.post('/auth/verifyForgotPasswordCode', { email, code });
      return { success: true, message: response.data.message };
    } catch (error: any) {
      return { success: false, message: error.response?.data?.message || 'Lỗi xác thực mã' };
    }
  }

  async resendForgotPasswordCode(email: string): Promise<string> {
    try {
      const response = await apiClient.post('/auth/resendForgotPasswordCode', email);
      return response.data;
    } catch (error: any) {
      throw this.handleApiError(error);
    }
  }

  // ===================== CHECK EMAIL EXISTS =====================
  async checkEmailExists(email: string): Promise<{ exists: boolean }> {
    try {
      const response = await apiClient.post('/api/register/checkEmailExist', email);
      return { exists: response.data };
    } catch (error: any) {
      // If there's an error, assume email doesn't exist
      return { exists: false };
    }
  }

  // ===================== RESET PASSWORD =====================
  async resetPassword(data: ResetPasswordRequest): Promise<{ success: boolean; error?: string }> {
    try {
      await apiClient.post('/auth/reset-password', data);
      return { success: true };
    } catch (error: any) {
      return { 
        success: false, 
        error: error.response?.data?.message || 'Không thể đặt lại mật khẩu' 
      };
    }
  }

  // ===================== CHANGE PASSWORD =====================
  async changePassword(data: { currentPassword: string; newPassword: string; confirmPassword: string }): Promise<void> {
    try {
      await apiClient.post('/auth/change-password', data);
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

  // ===================== VALIDATION HELPERS =====================
  validateEmailFormat(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  validatePasswordComplexity(password: string): boolean {
    const complexityRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[\W_]).{6,}$/;
    return complexityRegex.test(password);
  }

  // ===================== ERROR HANDLER =====================
  private handleApiError(error: any): Error {
    if (error.response?.data) {
      const apiError = error.response.data;

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
}

export const authService = new AuthService();
