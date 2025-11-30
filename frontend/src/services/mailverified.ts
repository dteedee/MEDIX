import axios from 'axios';

import { apiClient } from "../lib/apiClient";

export const emailVerificationService = {
  sendVerificationCode: async (email: string) => {
    try {
      const response = await apiClient.post('/register/sendEmailVerified', JSON.stringify(email), {
        headers: {
          'Content-Type': 'application/json',
        },
      });
      
      const verificationCode = response.data; 
      
      return {
        success: true,
        data: { verificationCode: verificationCode }, 
        message: 'Mã xác nhận đã được gửi đến email của bạn'
      };
    } catch (error: any) {
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
      const response = await apiClient.post('/register/resendEmailVerificationCode', JSON.stringify(email), {
        headers: {
          'Content-Type': 'application/json',
        },
      });
      
      const verificationCode = response.data; 
      
      return {
        success: true,
        data: { verificationCode: verificationCode }, 
        message: 'Mã xác nhận mới đã được gửi đến email của bạn'
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.response?.data?.message || 'Có lỗi xảy ra khi gửi lại email xác nhận',
        status: error.response?.status
      };
    }
  },

  verifyEmailCode: async (email: string, code: string) => {
    try {
      
      const response = await apiClient.post('register/verifyEmailCode', {
        email: email,
        code: code
      });
      
      
      if (response.status === 200) {
        return {
          success: true,
          data: response.data,
          message: response.data.message || 'Xác thực thành công'
        };
      } else {
        return {
          success: false,
          error: response.data?.message || 'Mã xác thực không đúng',
          data: response.data
        };
      }
    } catch (error: any) {
      
      if (error.response?.status === 400) {
        const errorMessage = error.response.data?.message || 'Mã xác thực không hợp lệ';
        return {
          success: false,
          error: errorMessage,
          status: error.response?.status
        };
      }
      
      const errorMessage = error.response?.data?.message || 'Có lỗi xảy ra khi xác thực mã, vui lòng thử lại';
      
      return {
        success: false,
        error: errorMessage,
        status: error.response?.status
      };
    }
  }
};

// Export default
export default emailVerificationService;