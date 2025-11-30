import { apiClient } from '../lib/apiClient';

export interface ItemData {
  name: string;
  quantity: number;
  price: number;
  doctorId?: string;
  appointmentStartTime?: string;
  appointmentEndTime?: string;
  promotionCode?: string;
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

  async createPaymentLinkXHR(itemData: ItemData): Promise<PaymentResponse> {
    try {
      
      const response = await apiClient.post('/payos/create-payment-link', itemData, {
        timeout: 10000,       
        headers: {
          'Accept': 'application/json',
          'Cache-Control': 'no-cache'
        }
      });

      
      const checkoutUrl = response.data;
      
      if (checkoutUrl && typeof checkoutUrl === 'string') {
        let fullCheckoutUrl = checkoutUrl;
        if (checkoutUrl.startsWith('/')) {
          fullCheckoutUrl = 'https://pay.payos.vn' + checkoutUrl;
        }
        
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
      return {
        success: false,
        error: 'Có lỗi xảy ra khi tạo link thanh toán với fallback method.'
      };
    }
  }

  
  async createPaymentLink(itemData: ItemData): Promise<PaymentResponse> {
    try {
      
      const response = await apiClient.post('/payos/create-payment-link', itemData);

      
      const checkoutUrl = response.data;
      
      if (checkoutUrl && typeof checkoutUrl === 'string') {
        let fullCheckoutUrl = checkoutUrl;
        if (checkoutUrl.startsWith('/')) {
          fullCheckoutUrl = 'https://pay.payos.vn' + checkoutUrl;
        }
        
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
      
      try {
        return await this.createPaymentLinkXHR(itemData);
      } catch (xhrError) {
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
   * @param doctorId - ID của bác sĩ (optional)
   * @param appointmentStartTime - Thời gian bắt đầu lịch hẹn (optional)
   * @param appointmentEndTime - Thời gian kết thúc lịch hẹn (optional)
   * @param promotionCode - Mã khuyến mãi (optional)
   * @returns ItemData
   */
  createDoctorConsultationItem(
    doctorName: string, 
    consultationFee: number,
    doctorId?: string,
    appointmentStartTime?: string,
    appointmentEndTime?: string,
    promotionCode?: string
  ): ItemData {
    return {
      name: `Khám bác sĩ ${doctorName}`,
      quantity: 1,
      price: consultationFee,
      doctorId,
      appointmentStartTime,
      appointmentEndTime,
      promotionCode
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
        alert('Thanh toán thành công!');
      }),
      onCancel: onCancel || ((event: any) => {
        alert('Thanh toán đã bị hủy.');
      })
    };
  }

  
  redirectToPayment(checkoutUrl: string): void {
    
    if (!checkoutUrl || checkoutUrl.trim() === '') {
      alert('URL thanh toán không hợp lệ.');
      return;
    }
    
    if (!checkoutUrl.startsWith('http://') && !checkoutUrl.startsWith('https://')) {
      alert('URL thanh toán không hợp lệ.');
      return;
    }
    
    try {
      window.location.replace(checkoutUrl);
    } catch (error) {
      
      try {
        window.location.href = checkoutUrl;
      } catch (error2) {
        
        try {
          window.location.assign(checkoutUrl);
        } catch (error3) {
          
          try {
            window.open(checkoutUrl, '_self');
          } catch (error4) {
            
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