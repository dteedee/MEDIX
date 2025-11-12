import { apiClient } from '../lib/apiClient';
import { WalletDto, OrderCreateRequest, Order, WalletTransactionDto, WithdrawalRequest, WithdrawalResponse, TransferTransactionCreateRequest, TransferTransactionDto } from '../types/wallet.types';

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

  /**
   * Rút tiền từ ví về tài khoản ngân hàng
   * @param request - Thông tin rút tiền
   * @returns Promise<WithdrawalResponse>
   */
  async createWithdrawal(request: WithdrawalRequest): Promise<WithdrawalResponse> {
    try {
      const response = await apiClient.post<WithdrawalResponse>('/wallet/withdraw', request);
      return response.data;
    } catch (error: any) {
      console.error('Error creating withdrawal:', error);
      throw new Error(
        error.response?.data?.message || 
        error.response?.data?.error ||
        'Không thể thực hiện rút tiền. Vui lòng thử lại.'
      );
    }
  }

  /**
   * Tạo giao dịch chuyển tiền (Transfer Transaction)
   * @param request - Thông tin chuyển tiền
   * @returns Promise<TransferTransactionDto>
   */
  async createTransferTransaction(request: TransferTransactionCreateRequest): Promise<TransferTransactionDto> {
    try {
      const response = await apiClient.post<TransferTransactionDto>('/transfertransaction/create', request);
      return response.data;
    } catch (error: any) {
      console.error('Error creating transfer transaction:', error);
      throw new Error(
        error.response?.data?.message || 
        error.response?.data?.error ||
        'Không thể thực hiện giao dịch chuyển tiền. Vui lòng thử lại.'
      );
    }
  }

  /**
   * Lấy thông tin giao dịch chuyển tiền theo ID
   * @param id - ID của giao dịch
   * @returns Promise<TransferTransactionDto>
   */
  async getTransferTransactionById(id: string): Promise<TransferTransactionDto> {
    try {
      const response = await apiClient.get<TransferTransactionDto>(`/transfertransaction/${id}`);
      return response.data;
    } catch (error: any) {
      console.error('Error fetching transfer transaction:', error);
      throw new Error(
        error.response?.data?.message || 
        'Không thể lấy thông tin giao dịch. Vui lòng thử lại.'
      );
    }
  }
}

// Export singleton instance
export const walletService = new WalletService();

