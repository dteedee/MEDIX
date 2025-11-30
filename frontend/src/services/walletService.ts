import { apiClient } from '../lib/apiClient';
import { WalletDto, OrderCreateRequest, Order, WalletTransactionDto, WithdrawalRequest, WithdrawalResponse, TransferTransactionCreateRequest, TransferTransactionDto } from '../types/wallet.types';

class WalletService {
 
  async getWalletByUserId(): Promise<WalletDto> {
    try {
      const response = await apiClient.get<WalletDto>('/wallet/getWallet');
      return response.data;
    } catch (error: any) {
      throw new Error(
        error.response?.data?.message || 
        'Không thể lấy thông tin ví. Vui lòng thử lại.'
      );
    }
  }


  async createPayment(request: OrderCreateRequest): Promise<Order> {
    try { 
      const response = await apiClient.post<Order>('/receive/create-payment', request);
      return response.data;
    } catch (error: any) {
      throw new Error(
        error.response?.data?.message || 
        error.response?.data?.error ||
        'Không thể tạo thanh toán. Vui lòng thử lại.'
      );
    }
  }


  async getTransactionsByWalletId(): Promise<WalletTransactionDto[]> {
    try {
      const response = await apiClient.get<WalletTransactionDto[]>(`/wallettransaction/getTransactionsByWalletId`);
      return response.data;
    } catch (error: any) {
      throw new Error(
        error.response?.data?.message || 
        'Không thể lấy lịch sử giao dịch. Vui lòng thử lại.'
      );
    }
  }

  async createWithdrawal(request: WithdrawalRequest): Promise<WithdrawalResponse> {
    try {
      const response = await apiClient.post<WithdrawalResponse>('/wallet/withdraw', request);
      return response.data;
    } catch (error: any) {
      throw new Error(
        error.response?.data?.message || 
        error.response?.data?.error ||
        'Không thể thực hiện rút tiền. Vui lòng thử lại.'
      );
    }
  }
  async createTransferTransaction(request: TransferTransactionCreateRequest): Promise<TransferTransactionDto> {
    try {
      const response = await apiClient.post<TransferTransactionDto>('/transfertransaction/create', request);
      return response.data;
    } catch (error: any) {
      throw new Error(
        error.response?.data?.message || 
        error.response?.data?.error ||
        'Không thể thực hiện giao dịch chuyển tiền. Vui lòng thử lại.'
      );
    }
  }
  async getTransferTransactionById(id: string): Promise<TransferTransactionDto> {
    try {
      const response = await apiClient.get<TransferTransactionDto>(`/transfertransaction/${id}`);
      return response.data;
    } catch (error: any) {
      throw new Error(
        error.response?.data?.message || 
        'Không thể lấy thông tin giao dịch. Vui lòng thử lại.'
      );
    }
  }
}

export const walletService = new WalletService();

