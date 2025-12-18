export interface WalletDto {
  id?: string;
  userId: string;
  balance: number;
  currency: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface DoctorFeeCommissionDto {
  consultationFee: number;
  commissionRate: number;
}

export interface WalletTransactionDto {
  id?: string;
  walletId?: string;
  orderCode?: number;
  transactionTypeCode?: string;
  amount?: number;
  balanceBefore?: number;
  balanceAfter: number;
  status?: string;
  relatedAppointmentId?: string;
  description?: string;
  transactionDate?: string;
  createdAt?: string;
}

export interface OrderItem {
  name: string;
  quantity: number;
  price: number;
  unit: string;
  taxPercentage: number;
}

export interface OrderItemCreateRequest {
  name: string;
  quantity: number;
  price: number;
  unit: string;
  taxPercentage: number;
}

export interface OrderCreateRequest {
  totalAmount: number;
  description?: string;
  returnUrl?: string;
  cancelUrl?: string;
  buyerName?: string;
  buyerCompanyName?: string;
  buyerEmail?: string;
  buyerPhone?: string;
  buyerAddress?: string;
  expiredAt?: string;
  buyerNotGetInvoice?: boolean;
  taxPercentage?: number;
  baseURLFE?: string;
  items?: OrderItemCreateRequest[];
}

export interface Order {
  id: number;
  orderCode: number;
  totalAmount: number;
  orderDate?: string;
  description: string;
  paymentLinkId: string;
  qrCode: string;
  checkoutUrl: string;
  status: string;
  amount: number;
  amountPaid: number;
  amountRemaining: number;
  buyerName?: string | null;
  buyerCompanyName?: string;
  buyerEmail?: string | null;
  buyerPhone?: string | null;
  buyerAddress?: string | null;
  bin?: string;
  accountNumber?: string;
  accountName?: string;
  currency: string;
  returnUrl: string;
  cancelUrl: string;
  createdAt: string;
  canceledAt?: string | null;
  expiredAt?: string | null;
  lastTransactionUpdate?: string | null;
  cancellationReason?: string | null;
  buyerNotGetInvoice?: boolean;
  taxPercentage?: number;
  items: OrderItem[];
}

export interface BankInfo {
  name: string;
  bin: string;
  shortName?: string;
  code?: string;
  logo?: string;
}

export interface WithdrawalRequest {
  amount: number;
  bankBin: string;
  bankName: string;
  accountNumber: string;
  accountName?: string;
  description?: string;
}

export interface WithdrawalResponse {
  id?: string;
  transactionId?: string;
  status: string;
  message?: string;
}

export interface TransferTransactionCreateRequest {
  amount: number;
  description: string;
  toBin: string;
  toAccountNumber: string;
  userId?: string;
  walletTransactionID?: string;
}

export interface TransferTransactionDto {
  id: string;
  amount: number;
  description: string;
  toBin: string;
  toAccountNumber: string;
  userId?: string;
  walletTransactionID?: string;
  status?: string;
  createdAt?: string;
  updatedAt?: string;
}

