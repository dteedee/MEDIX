import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { walletService } from '../../services/walletService';
import { WalletDto, OrderCreateRequest, WalletTransactionDto, BankInfo, WithdrawalRequest, TransferTransactionCreateRequest } from '../../types/wallet.types';
import styles from '../../styles/doctor/DoctorWallet.module.css';
import { Wallet2, TrendingUp, TrendingDown, ArrowUpCircle, ArrowDownCircle, PlusCircle, Clock, Calendar } from 'lucide-react';
import { PageLoader } from '../../components/ui';
import { useToast } from '../../contexts/ToastContext';

type TabType = 'all' | 'deposit' | 'withdrawal' | 'salary' | 'expense';

const BANKS: BankInfo[] = [
  { name: 'Ngân hàng TMCP Ngoại thương Việt Nam', bin: '970436', shortName: 'Vietcombank', code: 'VCB', logo: 'https://api.vietqr.io/img/VCB.png' },
  { name: 'Ngân hàng Nông nghiệp và Phát triển Nông thôn Việt Nam', bin: '970405', shortName: 'Agribank', code: 'VBA', logo: 'https://api.vietqr.io/img/VBA.png' },
  { name: 'Ngân hàng TMCP Công Thương Việt Nam', bin: '970415', shortName: 'VietinBank', code: 'CTG', logo: 'https://api.vietqr.io/img/CTG.png' },
  { name: 'Ngân hàng Đầu tư và Phát triển Việt Nam', bin: '970418', shortName: 'BIDV', code: 'BID', logo: 'https://api.vietqr.io/img/BIDV.png' },
  { name: 'Ngân hàng TMCP Á Châu', bin: '970416', shortName: 'ACB', code: 'ACB', logo: 'https://api.vietqr.io/img/ACB.png' },
  { name: 'Ngân hàng TMCP Kỹ Thương Việt Nam', bin: '970407', shortName: 'Techcombank', code: 'TCB', logo: 'https://api.vietqr.io/img/TCB.png' },
  { name: 'Ngân hàng TMCP Việt Nam Thịnh Vượng', bin: '970432', shortName: 'VPBank', code: 'VPB', logo: 'https://api.vietqr.io/img/VPB.png' },
  { name: 'Ngân hàng TMCP Phương Đông', bin: '970448', shortName: 'OCB', code: 'OCB', logo: 'https://api.vietqr.io/img/OCB.png' },
  { name: 'Ngân hàng TMCP Bưu Điện Liên Việt', bin: '970449', shortName: 'LienVietPostBank', code: 'LPB', logo: 'https://api.vietqr.io/img/LPB.png' },
  { name: 'Ngân hàng TMCP Sài Gòn - Hà Nội', bin: '970443', shortName: 'SHB', code: 'SHB', logo: 'https://api.vietqr.io/img/SHB.png' },
  { name: 'Ngân hàng TMCP Tiên Phong', bin: '970423', shortName: 'TPBank', code: 'TPB', logo: 'https://api.vietqr.io/img/TPB.png' },
  { name: 'Ngân hàng TMCP Đông Nam Á', bin: '970440', shortName: 'SeABank', code: 'SEA', logo: 'https://api.vietqr.io/img/SEAB.png' },
  { name: 'Ngân hàng TMCP Quân Đội', bin: '970422', shortName: 'MB', code: 'MBB', logo: 'https://api.vietqr.io/img/MB.png' },
  { name: 'Ngân hàng TMCP Hàng Hải', bin: '970426', shortName: 'MSB', code: 'MSB', logo: 'https://api.vietqr.io/img/MSB.png' },
  { name: 'Ngân hàng TMCP Quốc tế Việt Nam', bin: '970441', shortName: 'VIB', code: 'VIB', logo: 'https://api.vietqr.io/img/VIB.png' },
  { name: 'Ngân hàng TMCP Quốc Dân', bin: '970419', shortName: 'NCB', code: 'NCB', logo: 'https://api.vietqr.io/img/NCB.png' },
  { name: 'Ngân hàng TMCP Xăng dầu Petrolimex', bin: '970430', shortName: 'PGBank', code: 'PGB', logo: 'https://api.vietqr.io/img/PGB.png' },
  { name: 'Ngân hàng TNHH Một Thành Viên Xây Dựng Việt Nam', bin: '970444', shortName: 'CB', code: 'CBB', logo: 'https://api.vietqr.io/img/CBB.png' },
  { name: 'Ngân hàng TMCP Sài Gòn', bin: '970429', shortName: 'SCB', code: 'SCB', logo: 'https://api.vietqr.io/img/SCB.png' },
  { name: 'Ngân hàng TMCP Xuất Nhập khẩu Việt Nam', bin: '970431', shortName: 'Eximbank', code: 'EIB', logo: 'https://api.vietqr.io/img/EIB.png' },
  { name: 'Ngân hàng TMCP An Bình', bin: '970425', shortName: 'ABBANK', code: 'ABB', logo: 'https://api.vietqr.io/img/ABB.png' },
  { name: 'Ngân hàng TMCP Bản Việt', bin: '970427', shortName: 'VietCapitalBank', code: 'VCB', logo: 'https://api.vietqr.io/img/VCB.png' },
  { name: 'Ngân hàng TMCP Việt Á', bin: '970433', shortName: 'VietABank', code: 'VAB', logo: 'https://api.vietqr.io/img/VAB.png' },
  { name: 'Ngân hàng TMCP Việt Nam Thương Tín', bin: '970434', shortName: 'VietBank', code: 'VTB', logo: 'https://api.vietqr.io/img/VTB.png' },
  { name: 'Ngân hàng TMCP Phát triển Thành phố Hồ Chí Minh', bin: '970437', shortName: 'HDBank', code: 'HDB', logo: 'https://api.vietqr.io/img/HDB.png' },
  { name: 'Ngân hàng TMCP Sài Gòn Thương Tín', bin: '970439', shortName: 'Sacombank', code: 'STB', logo: 'https://api.vietqr.io/img/STB.png' },
  { name: 'Ngân hàng TMCP Bắc Á', bin: '970409', shortName: 'BacABank', code: 'BAB', logo: 'https://api.vietqr.io/img/BAB.png' },
  { name: 'Ngân hàng TMCP Kiên Long', bin: '970452', shortName: 'KienLongBank', code: 'KLB', logo: 'https://api.vietqr.io/img/KLB.png' },
  { name: 'Ngân hàng TMCP Đại Dương', bin: '970414', shortName: 'OceanBank', code: 'OCE', logo: 'https://api.vietqr.io/img/OCEANBANK.png' },
  { name: 'Ngân hàng TMCP Dầu Khí Toàn Cầu', bin: '970438', shortName: 'GPBank', code: 'GPB', logo: 'https://api.vietqr.io/img/GPB.png' },
  { name: 'Ngân hàng TMCP Đông Á', bin: '970406', shortName: 'DongABank', code: 'DAB', logo: 'https://api.vietqr.io/img/DAB.png' },
  { name: 'Ngân hàng TNHH Một Thành Viên Standard Chartered', bin: '970410', shortName: 'Standard Chartered', code: 'SCB', logo: 'https://api.vietqr.io/img/SCB.png' },
  { name: 'Ngân hàng TNHH Một Thành Viên Shinhan Việt Nam', bin: '970424', shortName: 'Shinhan Bank', code: 'SHB', logo: 'https://api.vietqr.io/img/SHB.png' },
  { name: 'Ngân hàng TMCP Nam Á', bin: '970428', shortName: 'NamABank', code: 'NAB', logo: 'https://api.vietqr.io/img/NAB.png' },
  { name: 'Ngân hàng KEB HANA - Chi nhánh TP.HCM', bin: '970466', shortName: 'KEB Hana Bank', code: 'KEB', logo: 'https://api.vietqr.io/img/KEBHANABANK.png' },
  { name: 'Ngân hàng Industrial Bank of Korea - Chi nhánh TP.HCM', bin: '970456', shortName: 'IBK', code: 'IBK', logo: 'https://api.vietqr.io/img/IBK.png' }
];

export const DoctorWallet: React.FC = () => {
  const { user } = useAuth();
  const { showToast } = useToast();
  const [wallet, setWallet] = useState<WalletDto | null>(null);
  const [transactions, setTransactions] = useState<WalletTransactionDto[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [loadingTransactions, setLoadingTransactions] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [depositAmount, setDepositAmount] = useState<string>('');
  const [withdrawalAmount, setWithdrawalAmount] = useState<string>('');
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [isProcessingWithdrawal, setIsProcessingWithdrawal] = useState<boolean>(false);
  const [activeTab, setActiveTab] = useState<TabType>('all');
  const [showWithdrawalModal, setShowWithdrawalModal] = useState<boolean>(false);
  const [selectedBank, setSelectedBank] = useState<BankInfo | null>(null);
  const [accountNumber, setAccountNumber] = useState<string>('');
  const [accountName, setAccountName] = useState<string>('');
  const [showWithdrawalConfirm, setShowWithdrawalConfirm] = useState<boolean>(false);
  const [bankSearchTerm, setBankSearchTerm] = useState<string>('');
  const [banksWithLogos, setBanksWithLogos] = useState<BankInfo[]>(BANKS);
  const accountNumberInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const fetchBanksFromAPI = async () => {
      try {
        const response = await fetch('https://api.vietqr.io/v2/banks');
        const data = await response.json();
        if (data.code === '00' && data.data) {
          const bankMap = new Map<string, string>();
          data.data.forEach((bank: any) => {
            if (bank.bin && bank.logo) {
              bankMap.set(bank.bin, bank.logo);
            }
          });
          
          const updatedBanks = BANKS.map(bank => {
            const logoFromAPI = bankMap.get(bank.bin);
            return {
              ...bank,
              logo: logoFromAPI || bank.logo
            };
          });
          setBanksWithLogos(updatedBanks);
        }
      } catch (err) {
        setBanksWithLogos(BANKS);
      }
    };

    fetchBanksFromAPI();
  }, []);

  useEffect(() => {
    const fetchWallet = async () => {
      try {
        setLoading(true);
        setError(null);
        const walletData = await walletService.getWalletByUserId().catch(() => null);
        setWallet(walletData);
        await fetchTransactions();
      } catch (err: any) {
        setError(err.message || 'Không thể tải thông tin ví');
      } finally {
        setLoading(false);
      }
    };

    fetchWallet();

    const urlParams = new URLSearchParams(window.location.search);
    const paymentSuccess = urlParams.get('payment_success');
    if (paymentSuccess === 'true') {
      setTimeout(() => {
        fetchTransactions();
      }, 1000);
    }
  }, []);

  const fetchTransactions = async () => {
    try {
      setLoadingTransactions(true);
      const transactionData = await walletService.getTransactionsByWalletId();
      setTransactions(transactionData);
    } catch (err: any) {
    } finally {
      setLoadingTransactions(false);
    }
  };

  const formatBalance = (balance: number, currency: string): string => {
    const formatted = new Intl.NumberFormat('vi-VN').format(balance);
    return `${formatted} ${currency}`;
  };

  const formatCurrencyCompact = (value: number): string => {
    const amount = value || 0;
    const abs = Math.abs(amount);

    if (abs >= 1_000_000_000) {
      const compact = amount / 1_000_000_000;
      const text = compact % 1 === 0 ? compact.toFixed(0) : compact.toFixed(1);
      return `${text}B VND`;
    }

    if (abs >= 1_000_000) {
      const compact = amount / 1_000_000;
      const text = compact % 1 === 0 ? compact.toFixed(0) : compact.toFixed(1);
      return `${text}M VND`;
    }

    return `${amount.toLocaleString('vi-VN')} VND`;
  };

  const formatNumberInput = (value: string): string => {
    const numericValue = value.replace(/\./g, '');
    if (numericValue === '') return '';
    const number = parseFloat(numericValue);
    if (isNaN(number)) return '';
    return number.toLocaleString('vi-VN');
  };

  const parseFormattedNumber = (value: string): number => {
    const numericValue = value.replace(/\./g, '');
    return parseFloat(numericValue) || 0;
  };

  const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const inputValue = e.target.value;
    const formatted = formatNumberInput(inputValue);
    setDepositAmount(formatted);
  };

  const handleWithdrawalAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const inputValue = e.target.value;
    const formatted = formatNumberInput(inputValue);
    setWithdrawalAmount(formatted);
  };

  const handleOpenWithdrawalModal = () => {
    const amount = withdrawalAmount ? parseFormattedNumber(withdrawalAmount) : parseFormattedNumber(depositAmount);
    if (!amount || amount <= 0) {
      alert('Vui lòng nhập số tiền hợp lệ');
      return;
    }
    if (!wallet || amount > wallet.balance) {
      alert('Số tiền rút không được vượt quá số dư ví');
      return;
    }
    if (!withdrawalAmount && depositAmount) {
      setWithdrawalAmount(depositAmount);
    }
    setShowWithdrawalModal(true);
    setShowWithdrawalConfirm(false);
    setSelectedBank(null);
    setAccountNumber('');
    setAccountName('');
    setBankSearchTerm('');
  };

  const handleBankSelect = (bank: BankInfo) => {
    setSelectedBank(bank);
    setTimeout(() => {
      accountNumberInputRef.current?.scrollIntoView({ 
        behavior: 'smooth', 
        block: 'center' 
      });
      setTimeout(() => {
        accountNumberInputRef.current?.focus();
      }, 300);
    }, 100);
  };

  const handleAccountNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    const numericValue = value.replace(/\D/g, '');
    setAccountNumber(numericValue);
  };

  const handleAccountNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    const englishOnly = value.replace(/[^A-Za-z\s]/g, '');
    setAccountName(englishOnly.toUpperCase());
  };

  const handleConfirmWithdrawal = () => {
    if (!selectedBank) {
      alert('Vui lòng chọn ngân hàng');
      return;
    }
    if (!accountNumber || accountNumber.trim() === '') {
      alert('Vui lòng nhập số tài khoản');
      return;
    }
    if (!/^\d+$/.test(accountNumber)) {
      alert('Số tài khoản chỉ được chứa số');
      return;
    }
    if (!accountName || accountName.trim() === '') {
      alert('Vui lòng nhập tên chủ tài khoản');
      return;
    }
    if (!/^[A-Za-z\s]+$/.test(accountName)) {
      alert('Tên chủ tài khoản chỉ được chứa chữ cái tiếng Anh và khoảng trắng');
      return;
    }
    setShowWithdrawalConfirm(true);
  };

  const handleSubmitWithdrawal = async () => {
    if (!selectedBank || !accountNumber || !accountName) return;
    
    if (!/^\d+$/.test(accountNumber)) {
      showToast('Số tài khoản chỉ được chứa số', 'error');
      return;
    }
    
    if (!/^[A-Za-z\s]+$/.test(accountName)) {
      showToast('Tên chủ tài khoản chỉ được chứa chữ cái tiếng Anh và khoảng trắng', 'error');
      return;
    }

    const amount = parseFormattedNumber(withdrawalAmount || depositAmount);
    if (!amount || amount <= 0) {
      showToast('Vui lòng nhập số tiền hợp lệ', 'error');
      return;
    }

    setIsProcessingWithdrawal(true);
    try {
      const transferRequest: TransferTransactionCreateRequest = {
        amount: Math.round(amount),
        description: `Rút tiền về ${selectedBank.shortName || selectedBank.name} - STK: ${accountNumber.trim()} - Chủ TK: ${accountName.trim()}`,
        toBin: selectedBank.bin,
        toAccountNumber: accountNumber.trim()
      };

      const result = await walletService.createTransferTransaction(transferRequest);
      
      setWithdrawalAmount('');
      setDepositAmount('');
      setShowWithdrawalModal(false);
      setShowWithdrawalConfirm(false);
      setSelectedBank(null);
      setAccountNumber('');
      setAccountName('');
      setBankSearchTerm('');
      
      showToast('Yêu cầu rút tiền đã được gửi thành công!', 'success');
      
      const walletData = await walletService.getWalletByUserId();
      setWallet(walletData);
      await fetchTransactions();
    } catch (err: any) {
      let errorMessage = 'Có lỗi xảy ra khi rút tiền. Vui lòng thử lại.';
      
      if (err.response?.data?.message) {
        errorMessage = err.response.data.message;
      } else if (err.message) {
        errorMessage = err.message;
      }
      
      showToast(errorMessage, 'error');
    } finally {
      setIsProcessingWithdrawal(false);
    }
  };

  const handleDeposit = async () => {
    const amount = parseFormattedNumber(depositAmount);
    if (!amount || amount <= 0) {
      alert('Vui lòng nhập số tiền hợp lệ');
      return;
    }

    setIsProcessing(true);
    try {
      const amountFormatted = amount.toLocaleString('vi-VN');
      const description = `Nạp tiền ${amountFormatted}đ`.substring(0, 50);

      const paymentRequest: OrderCreateRequest = {
        totalAmount: Math.round(amount),
        description: description,
        items: [
          {
            name: 'Nạp tiền vào ví',
            quantity: 1,
            price: Math.round(amount),
            unit: 'VND',
            taxPercentage: 0
          }
        ],
        buyerName: user?.fullName || 'Bác sĩ',
        buyerEmail: user?.email || '',
        buyerPhone: user?.phoneNumber || '',
        buyerAddress: user?.address || '',
        buyerCompanyName: 'Medix',
        buyerNotGetInvoice: true,
        taxPercentage: 0,
        returnUrl: undefined,
        cancelUrl: undefined,
        expiredAt: undefined,
        baseURLFE: window.location.origin
      };

      const order = await walletService.createPayment(paymentRequest);
      
      if (order && order.checkoutUrl) {
        try {
          localStorage.setItem('lastPaymentOrder', JSON.stringify({
            ...order,
            requestedAmount: amount,
            timestamp: new Date().toISOString()
          }));
        } catch (storageError) {
        }
        
        window.location.href = order.checkoutUrl;
      } else {
        throw new Error('Không nhận được link thanh toán từ server');
      }
    } catch (err: any) {
      let errorMessage = 'Có lỗi xảy ra khi nạp tiền. Vui lòng thử lại.';
      
      if (err.response?.data?.message) {
        errorMessage = err.response.data.message;
      } else if (err.message) {
        errorMessage = err.message;
      }
      
      alert(errorMessage);
      setIsProcessing(false);
    }
  };

  const getTransactionTypeName = (typeCode: string | undefined, transaction?: WalletTransactionDto): string => {
    if (transaction && isServicePackagePurchase(transaction)) {
      return 'Mua gói dịch vụ';
    }
    
    if (!typeCode) return 'Giao dịch';
    
    const typeMap: { [key: string]: string } = {
      'AppointmentPayment': 'Thanh toán cuộc hẹn',
      'AppointmentRefund': 'Hoàn tiền cuộc hẹn',
      'Deposit': 'Nạp tiền',
      'DoctorSalary': 'Lương bác sĩ',
      'SystemCommission': 'Hoa hồng hệ thống',
      'Withdrawal': 'Rút tiền',
      'ServicePackagePurchase': 'Mua gói dịch vụ',
      'TierUpgrade': 'Mua gói dịch vụ'
    };
    
    return typeMap[typeCode] || typeCode;
  };

  const getTransactionTypeIcon = (typeCode: string | undefined, transaction?: WalletTransactionDto): string => {
    if (transaction && isServicePackagePurchase(transaction)) {
      return 'bi-box-seam';
    }
    
    if (!typeCode) return 'bi-arrow-left-right';
    
    const iconMap: { [key: string]: string } = {
      'AppointmentPayment': 'bi-calendar-check',
      'AppointmentRefund': 'bi-arrow-counterclockwise',
      'Deposit': 'bi-cash-coin',
      'DoctorSalary': 'bi-wallet2',
      'SystemCommission': 'bi-percent',
      'Withdrawal': 'bi-cash-stack',
      'ServicePackagePurchase': 'bi-box-seam',
      'TierUpgrade': 'bi-box-seam'
    };
    
    return iconMap[typeCode] || 'bi-arrow-left-right';
  };

  const isServicePackagePurchase = (transaction: WalletTransactionDto): boolean => {
    if (!transaction) return false;
    
    const desc = (transaction.description || '').toLowerCase();
    const servicePackageKeywords = [
      'service tier',
      'service package',
      'gói dịch vụ',
      'upgrade package',
      'tier upgrade',
      'doctor paid for service tier',
      'doctor paid for service package'
    ];
    
    if (servicePackageKeywords.some(keyword => desc.includes(keyword))) {
      return true;
    }
    
    if (transaction.transactionTypeCode === 'SystemCommission' && 
        (desc.includes('tier') || desc.includes('package') || desc.includes('gói'))) {
      return true;
    }
    
    return false;
  };

  const isDebitTransaction = (typeCode: string | undefined, transaction?: WalletTransactionDto): boolean => {
    if (!typeCode) {
      if (transaction && isServicePackagePurchase(transaction)) {
        return true;
      }
      return false;
    }
    
    if (transaction && isServicePackagePurchase(transaction)) {
      return true;
    }
    
    const debitTypes = ['AppointmentPayment', 'Withdrawal'];
    return debitTypes.includes(typeCode);
  };

  const formatTransactionAmount = (amount: number | undefined, typeCode: string | undefined, transaction?: WalletTransactionDto): string => {
    if (!amount) return 'N/A';
    const isDebit = isDebitTransaction(typeCode, transaction);
    const sign = isDebit ? '-' : '+';
    const absAmount = Math.abs(amount);
    return `${sign}${formatCurrencyCompact(absAmount)}`;
  };

  const getTransactionColor = (typeCode: string | undefined, transaction?: WalletTransactionDto): string => {
    return isDebitTransaction(typeCode, transaction) ? '#e53e3e' : '#38a169';
  };

  const getStatusLabel = (status?: string): string => {
    if (!status) return 'Không xác định';
    
    const statusMap: { [key: string]: string } = {
      'Completed': 'Hoàn thành',
      'Compeleted': 'Hoàn thành',
      'Pending': 'Đang chờ',
      'Failed': 'Thất bại',
      'Cancelled': 'Đã hủy',
      'Processing': 'Đang xử lý'
    };
    
    return statusMap[status] || status;
  };

  const formatTransactionDescription = (transaction: WalletTransactionDto): string => {
    const transactionDate = transaction.transactionDate 
      ? new Date(transaction.transactionDate)
      : null;

    const formatDate = (date: Date) => {
      return date.toLocaleDateString('vi-VN', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric'
      });
    };

    if (isServicePackagePurchase(transaction)) {
      const desc = transaction.description || '';
      const tierMatch = desc.match(/tier\s+(\w+)/i) || desc.match(/gói\s+(\w+)/i);
      if (tierMatch) {
        return `Mua gói dịch vụ ${tierMatch[1]}`;
      }
      if (desc.includes('VIP') || desc.includes('Premium') || desc.includes('Professional') || desc.includes('Basic')) {
        const tierName = desc.match(/(VIP|Premium|Professional|Basic)/i)?.[0] || '';
        return `Mua gói dịch vụ ${tierName}`;
      }
      return 'Mua gói dịch vụ';
    }

    switch (transaction.transactionTypeCode) {
      case 'Deposit':
        if (transaction.description) {
          if (transaction.description.toLowerCase().includes('payment for order')) {
            const orderMatch = transaction.description.match(/order\s+(\d+)/i);
            if (orderMatch) {
              return `Nạp tiền vào ví - Mã đơn: ${orderMatch[1]}`;
            }
            return `Nạp tiền vào ví`;
          }
          return transaction.description;
        }
        return `Nạp tiền vào ví${transactionDate ? ` ngày ${formatDate(transactionDate)}` : ''}`;
      
      case 'Withdrawal':
        return transaction.description || `Rút tiền từ ví${transactionDate ? ` ngày ${formatDate(transactionDate)}` : ''}`;
      
      case 'DoctorSalary':
        return transaction.description || `Lương bác sĩ${transactionDate ? ` ngày ${formatDate(transactionDate)}` : ''}`;
      
      case 'SystemCommission':
        return transaction.description || 'Hoa hồng hệ thống';
      
      default:
        return transaction.description || 'Giao dịch';
    }
  };

  const allTransactions = useMemo(() => {
    return [...transactions].sort((a, b) => {
      const dateA = a.transactionDate || a.createdAt || '';
      const dateB = b.transactionDate || b.createdAt || '';
      return new Date(dateB).getTime() - new Date(dateA).getTime();
    });
  }, [transactions]);

  const filteredTransactions = useMemo(() => {
    if (activeTab === 'all') {
      return allTransactions;
    }
    
    if (activeTab === 'expense') {
      return allTransactions.filter(t => isServicePackagePurchase(t));
    }
    
    const typeMap: { [key in TabType]: string[] } = {
      'all': [],
      'deposit': ['Deposit'],
      'withdrawal': ['Withdrawal'],
      'salary': ['DoctorSalary'],
      'expense': []
    };
    
    const allowedTypes = typeMap[activeTab];
    return allTransactions.filter(t => 
      t.transactionTypeCode && allowedTypes.includes(t.transactionTypeCode)
    );
  }, [allTransactions, activeTab]);

  const weeklyReport = useMemo(() => {
    const now = new Date();
    
    const startOfCurrentWeek = new Date(now);
    startOfCurrentWeek.setDate(now.getDate() - now.getDay());
    startOfCurrentWeek.setHours(0, 0, 0, 0);
    
    const endOfCurrentWeek = new Date(startOfCurrentWeek);
    endOfCurrentWeek.setDate(startOfCurrentWeek.getDate() + 6);
    endOfCurrentWeek.setHours(23, 59, 59, 999);

    const startOfLastWeek = new Date(startOfCurrentWeek);
    startOfLastWeek.setDate(startOfCurrentWeek.getDate() - 7);
    startOfLastWeek.setHours(0, 0, 0, 0);
    
    const endOfLastWeek = new Date(startOfLastWeek);
    endOfLastWeek.setDate(startOfLastWeek.getDate() + 6);
    endOfLastWeek.setHours(23, 59, 59, 999);

    let totalRevenue = 0;
    let totalSpent = 0;
    
    let currentWeekRevenue = 0;
    let currentWeekSpent = 0;
    
    let lastWeekRevenue = 0;
    let lastWeekSpent = 0;

    allTransactions.forEach(transaction => {
      const transactionDate = transaction.transactionDate 
        ? new Date(transaction.transactionDate)
        : transaction.createdAt
        ? new Date(transaction.createdAt)
        : null;
      
      if (!transactionDate) return;
            const status = transaction.status;
      const isCompleted =
        status === 'Completed' ||
        status === 'Compeleted'; 
      if (!isCompleted) {
        return;
      }
      
      const amount = Math.abs(transaction.amount || 0);
      const typeCode = transaction.transactionTypeCode;
      
      const isPackagePurchase = isServicePackagePurchase(transaction);

      if (typeCode === 'DoctorSalary' || typeCode === 'Deposit') {
        totalRevenue += amount;
      }
      
      if (typeCode === 'Withdrawal' || isPackagePurchase) {
        totalSpent += amount;
      }

      if (transactionDate >= startOfCurrentWeek && transactionDate <= endOfCurrentWeek) {
        if (typeCode === 'DoctorSalary' || typeCode === 'Deposit') {
          currentWeekRevenue += amount;
        }
        if (typeCode === 'Withdrawal' || isPackagePurchase) {
          currentWeekSpent += amount;
        }
      }

      if (transactionDate >= startOfLastWeek && transactionDate <= endOfLastWeek) {
        if (typeCode === 'DoctorSalary' || typeCode === 'Deposit') {
          lastWeekRevenue += amount;
        }
        if (typeCode === 'Withdrawal' || isPackagePurchase) {
          lastWeekSpent += amount;
        }
      }
    });

    const calculatePercentageChange = (current: number, last: number): number => {
      if (last === 0) {
        return current > 0 ? 100 : 0;
      }
      return Math.round(((current - last) / last) * 100);
    };

    const revenueChangePercentage = calculatePercentageChange(currentWeekRevenue, lastWeekRevenue);
    const spentChangePercentage = calculatePercentageChange(currentWeekSpent, lastWeekSpent);

    return {
      totalRevenue,
      totalSpent,
      revenueChangePercentage,
      spentChangePercentage
    };
  }, [allTransactions]);

  const quickAmounts = [100000, 200000, 500000, 1000000, 2000000, 5000000];

  const tabs = [
    { id: 'all' as TabType, label: 'Tất cả', icon: 'bi-list-ul' },
    { id: 'deposit' as TabType, label: 'Nạp tiền', icon: 'bi-cash-coin' },
    { id: 'withdrawal' as TabType, label: 'Rút tiền', icon: 'bi-cash-stack' },
    { id: 'salary' as TabType, label: 'Lương', icon: 'bi-wallet2' },
    { id: 'expense' as TabType, label: 'Chi tiêu', icon: 'bi-box-seam' }
  ];

  if (loading) {
    return <PageLoader />;
  }

  return (
    <div className={styles.container}>
      {/* Header Section */}
      <div className={styles.header}>
        <div className={styles.headerLeft}>
          <div className={styles.titleWrapper}>
            <div className={styles.titleIcon}>
              <Wallet2 size={28} />
            </div>
            <div>
              <h1 className={styles.title}>Ví & Doanh thu</h1>
              <p className={styles.subtitle}>Quản lý doanh thu và giao dịch của bạn</p>
            </div>
          </div>
        </div>
        <div className={styles.headerRight}>
          <div className={styles.dateTime}>
            <div className={styles.dateIconWrapper}>
              <Calendar size={20} className={styles.dateIcon} />
            </div>
            <div className={styles.dateContent}>
              <span className={styles.dateText}>{new Date().toLocaleDateString('vi-VN', { 
                weekday: 'long', 
                day: 'numeric', 
                month: 'long', 
                year: 'numeric' 
              })}</span>
              <div className={styles.dateGlow}></div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Grid */}
      <div className={styles.mainGrid}>
        {/* Wallet Balance Card */}
        <div className={`${styles.walletCard} ${styles.walletCardPrimary}`}>
          <div className={styles.walletHeader}>
            <div className={styles.walletIcon}>
              <Wallet2 size={24} />
            </div>
            <div className={`${styles.walletStatus} ${wallet?.isActive ? styles.statusActive : styles.statusInactive}`}>
              {wallet?.isActive ? 'Đang hoạt động' : 'Đã khóa'}
            </div>
          </div>
          <div className={styles.walletBalance}>
            <div className={styles.walletLabel}>Số dư ví</div>
            {loading ? (
              <div className={styles.walletAmount}>Đang tải...</div>
            ) : error ? (
              <div className={styles.walletAmount}>Lỗi</div>
            ) : wallet ? (
              <div className={styles.walletAmount}>
                {formatBalance(wallet.balance, wallet.currency)}
              </div>
            ) : (
              <div className={styles.walletAmount}>N/A</div>
            )}
          </div>
          
          {/* Revenue & Expense Report */}
          <div className={styles.walletReport}>
            <div className={styles.reportHeader}>
              <div className={styles.reportIcon}>
                <TrendingUp size={20} />
              </div>
              <h3 className={styles.reportTitle}>Báo cáo thu chi</h3>
            </div>
            <div className={styles.reportContent}>
              <div className={styles.reportItem}>
                <div className={styles.reportItemHeader}>
                  <div className={styles.reportIconWrapper}>
                    <ArrowUpCircle size={20} className={styles.reportIconUp} />
                  </div>
                  <div className={styles.reportItemInfo}>
                    <div className={styles.reportLabel}>Đã thu</div>
                    <div className={styles.reportAmountRow}>
                      <div className={styles.reportAmount}>
                        {formatCurrencyCompact(weeklyReport.totalRevenue)}
                      </div>
                      <div className={`${styles.reportPercentage} ${weeklyReport.revenueChangePercentage >= 0 ? styles.percentageIncrease : styles.percentageDecrease}`}>
                        {weeklyReport.revenueChangePercentage >= 0 ? '+' : ''}{weeklyReport.revenueChangePercentage}% so với tuần trước
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              <div className={styles.reportItem}>
                <div className={styles.reportItemHeader}>
                  <div className={styles.reportIconWrapper}>
                    <ArrowDownCircle size={20} className={styles.reportIconDown} />
                  </div>
                  <div className={styles.reportItemInfo}>
                    <div className={styles.reportLabel}>Đã chi</div>
                    <div className={styles.reportAmountRow}>
                      <div className={styles.reportAmount}>
                        {formatCurrencyCompact(weeklyReport.totalSpent)}
                      </div>
                      <div className={`${styles.reportPercentage} ${weeklyReport.spentChangePercentage >= 0 ? styles.percentageIncrease : styles.percentageDecrease}`}>
                        {weeklyReport.spentChangePercentage >= 0 ? '+' : ''}{weeklyReport.spentChangePercentage}% so với tuần trước
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Transaction Actions Card */}
        <div className={`${styles.depositCard} ${styles.depositCardSecondary}`}>
          <div className={styles.depositHeader}>
            <div className={styles.depositIcon}>
              <Wallet2 size={24} />
            </div>
            <h3 className={styles.depositTitle}>Giao dịch ví</h3>
          </div>
          <div className={styles.depositContent}>
            <input
              type="text"
              value={depositAmount}
              onChange={handleAmountChange}
              placeholder="Nhập số tiền"
              className={styles.depositInput}
              inputMode="numeric"
            />

            <div className={styles.quickAmountLabel}>Chọn nhanh số tiền:</div>
            <div className={styles.quickAmounts}>
              {quickAmounts.map((amount) => {
                const formattedAmount = amount.toLocaleString('vi-VN');
                return (
                  <button
                    key={amount}
                    onClick={() => setDepositAmount(formattedAmount)}
                    className={`${styles.quickAmountBtn} ${depositAmount === formattedAmount ? styles.active : ''}`}
                  >
                    {formattedAmount} đ
                  </button>
                );
              })}
            </div>

            <div className={styles.actionButtons}>
              <button
                onClick={handleDeposit}
                disabled={isProcessing || !depositAmount || parseFormattedNumber(depositAmount) <= 0}
                className={`${styles.depositButton} ${styles.depositActionBtn}`}
              >
                {isProcessing ? (
                  <>
                    <i className="bi bi-hourglass-split"></i>
                    Đang xử lý...
                  </>
                ) : (
                  <>
                    <PlusCircle size={18} />
                    Nạp tiền
                  </>
                )}
              </button>

              <button
                onClick={() => {
                  const amount = parseFormattedNumber(depositAmount);
                  if (!amount || amount <= 0) {
                    alert('Vui lòng nhập số tiền hợp lệ');
                    return;
                  }
                  if (!wallet || amount > wallet.balance) {
                    alert('Số tiền rút không được vượt quá số dư ví');
                    return;
                  }
                  setWithdrawalAmount(depositAmount);
                  handleOpenWithdrawalModal();
                }}
                disabled={isProcessingWithdrawal || !depositAmount || parseFormattedNumber(depositAmount) <= 0 || !wallet || parseFormattedNumber(depositAmount) > wallet.balance}
                className={`${styles.depositButton} ${styles.withdrawalActionBtn}`}
              >
                {isProcessingWithdrawal ? (
                  <>
                    <i className="bi bi-hourglass-split"></i>
                    Đang xử lý...
                  </>
                ) : (
                  <>
                    <ArrowDownCircle size={18} />
                    Rút tiền
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Transactions Card */}
      <div className={styles.transactionsCard}>
        <div className={styles.transactionsHeader}>
          <div className={styles.transactionsIconWrapper}>
            <div className={styles.transactionsIcon}>
              <i className="bi bi-credit-card"></i>
            </div>
            <h3 className={styles.transactionsTitle}>Giao dịch gần đây</h3>
          </div>
        </div>

        {/* Filter Tabs */}
        <div className={styles.tabsContainer}>
          <div className={styles.tabsList}>
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`${styles.tab} ${activeTab === tab.id ? styles.active : ''}`}
              >
                <i className={`bi ${tab.icon}`}></i>
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        <div className={styles.transactionsList}>
          {loadingTransactions ? (
            <div className={styles.loadingState}>
              <i className={`bi bi-arrow-clockwise ${styles.loadingIcon}`}></i>
              <p>Đang tải lịch sử giao dịch...</p>
            </div>
          ) : filteredTransactions.length === 0 ? (
            <div className={styles.emptyState}>
              <i className={`bi bi-receipt ${styles.emptyStateIcon}`}></i>
              <p className={styles.emptyStateText}>Chưa có giao dịch nào</p>
            </div>
          ) : (
            filteredTransactions.map((transaction, index) => {
              const transactionDate = transaction.transactionDate || transaction.createdAt;
              const formattedDate = transactionDate ? new Date(transactionDate).toLocaleString('vi-VN', {
                day: '2-digit',
                month: '2-digit',
                year: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
              }) : 'N/A';

              return (
                <div 
                  key={transaction.id} 
                  className={styles.transactionItem}
                  style={{ animationDelay: `${index * 0.05}s` }}
                >
                  <div className={styles.transactionLeft}>
                    <div 
                      className={styles.transactionIconWrapper}
                      style={{ 
                        background: isDebitTransaction(transaction.transactionTypeCode, transaction) 
                          ? 'linear-gradient(135deg, #fee2e2 0%, #fecaca 100%)' 
                          : 'linear-gradient(135deg, #dcfce7 0%, #bbf7d0 100%)'
                      }}
                    >
                      <i className={getTransactionTypeIcon(transaction.transactionTypeCode, transaction)}></i>
                    </div>
                    <div className={styles.transactionInfo}>
                      <div className={styles.transactionHeader}>
                        <div className={styles.transactionName}>
                          {getTransactionTypeName(transaction.transactionTypeCode, transaction)}
                        </div>
                        <div className={styles.transactionDate}>
                          <Clock size={14} />
                          <span>{formattedDate}</span>
                        </div>
                      </div>
                      <div className={styles.transactionDescription}>
                        {formatTransactionDescription(transaction)}
                        {transaction.orderCode && transaction.orderCode !== 0 && !formatTransactionDescription(transaction).includes('Mã đơn:') && (
                          <span className={styles.orderCode}> • Mã đơn: {transaction.orderCode}</span>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className={styles.transactionRight}>
                    <div 
                      className={styles.transactionAmount}
                      style={{ color: getTransactionColor(transaction.transactionTypeCode, transaction) }}
                    >
                      {formatTransactionAmount(transaction.amount, transaction.transactionTypeCode, transaction)}
                    </div>
                    <div className={`${styles.transactionStatus} ${
                      (transaction.status === 'Completed' || transaction.status === 'Compeleted') 
                        ? styles.statusCompleted 
                        : transaction.status === 'Pending' 
                        ? styles.statusPending 
                        : styles.statusFailed
                    }`}>
                      {getStatusLabel(transaction.status)}
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Withdrawal Modal */}
      {showWithdrawalModal && (
        <div className={styles.modalOverlay} onClick={() => !showWithdrawalConfirm && setShowWithdrawalModal(false)}>
          <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
            <button 
              className={styles.modalCloseBtn} 
              onClick={() => {
                setShowWithdrawalModal(false);
                setShowWithdrawalConfirm(false);
                setBankSearchTerm('');
              }}
            >
              <i className="bi bi-x-lg"></i>
            </button>

            {!showWithdrawalConfirm ? (
              <>
                <div className={styles.modalHeader}>
                  <h2>Rút tiền về tài khoản ngân hàng</h2>
                  <p>Số tiền: <strong>{(withdrawalAmount || depositAmount) || '0'} đ</strong></p>
                </div>

                <div className={styles.modalBody}>
                  <div className={styles.formGroup}>
                    <label>Chọn ngân hàng *</label>
                    <div className={styles.bankSearchContainer}>
                      <i className="bi bi-search"></i>
                      <input
                        type="text"
                        value={bankSearchTerm}
                        onChange={(e) => setBankSearchTerm(e.target.value)}
                        placeholder="Tìm kiếm ngân hàng..."
                        className={styles.bankSearchInput}
                      />
                      {bankSearchTerm && (
                        <button
                          className={styles.bankSearchClear}
                          onClick={() => setBankSearchTerm('')}
                        >
                          <i className="bi bi-x"></i>
                        </button>
                      )}
                    </div>
                    <div className={styles.bankList}>
                      {banksWithLogos.filter(bank => {
                        if (!bankSearchTerm) return true;
                        const searchLower = bankSearchTerm.toLowerCase();
                        return (
                          bank.name.toLowerCase().includes(searchLower) ||
                          bank.shortName?.toLowerCase().includes(searchLower) ||
                          bank.bin.includes(searchLower)
                        );
                      }).map((bank) => (
                        <div
                          key={bank.bin}
                          className={`${styles.bankItem} ${selectedBank?.bin === bank.bin ? styles.bankItemSelected : ''}`}
                          onClick={() => handleBankSelect(bank)}
                        >
                          {bank.logo ? (
                            <div className={styles.bankLogo}>
                              <img 
                                src={bank.logo} 
                                alt={bank.shortName || bank.name}
                                onError={(e) => {
                                  const target = e.target as HTMLImageElement;
                                  const fallback = target.nextElementSibling as HTMLElement;
                                  if (fallback) {
                                    target.style.display = 'none';
                                    fallback.style.display = 'flex';
                                  }
                                }}
                              />
                              <div className={styles.bankLogoFallback} style={{ display: 'none' }}>
                                <span>{bank.shortName || bank.name.substring(0, 2)}</span>
                              </div>
                            </div>
                          ) : (
                            <div className={styles.bankLogoFallback}>
                              <span>{bank.shortName || bank.name.substring(0, 2)}</span>
                            </div>
                          )}
                          <div className={styles.bankInfo}>
                            <div className={styles.bankName}>{bank.shortName || bank.name}</div>
                          </div>
                          {selectedBank?.bin === bank.bin && (
                            <i className="bi bi-check-circle-fill"></i>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>

                  {selectedBank && (
                    <>
                      <div className={styles.formGroup}>
                        <label>Số tài khoản *</label>
                        <input
                          ref={accountNumberInputRef}
                          type="text"
                          value={accountNumber}
                          onChange={handleAccountNumberChange}
                          placeholder="Nhập số tài khoản ngân hàng"
                          className={styles.formInput}
                          inputMode="numeric"
                          pattern="[0-9]*"
                        />
                      </div>

                      <div className={styles.formGroup}>
                        <label>Tên chủ tài khoản *</label>
                        <input
                          type="text"
                          value={accountName}
                          onChange={handleAccountNameChange}
                          placeholder="Nhập tên chủ tài khoản"
                          className={styles.formInput}
                          style={{ textTransform: 'uppercase' }}
                        />
                      </div>
                    </>
                  )}
                </div>

                <div className={styles.modalFooter}>
                  <button
                    className={styles.modalCancelBtn}
                    onClick={() => {
                      setShowWithdrawalModal(false);
                      setSelectedBank(null);
                      setAccountNumber('');
                      setAccountName('');
                      setBankSearchTerm('');
                    }}
                  >
                    Hủy
                  </button>
                  <button
                    className={styles.modalConfirmBtn}
                    onClick={handleConfirmWithdrawal}
                    disabled={!selectedBank || !accountNumber || accountNumber.trim() === '' || !accountName || accountName.trim() === ''}
                  >
                    Tiếp tục
                  </button>
                </div>
              </>
            ) : (
              <>
                <div className={styles.modalHeader}>
                  <h2>Xác nhận thông tin rút tiền</h2>
                </div>

                <div className={styles.modalBody}>
                  <div className={styles.confirmInfo}>
                    <div className={styles.confirmRow}>
                      <span className={styles.confirmLabel}>Số tiền rút:</span>
                      <span className={styles.confirmValue}>{(withdrawalAmount || depositAmount) || '0'} đ</span>
                    </div>
                    <div className={styles.confirmRow}>
                      <span className={styles.confirmLabel}>Ngân hàng:</span>
                      <span className={styles.confirmValue}>{selectedBank?.shortName || selectedBank?.name}</span>
                    </div>
                    <div className={styles.confirmRow}>
                      <span className={styles.confirmLabel}>Số tài khoản:</span>
                      <span className={styles.confirmValue}>{accountNumber}</span>
                    </div>
                    <div className={styles.confirmRow}>
                      <span className={styles.confirmLabel}>Tên chủ tài khoản:</span>
                      <span className={styles.confirmValue}>{accountName}</span>
                    </div>
                  </div>
                </div>

                <div className={styles.modalFooter}>
                  <button
                    className={styles.modalCancelBtn}
                    onClick={() => setShowWithdrawalConfirm(false)}
                  >
                    Quay lại
                  </button>
                  <button
                    className={styles.modalConfirmBtn}
                    onClick={handleSubmitWithdrawal}
                    disabled={isProcessingWithdrawal}
                  >
                    {isProcessingWithdrawal ? (
                      <>
                        <i className="bi bi-hourglass-split" style={{ marginRight: '8px' }}></i>
                        Đang xử lý...
                      </>
                    ) : (
                      <>
                        <i className="bi bi-check-circle" style={{ marginRight: '8px' }}></i>
                        Xác nhận rút tiền
                      </>
                    )}
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default DoctorWallet;
