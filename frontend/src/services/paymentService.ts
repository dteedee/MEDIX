import { apiClient } from '../lib/apiClient';

export interface ItemData {
  name: string;
  quantity: number;
  price: number;
}

export interface PaymentResponse {
  success: boolean;
  checkoutUrl?: string;
  error?: string;
}

export interface EmbeddedPaymentConfig {
  checkoutUrl: string;
  elementId: string;
  onSuccess?: (event: any) => void;
  onCancel?: (event: any) => void;
}

class PaymentService {
  /**
   * Tạo link thanh toán PayOS sử dụng apiClient (fallback method)
   * @param itemData - Thông tin sản phẩm/dịch vụ
   * @returns Promise<PaymentResponse>
   */
  async createPaymentLinkXHR(itemData: ItemData): Promise<PaymentResponse> {
    try {
      console.log('Creating payment link with apiClient (fallback method):', itemData);
      
      // Sử dụng apiClient với cấu hình khác để thử lại
      const response = await apiClient.post('/payos/create-payment-link', itemData, {
        // Cấu hình khác để thử lại
        timeout: 10000, // 10 giây timeout
        // Thêm headers bổ sung
        headers: {
          'Accept': 'application/json',
          'Cache-Control': 'no-cache'
        }
      });

      console.log('Fallback API Response status:', response.status);
      console.log('Fallback API Response data:', response.data);
      
      // API mới trả về trực tiếp checkoutUrl trong response body
      const checkoutUrl = response.data;
      console.log('Fallback Checkout URL from response:', checkoutUrl);
      
      if (checkoutUrl && typeof checkoutUrl === 'string') {
        let fullCheckoutUrl = checkoutUrl;
        if (checkoutUrl.startsWith('/')) {
          fullCheckoutUrl = 'https://pay.payos.vn' + checkoutUrl;
        }
        
        console.log('Fallback Full checkout URL:', fullCheckoutUrl);
        return {
          success: true,
          checkoutUrl: fullCheckoutUrl
        };
      }
      
      return {
        success: false,
        error: `Không thể lấy URL thanh toán từ fallback response. Status: ${response.status}`
      };
    } catch (error: any) {
      console.error('Error creating payment link with apiClient fallback:', error);
      return {
        success: false,
        error: 'Có lỗi xảy ra khi tạo link thanh toán với fallback method.'
      };
    }
  }

  /**
   * Tạo link thanh toán PayOS sử dụng apiClient
   * @param itemData - Thông tin sản phẩm/dịch vụ
   * @returns Promise<PaymentResponse>
   */
  async createPaymentLink(itemData: ItemData): Promise<PaymentResponse> {
    try {
      console.log('Creating payment link with apiClient:', itemData);
      
      // Sử dụng apiClient để gọi API
      const response = await apiClient.post('/payos/create-payment-link', itemData);

      console.log('API Response status:', response.status);
      console.log('API Response data:', response.data);
      
      // API mới trả về trực tiếp checkoutUrl trong response body
      const checkoutUrl = response.data;
      console.log('Checkout URL from response:', checkoutUrl);
      
      if (checkoutUrl && typeof checkoutUrl === 'string') {
        // Xử lý relative URL - nếu Location chỉ có path, thêm domain
        let fullCheckoutUrl = checkoutUrl;
        if (checkoutUrl.startsWith('/')) {
          fullCheckoutUrl = 'https://pay.payos.vn' + checkoutUrl;
        }
        
        console.log('Full checkout URL:', fullCheckoutUrl);
        return {
          success: true,
          checkoutUrl: fullCheckoutUrl
        };
      } else {
        return {
          success: false,
          error: 'Không thể lấy URL thanh toán từ response.'
        };
      }
    } catch (error: any) {
      console.error('Error creating payment link with apiClient:', error);
      
      // Nếu apiClient thất bại, thử XHR như fallback
      try {
        console.log('apiClient failed, trying XHR fallback...');
        return await this.createPaymentLinkXHR(itemData);
      } catch (xhrError) {
        console.error('Error creating payment link with XHR:', xhrError);
        return {
          success: false,
          error: 'Có lỗi xảy ra khi tạo link thanh toán. Vui lòng thử lại.'
        };
      }
    }
  }

  /**
   * Tạo ItemData cho việc khám bác sĩ
   * @param doctorName - Tên bác sĩ
   * @param consultationFee - Phí khám
   * @returns ItemData
   */
  createDoctorConsultationItem(doctorName: string, consultationFee: number): ItemData {
    return {
      name: `Khám bác sĩ ${doctorName}`,
      quantity: 1,
      price: consultationFee
    };
  }

  /**
   * Tạo cấu hình để nhúng PayOS vào trang
   * @param checkoutUrl - URL thanh toán
   * @param elementId - ID của element để nhúng
   * @param onSuccess - Callback khi thanh toán thành công
   * @param onCancel - Callback khi hủy thanh toán
   * @returns EmbeddedPaymentConfig
   */
  createEmbeddedPaymentConfig(
    checkoutUrl: string, 
    elementId: string = 'embedded-payment-container',
    onSuccess?: (event: any) => void,
    onCancel?: (event: any) => void
  ): EmbeddedPaymentConfig {
    return {
      checkoutUrl,
      elementId,
      onSuccess: onSuccess || ((event: any) => {
        console.log('Payment successful:', event);
        alert('Thanh toán thành công!');
      }),
      onCancel: onCancel || ((event: any) => {
        console.log('Payment cancelled:', event);
        alert('Thanh toán đã bị hủy.');
      })
    };
  }

  /**
   * Chuyển hướng đến trang thanh toán PayOS
   * @param checkoutUrl - URL thanh toán
   */
  redirectToPayment(checkoutUrl: string): void {
    console.log('Attempting to redirect to:', checkoutUrl);
    
    // Kiểm tra URL hợp lệ
    if (!checkoutUrl || checkoutUrl.trim() === '') {
      console.error('Invalid checkout URL:', checkoutUrl);
      alert('URL thanh toán không hợp lệ.');
      return;
    }
    
    // Kiểm tra URL có phải là HTTPS hoặc HTTP
    if (!checkoutUrl.startsWith('http://') && !checkoutUrl.startsWith('https://')) {
      console.error('URL không có protocol:', checkoutUrl);
      alert('URL thanh toán không hợp lệ.');
      return;
    }
    
    // Thử nhiều cách redirecionamento
    try {
      // Cách 1: window.location.href (thay thế trang hiện tại)
      window.location.replace(checkoutUrl);
    } catch (error) {
      console.error('Error with window.location.replace:', error);
      
      try {
        // Cách 2: window.location.href (thêm vào history)
        window.location.href = checkoutUrl;
      } catch (error2) {
        console.error('Error with window.location.href:', error2);
        
        try {
          // Cách 3: window.location.assign
          window.location.assign(checkoutUrl);
        } catch (error3) {
          console.error('Error with window.location.assign:', error3);
          
          try {
            // Cách 4: window.open
            window.open(checkoutUrl, '_self');
          } catch (error4) {
            console.error('Error with window.open:', error4);
            
            // Cách 5: Tạo link và click
            const link = document.createElement('a');
            link.href = checkoutUrl;
            link.target = '_self';
            link.style.display = 'none';
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
          }
        }
      }
    }
  }
}

export default new PaymentService();
