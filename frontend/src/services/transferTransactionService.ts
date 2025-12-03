
const rejectTransfer = async (request: TransferAcceptRequest) => {
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


const getAllTransferTransactions = async (): Promise<TransferTransactionDto[]> => {
  try {
    const response = await apiClient.get<TransferTransactionDto[]>(`${API_ENDPOINT}/getAllTransaction`);
 
    return response.data;
  } catch (error) {
    throw error;
  }
};


const createTransferTransaction = async (request: TransferTransactionCreateRequest): Promise<TransferTransactionDto> => {
  const response = await apiClient.post<TransferTransactionDto>(`${API_ENDPOINT}/create`, request);
  return response.data;
};

export interface TransferAcceptRequest {
  TransferTransactionID: string;
}

const acceptTransfer = async (request: TransferAcceptRequest) => {
  const response = await apiClient.post('/WithDraw/transfer', request);
  return response.data;
};

export const transferTransactionService = {
  getAllTransferTransactions,
  createTransferTransaction,
  acceptTransfer,
  rejectTransfer,
};
