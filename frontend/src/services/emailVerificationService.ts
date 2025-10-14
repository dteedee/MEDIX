import axios from 'axios';

// Base URL for API - có thể config trong .env file
const API_BASE_URL = (import.meta as any).env?.VITE_API_BASE_URL || 'http://localhost:58213';

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
      // Gọi API mới theo endpoint backend
      const response = await apiClient.post('api/register/sendEmailVerified', email, {
        headers: {
          'Content-Type': 'application/json',
        },
      });
      
      // Backend trả về verification code dạng string
      const verificationCode = response.data; // string từ backend
      
      return {
        success: true,
        data: { verificationCode: verificationCode }, // Wrap trong object
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

  // Gửi lại mã xác nhận
  resendVerificationCode: async (email: string) => {
    try {
      // Gọi API resend mới từ backend
      const response = await apiClient.post('api/register/resendEmailVerificationCode', email, {
        headers: {
          'Content-Type': 'application/json',
        },
      });
      
      // Backend trả về verification code mới dạng string
      const verificationCode = response.data; // string từ backend
      
      return {
        success: true,
        data: { verificationCode: verificationCode }, // Wrap trong object
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