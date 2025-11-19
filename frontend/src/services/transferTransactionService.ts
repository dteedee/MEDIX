/**
 * Gửi yêu cầu từ chối (reject) giao dịch chuyển tiền
 */
const rejectTransfer = async (request: TransferAcceptRequest) => {
  // API: POST /api/WithDraw/transfer-Reject
  const response = await apiClient.post('/WithDraw/transfer-Reject', request);
  return response.data;
};
import { apiClient } from '../lib/apiClient';

export interface TransferTransactionDto {
  id: string;
  amount: number;
  description: string;
  toBin: string;
  toAccountNumber: string;
  fromBin?: string;
  fromAccountNumber?: string;
  createdAt: string;
  status: 'Pending' | 'Accepted' | 'Rejected';
  referenceCode?: string;
  walletTransactionID: string;
  userId: string;
}

export interface TransferTransactionCreateRequest {
  amount: number;
  description: string;
  toBin: string;
  toAccountNumber: string;
  userId?: string;
  walletTransactionID?: string;
}

const API_ENDPOINT = '/TransferTransaction';

/**
 * Lấy tất cả giao dịch chuyển tiền (dành cho Manager)
 */
const getAllTransferTransactions = async (): Promise<TransferTransactionDto[]> => {
  try {
    const response = await apiClient.get<TransferTransactionDto[]>(`${API_ENDPOINT}/getAllTransaction`);
 
    return response.data;
  } catch (error) {
    console.error('Error fetching transfer transactions:', error);
    throw error;
  }
};

/**
 * Tạo yêu cầu chuyển tiền / rút tiền
 */
const createTransferTransaction = async (request: TransferTransactionCreateRequest): Promise<TransferTransactionDto> => {
  const response = await apiClient.post<TransferTransactionDto>(`${API_ENDPOINT}/create`, request);
  return response.data;
};
/**
 * Gửi yêu cầu xác nhận (accept) giao dịch chuyển tiền
 */
export interface TransferAcceptRequest {
  TransferTransactionID: string;
}

const acceptTransfer = async (request: TransferAcceptRequest) => {
  // API: POST /api/WithDraw/transfer
  const response = await apiClient.post('/WithDraw/transfer', request);
  return response.data;
};

export const transferTransactionService = {
  getAllTransferTransactions,
  createTransferTransaction,
  acceptTransfer,
  rejectTransfer,
};
