import axios from 'axios';

// Base URL for API - có thể config trong .env file
const API_BASE_URL = 'https://localhost:7000/api';

// Create axios instance with default config
const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Email verification service
export const emailVerificationService = {
  // Gửi mã xác nhận đến email
  sendVerificationCode: async (email: string) => {
    try {
      const response = await apiClient.post('/auth/send-verification-email', {
        email: email
      });
      return {
        success: true,
        data: response.data,
        message: 'Mã xác nhận đã được gửi đến email của bạn'
      };
    } catch (error: any) {
      console.error('Error sending verification email:', error);
      return {
        success: false,
        error: error.response?.data?.message || 'Có lỗi xảy ra khi gửi email xác nhận',
        status: error.response?.status
      };
    }
  },

  // Xác nhận mã email
  verifyEmailCode: async (email: string, verificationCode: string) => {
    try {
      const response = await apiClient.post('/auth/verify-email', {
        email: email,
        verificationCode: verificationCode
      });
      return {
        success: true,
        data: response.data,
        message: 'Email đã được xác nhận thành công'
      };
    } catch (error: any) {
      console.error('Error verifying email code:', error);
      return {
        success: false,
        error: error.response?.data?.message || 'Mã xác nhận không đúng hoặc đã hết hạn',
        status: error.response?.status
      };
    }
  },

  // Gửi lại mã xác nhận
  resendVerificationCode: async (email: string) => {
    try {
      const response = await apiClient.post('/auth/resend-verification-email', {
        email: email
      });
      return {
        success: true,
        data: response.data,
        message: 'Mã xác nhận mới đã được gửi đến email của bạn'
      };
    } catch (error: any) {
      console.error('Error resending verification email:', error);
      return {
        success: false,
        error: error.response?.data?.message || 'Có lỗi xảy ra khi gửi lại email xác nhận',
        status: error.response?.status
      };
    }
  }
};

// Export default
export default emailVerificationService;