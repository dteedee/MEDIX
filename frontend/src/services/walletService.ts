import { apiClient } from '../lib/apiClient';
import { WalletDto, OrderCreateRequest, Order, WalletTransactionDto } from '../types/wallet.types';

class WalletService {
  /**
   * Lấy thông tin ví theo UserId từ token
   * @returns Promise<WalletDto>
   */
  async getWalletByUserId(): Promise<WalletDto> {
    try {
      const response = await apiClient.get<WalletDto>('/wallet/getWallet');
      return response.data;
    } catch (error: any) {
      console.error('Error fetching wallet:', error);
      throw new Error(
        error.response?.data?.message || 
        'Không thể lấy thông tin ví. Vui lòng thử lại.'
      );
    }
  }

  /**
   * Tạo thanh toán để nạp tiền vào ví
   * @param request - Thông tin đơn hàng
   * @returns Promise<Order>
   */
  async createPayment(request: OrderCreateRequest): Promise<Order> {
    try { 
      const response = await apiClient.post<Order>('/receive/create-payment', request);
      return response.data;
    } catch (error: any) {
      console.error('Error creating payment:', error);
      throw new Error(
        error.response?.data?.message || 
        error.response?.data?.error ||
        'Không thể tạo thanh toán. Vui lòng thử lại.'
      );
    }
  }

  /**
   * Lấy lịch sử giao dịch của user hiện tại
   * @returns Promise<WalletTransactionDto[]>
   */
  async getTransactionsByWalletId(): Promise<WalletTransactionDto[]> {
    try {
      const response = await apiClient.get<WalletTransactionDto[]>(`/wallettransaction/getTransactionsByWalletId`);
      return response.data;
    } catch (error: any) {
      console.error('Error fetching transactions:', error);
      throw new Error(
        error.response?.data?.message || 
        'Không thể lấy lịch sử giao dịch. Vui lòng thử lại.'
      );
    }
  }
}

// Export singleton instance
export const walletService = new WalletService();

