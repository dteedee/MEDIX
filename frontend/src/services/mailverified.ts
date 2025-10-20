import { apiClient } from '../lib/apiClient';

// Email verification service
export const emailVerificationService = {
  // Gửi mã xác nhận đến email
  sendVerificationCode: async (email: string) => {
    try {
      // Gọi API mới theo endpoint backend
      const response = await apiClient.post('/register/sendEmailVerified', JSON.stringify(email));
      
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
      const response = await apiClient.post('/register/resendEmailVerificationCode', JSON.stringify(email));
      
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
  },

  // Xác thực mã email code
  verifyEmailCode: async (email: string, code: string) => {
    try {
      console.log('Sending verification request:', { email, code }); // Debug log
      
      const response = await apiClient.post('/register/verifyEmailCode', {
        email: email,
        code: code
      });
      
      console.log('Verification response:', response.data); // Debug log
      
      // Backend trả về HTTP 200 với { message: "Xác thực thành công" } khi thành công
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
      console.error('Error verifying email code:', error);
      console.error('Error details:', error.response?.data);
      
      // Backend trả về BadRequest (400) với { message: "..." } khi có lỗi
      if (error.response?.status === 400) {
        const errorMessage = error.response.data?.message || 'Mã xác thực không hợp lệ';
        return {
          success: false,
          error: errorMessage,
          status: error.response?.status
        };
      }
      
      // Các lỗi khác (network, 500, etc.)
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