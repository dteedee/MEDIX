import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { walletService } from '../../services/walletService';
import { appointmentService } from '../../services/appointmentService';
import { transferTransactionService, TransferTransactionCreateRequest } from '../../services/transferTransactionService';
import { WalletDto, OrderCreateRequest, WalletTransactionDto, BankInfo, WithdrawalRequest } from '../../types/wallet.types';
import { Appointment } from '../../types/appointment.types';
import styles from '../../styles/patient/PatientFinance.module.css';
import { useToast } from '../../contexts/ToastContext';

type TabType = 'all' | 'deposit' | 'withdrawal' | 'payment' | 'refund';

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

export const PatientFinance: React.FC = () => {
  const { user } = useAuth();
  const { showToast } = useToast();
  const [wallet, setWallet] = useState<WalletDto | null>(null);
  const [transactions, setTransactions] = useState<WalletTransactionDto[]>([]);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [appointmentMap, setAppointmentMap] = useState<Map<string, Appointment>>(new Map());
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
        const [walletData, appointmentsData] = await Promise.all([
          walletService.getWalletByUserId(),
          appointmentService.getPatientAppointments().catch(() => [])
        ]);
        setWallet(walletData);
        setAppointments(appointmentsData);
        const map = new Map<string, Appointment>();
        appointmentsData.forEach(apt => {
          map.set(apt.id, apt);
        });
        setAppointmentMap(map);
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
      
      try {
        const allAppointments = await appointmentService.getPatientAppointments();
        setAppointments(allAppointments);
        const map = new Map<string, Appointment>();
        allAppointments.forEach(apt => {
          map.set(apt.id, apt);
        });
        setAppointmentMap(map);
      } catch (err) {
      }
    } catch (err: any) {
    } finally {
      setLoadingTransactions(false);
    }
  };

  const formatBalance = (balance: number, currency: string): string => {
    const formatted = new Intl.NumberFormat('vi-VN').format(balance);
    return `${formatted} ${currency}`;
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
        description: `Rút tiền về ${selectedBank.shortName} - ${accountName}`,
        toBin: selectedBank.bin,
        toAccountNumber: accountNumber.trim()
      };

      await transferTransactionService.createTransferTransaction(transferRequest);
      
      setWithdrawalAmount('');
      setDepositAmount('');
      setShowWithdrawalModal(false);
      setShowWithdrawalConfirm(false);
      setSelectedBank(null);
      setAccountNumber('');
      setAccountName('');
      setBankSearchTerm('');
      
      showToast('Yêu cầu rút tiền đã được gửi thành công! Vui lòng chờ quản trị viên xét duyệt.', 'success');
      
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

  const getTransactionTypeName = (typeCode: string | undefined): string => {
    if (!typeCode) return 'Giao dịch';
    
    const typeMap: { [key: string]: string } = {
      'AppointmentPayment': 'Thanh toán cuộc hẹn',
      'AppointmentRefund': 'Hoàn tiền cuộc hẹn',
      'Deposit': 'Nạp tiền',
      'DoctorSalary': 'Lương bác sĩ',
      'SystemCommission': 'Hoa hồng hệ thống',
      'Withdrawal': 'Rút tiền'
    };
    
    return typeMap[typeCode] || typeCode;
  };

  const getTransactionTypeIcon = (typeCode: string | undefined): string => {
    if (!typeCode) return 'bi-arrow-left-right';
    
    const iconMap: { [key: string]: string } = {
      'AppointmentPayment': 'bi-calendar-check',
      'AppointmentRefund': 'bi-arrow-counterclockwise',
      'Deposit': 'bi-cash-coin',
      'DoctorSalary': 'bi-wallet2',
      'SystemCommission': 'bi-percent',
      'Withdrawal': 'bi-cash-stack'
    };
    
    return iconMap[typeCode] || 'bi-arrow-left-right';
  };

  const isDebitTransaction = (typeCode: string | undefined): boolean => {
    if (!typeCode) return false;
    const debitTypes = ['AppointmentPayment', 'Withdrawal'];
    return debitTypes.includes(typeCode);
  };

  const formatTransactionAmount = (amount: number | undefined, typeCode: string | undefined): string => {
    if (!amount) return 'N/A';
    const isDebit = isDebitTransaction(typeCode);
    const sign = isDebit ? '-' : '+';
    const absAmount = Math.abs(amount);
    return `${sign}${formatBalance(absAmount, 'VND')}`;
  };

  const getTransactionColor = (typeCode: string | undefined): string => {
    return isDebitTransaction(typeCode) ? '#e53e3e' : '#38a169';
  };

  const getStatusLabel = (status?: string): string => {
    if (!status) return 'Không xác định';
    
    const statusMap: { [key: string]: string } = {
      'Completed': 'Hoàn thành',
      'Compeleted': 'Hoàn thành', // Typo from backend
      'Pending': 'Đang chờ',
      'Failed': 'Thất bại',
      'Cancelled': 'Đã hủy',
      'Processing': 'Đang xử lý'
    };
    
    return statusMap[status] || status;
  };

const cleanDescription = (desc: any): string => {
  if (!desc) return '';

  if (Array.isArray(desc)) {
    desc = desc.join(' ');
  }

  desc = String(desc).trim();

  if (/^0+$/.test(desc)) {
    return '';
  }

  desc = desc.replace(/0+$/g, '').trim();

  return desc;
};
  const formatTransactionDateTime = (transaction: WalletTransactionDto): { date: string | null; time: string | null } => {
    const dateStr = transaction.transactionDate || transaction.createdAt;
    if (!dateStr) {
      return { date: null, time: null };
    }
    
    try {
      const date = new Date(dateStr);
      if (isNaN(date.getTime())) {
        return { date: null, time: null };
      }
      
      const formattedDate = date.toLocaleDateString('vi-VN', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric'
      });
      
      const hour = date.getHours();
      const formattedTime = `ca ${hour}h`;
      
      return { date: formattedDate, time: formattedTime };
    } catch (e) {
      return { date: null, time: null };
    }
  };

  const formatAppointmentDateTime = (appointment: Appointment | null | undefined): { date: string | null; time: string | null } => {
    if (!appointment || !appointment.appointmentStartTime) {
      return { date: null, time: null };
    }
    
    try {
      const appointmentDate = new Date(appointment.appointmentStartTime);
      if (isNaN(appointmentDate.getTime())) {
        return { date: null, time: null };
      }
      
      const date = appointmentDate.toLocaleDateString('vi-VN', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric'
      });
      
      const hour = appointmentDate.getHours();
      const time = `ca ${hour}h`;
      
      return { date, time };
    } catch (e) {
      return { date: null, time: null };
    }
  };

  const formatTransactionDescription = (transaction: WalletTransactionDto): string => {
    let originalDescription = transaction.description;
    let cleanedDescription = originalDescription ? cleanDescription(originalDescription) : null;
    if (cleanedDescription && (cleanedDescription.trim() === '0' || /^0+$/.test(cleanedDescription.trim()))) {
      cleanedDescription = null;
    }
    
    let appointment = transaction.relatedAppointmentId 
      ? (appointmentMap.get(transaction.relatedAppointmentId) || appointments.find(apt => apt.id === transaction.relatedAppointmentId))
      : null;
    
    if (!appointment && transaction.id) {
      appointment = appointments.find(apt => apt.transactionId === transaction.id);
    }

    if (transaction.transactionTypeCode === 'AppointmentPayment') {
     
    }

    switch (transaction.transactionTypeCode) {
      case 'AppointmentPayment':
        let doctorName: string | null = null;
        
        if (appointment) {
          const rawDoctorName = appointment.doctorName;
         
          
          if (rawDoctorName) {
            const trimmedName = rawDoctorName.trim();
            if (trimmedName !== '' && 
                trimmedName !== '0' && 
                trimmedName !== 'O' && 
                trimmedName.length > 0 &&
                !/^\s*$/.test(trimmedName)) {
              doctorName = trimmedName;
            }
          }
        }
        
        if (!doctorName && cleanedDescription) {
          let desc = cleanedDescription.trim();
          
          desc = desc.replace(/cuộc hẹn0$/i, 'cuộc hẹn').trim();
          desc = desc.replace(/0+$/, '').trim();
          
          
          const invalidPatterns = [
            /bác sĩ\s*[0O]\b/i,           
            /bác sĩ\s*$/i,                 
            /cho\s+đặt\s+bác sĩ\s*[0O]\b/i, 
            /cho\s+bác sĩ\s*[0O]\b/i       
          ];
          
          const hasInvalidDoctor = invalidPatterns.some(pattern => pattern.test(desc));
          
          if (!hasInvalidDoctor && desc.includes('bác sĩ')) {
            const doctorNameMatch = desc.match(/bác sĩ\s+([^0O\s][^\s]*(?:\s+[^0O\s][^\s]*)*?)(?:\s+ngày|\s*$|$)/i);
            if (doctorNameMatch && doctorNameMatch[1]) {
              const extractedName = doctorNameMatch[1].trim();
              if (extractedName !== '' && extractedName !== '0' && extractedName !== 'O' && extractedName.length > 0) {
                doctorName = extractedName;
              }
            }
          }
          
          if (!doctorName) {
            const altPatterns = [
              /cho\s+đặt\s+bác sĩ\s+([A-Za-zÀ-ỹ\s]+?)(?:\s+ngày|$)/i,
              /cho\s+bác sĩ\s+([A-Za-zÀ-ỹ\s]+?)(?:\s+ngày|$)/i,
              /bác sĩ\s+([A-Za-zÀ-ỹ\s]+?)(?:\s+ngày|$)/i
            ];
            
            for (const pattern of altPatterns) {
              const match = desc.match(pattern);
              if (match && match[1]) {
                const extractedName = match[1].trim();
                if (extractedName !== '' && extractedName !== '0' && extractedName !== 'O' && extractedName.length > 1) {
                  doctorName = extractedName;
                  break;
                }
              }
            }
          }
        }
        
        if (doctorName) {
          const cleanDoctorName = cleanDescription(doctorName);
          const { date, time } = formatAppointmentDateTime(appointment);
          
          let result = `Thanh toán cuộc hẹn với bác sĩ ${cleanDoctorName}`;
          if (date) {
            result += ` ngày ${date}`;
          }
          if (time) {
            result += ` ${time}`;
          }
          
          return cleanDescription(result);
        }
        
     
        
        if (cleanedDescription && cleanedDescription.trim() !== '0' && !/^0+$/.test(cleanedDescription.trim())) {
          let desc = cleanDescription(cleanedDescription);
          if (!desc || desc.trim() === '0' || /^0+$/.test(desc.trim())) {
          } else {
            const doctorNameMatch = desc.match(/bác sĩ\s+([A-Za-zÀ-ỹ\s]+?)(?:\s+ngày|$)/i);
            if (doctorNameMatch && doctorNameMatch[1]) {
              const extractedName = cleanDescription(doctorNameMatch[1].trim());
              if (extractedName && extractedName !== '0' && extractedName !== 'O' && extractedName.length > 1) {
                const { date, time } = formatTransactionDateTime(transaction);
                let result = `Thanh toán cuộc hẹn với bác sĩ ${extractedName}`;
                if (date) {
                  result += ` ngày ${date}`;
                }
                if (time) {
                  result += ` ${time}`;
                }
                return cleanDescription(result);
              }
            }
          }
        }
        
        const { date, time } = formatTransactionDateTime(transaction);
        let result = 'Thanh toán cuộc hẹn';
        if (date) {
          result += ` ngày ${date}`;
        }
        if (time) {
          result += ` ${time}`;
        }
        return cleanDescription(result);
      
      case 'AppointmentRefund':
        if (appointment && appointment.doctorName && appointment.doctorName.trim() !== '' && appointment.doctorName !== '0' && appointment.doctorName !== 'O') {
          let cleanDesc = cleanedDescription || '';
          
          const refundPercent = cleanDesc.match(/(\d+)%/)?.[1] || '80';
          const cancelFee = cleanDesc.match(/Phí hủy:\s*([\d.,]+)/)?.[1] || '';
          const cleanDoctorName = cleanDescription(appointment.doctorName.trim());
          const { date, time } = formatAppointmentDateTime(appointment);
          
          let desc = `Hoàn lại tiền hủy lịch với bác sĩ ${cleanDoctorName}`;
          if (date) {
            desc += ` ngày ${date}`;
          }
          if (time) {
            desc += ` ${time}`;
          }
          
          if (refundPercent) {
            desc += ` (${refundPercent}%`;
            if (cancelFee) {
              desc += ` - Phí hủy: ${cancelFee}`;
            }
            desc += ')';
          }
          
          return cleanDescription(desc);
        }
        if (cleanedDescription && 
            cleanedDescription.trim() !== '0' && 
            !/^0+$/.test(cleanedDescription.trim()) &&
            cleanedDescription.includes('bác sĩ')) {
          let cleanDesc = cleanDescription(cleanedDescription);
          
          if (!cleanDesc || cleanDesc.trim() === '0' || /^0+$/.test(cleanDesc.trim())) {
          } else if (cleanDesc.includes('bác sĩ 0') || cleanDesc.includes('bác sĩ0')) {
            const { date, time } = formatTransactionDateTime(transaction);
            let result = 'Hoàn lại tiền hủy lịch';
            if (date) {
              result += ` ngày ${date}`;
            }
            if (time) {
              result += ` ${time}`;
            }
            return cleanDescription(result);
          }
          const doctorNameMatch = cleanDesc.match(/bác sĩ\s+([^0O\s][^\s]*(?:\s+[^0O\s][^\s]*)*?)/i);
          if (doctorNameMatch && doctorNameMatch[1]) {
            const extractedName = cleanDescription(doctorNameMatch[1].trim());
            if (extractedName !== '' && extractedName !== '0' && extractedName !== 'O') {
              const refundPercent = cleanDesc.match(/(\d+)%/)?.[1] || '';
              const cancelFee = cleanDesc.match(/Phí hủy:\s*([\d.,]+)/)?.[1] || '';
              const { date, time } = formatAppointmentDateTime(appointment);
              
              let desc = `Hoàn lại tiền hủy lịch với bác sĩ ${extractedName}`;
              if (date) {
                desc += ` ngày ${date}`;
              }
              if (time) {
                desc += ` ${time}`;
              }
              if (refundPercent) {
                desc += ` (${refundPercent}%`;
                if (cancelFee) {
                  desc += ` - Phí hủy: ${cancelFee}`;
                }
                desc += ')';
              }
              return cleanDescription(desc);
            }
          }
          const { date, time } = formatTransactionDateTime(transaction);
          let result = 'Hoàn lại tiền hủy lịch';
          if (date) {
            result += ` ngày ${date}`;
          }
          if (time) {
            result += ` ${time}`;
          }
          return cleanDescription(result);
        }
        const { date: refundDate, time: refundTime } = formatTransactionDateTime(transaction);
        let desc = 'Hoàn lại tiền hủy lịch';
        if (refundDate) {
          desc += ` ngày ${refundDate}`;
        }
        if (refundTime) {
          desc += ` ${refundTime}`;
        }
        return cleanDescription(desc);
      
      case 'Deposit':
        if (cleanedDescription) {
          if (cleanedDescription.toLowerCase().includes('payment for order')) {
            const orderMatch = cleanedDescription.match(/order\s+(\d+)/i);
            if (orderMatch) {
              return `Nạp tiền vào ví - Mã đơn: ${orderMatch[1]}`;
            }
            return 'Nạp tiền vào ví';
          }
          let desc = cleanedDescription.replace(/\s*ngày\s+\d{2}\/\d{2}\/\d{4,}/g, '').trim();
          return cleanDescription(desc) || 'Nạp tiền vào ví';
        }
        return 'Nạp tiền vào ví';
      
      case 'Withdrawal':
        let withdrawalDesc = cleanedDescription ? cleanDescription(cleanedDescription) : '';
        withdrawalDesc = withdrawalDesc.replace(/\s*ngày\s+\d{2}\/\d{2}\/\d{4,}/g, '').trim();
        return cleanDescription(withdrawalDesc) || 'Rút tiền từ ví';
      
      default:
        if (!cleanedDescription || cleanedDescription.trim() === '0' || /^0+$/.test(cleanedDescription.trim())) {
          return 'Giao dịch';
        }
        return cleanDescription(cleanedDescription);
    }
  };

  const filteredTransactions = useMemo(() => {
    if (activeTab === 'all') {
      return transactions;
    }

    const typeMap: { [key in TabType]: string[] } = {
      'all': [],
      'deposit': ['Deposit'],
      'withdrawal': ['Withdrawal'],
      'payment': ['AppointmentPayment'],
      'refund': ['AppointmentRefund']
    };

    if (activeTab === 'deposit') {
      return transactions.filter(t =>
        t.transactionTypeCode === 'Deposit' && (t.status || '').toLowerCase() === 'completed'
      );
    }

    const allowedTypes = typeMap[activeTab];
    return transactions.filter(t =>
      t.transactionTypeCode && allowedTypes.includes(t.transactionTypeCode)
    );
  }, [transactions, activeTab]);

  const weeklyReport = useMemo(() => {
    const now = new Date();
    
    const startOfCurrentWeek = new Date(now);
    startOfCurrentWeek.setDate(now.getDate() - now.getDay()); // Start of week (Sunday)
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

    let totalSpent = 0;
    let totalDeposited = 0;

    let currentWeekSpent = 0;
    let currentWeekDeposited = 0;

    let lastWeekSpent = 0;
    let lastWeekDeposited = 0;

    transactions.forEach(transaction => {
      const transactionDate = transaction.transactionDate 
        ? new Date(transaction.transactionDate)
        : null;

      if (!transactionDate) return;

      const amount = Math.abs(transaction.amount || 0);
      const typeCode = transaction.transactionTypeCode;
      const status = (transaction.status || '').toLowerCase();

      if ((typeCode === 'AppointmentPayment' || typeCode === 'Withdrawal') && status === 'completed') {
        totalSpent += amount;
      }
      if (typeCode === 'Deposit' && status === 'completed') {
        totalDeposited += amount;
      }

      if (transactionDate >= startOfCurrentWeek && transactionDate <= endOfCurrentWeek) {
        if ((typeCode === 'AppointmentPayment' || typeCode === 'Withdrawal') && status === 'completed') {
          currentWeekSpent += amount;
        }
        if (typeCode === 'Deposit' && status === 'completed') {
          currentWeekDeposited += amount;
        }
      }

      if (transactionDate >= startOfLastWeek && transactionDate <= endOfLastWeek) {
        if ((typeCode === 'AppointmentPayment' || typeCode === 'Withdrawal') && status === 'completed') {
          lastWeekSpent += amount;
        }
        if (typeCode === 'Deposit' && status === 'completed') {
          lastWeekDeposited += amount;
        }
      }
    });

    const calculatePercentageChange = (current: number, last: number): number => {
      if (last === 0) {
        return current > 0 ? 100 : 0;
      }
      return Math.round(((current - last) / last) * 100);
    };

    const spentChangePercentage = calculatePercentageChange(currentWeekSpent, lastWeekSpent);
    const depositChangePercentage = calculatePercentageChange(currentWeekDeposited, lastWeekDeposited);

    return {
      totalSpent,
      totalDeposited,
      spentChangePercentage,
      depositChangePercentage
    };
  }, [transactions]);

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
        buyerName: user?.fullName || 'Khách hàng',
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

  const quickAmounts = [100000, 200000, 500000, 1000000, 2000000, 5000000];

  const tabs = [
    { id: 'all' as TabType, label: 'Tất cả', icon: 'bi-list-ul' },
    { id: 'deposit' as TabType, label: 'Nạp tiền', icon: 'bi-cash-coin' },
    { id: 'withdrawal' as TabType, label: 'Rút tiền', icon: 'bi-cash-stack' },
    { id: 'payment' as TabType, label: 'Trả tiền', icon: 'bi-calendar-check' },
    { id: 'refund' as TabType, label: 'Hoàn tiền', icon: 'bi-arrow-counterclockwise' }
  ];

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <div className={styles.headerLeft}>
          <h1>Tài chính</h1>
          <p>Quản lý thanh toán và giao dịch</p>
        </div>
        <div className={styles.dateTime}>
          <i className="bi bi-calendar3"></i>
          <span>{new Date().toLocaleDateString('vi-VN')}</span>
        </div>
      </div>

      <div className={styles.mainGrid}>
        <div className={styles.walletCard}>
          <div className={styles.walletHeader}>
            <div className={styles.walletIcon}>
              <i className="bi bi-wallet2"></i>
            </div>
            <div className={styles.walletStatus}>
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
          
          <div className={styles.walletReport}>
            <div className={styles.reportHeader}>
              <div className={styles.reportIcon}>
                <i className="bi bi-graph-up-arrow"></i>
              </div>
              <h3 className={styles.reportTitle}>Báo cáo chi tiêu</h3>
            </div>
            <div className={styles.reportContent}>
              <div className={styles.reportItem}>
                <div className={styles.reportItemHeader}>
                  <i className={`bi bi-arrow-down-circle ${styles.reportIconDown}`}></i>
                  <div className={styles.reportItemInfo}>
                    <div className={styles.reportLabel}>Đã chi</div>
                    <div className={styles.reportAmountRow}>
                      <div className={styles.reportAmount}>
                        {formatBalance(weeklyReport.totalSpent, wallet?.currency || 'VND')}
                      </div>
                      <div className={`${styles.reportPercentage} ${weeklyReport.spentChangePercentage >= 0 ? styles.percentageIncrease : styles.percentageDecrease}`}>
                        {weeklyReport.spentChangePercentage >= 0 ? '+' : ''}{weeklyReport.spentChangePercentage}% so với tuần trước
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              <div className={styles.reportItem}>
                <div className={styles.reportItemHeader}>
                  <i className={`bi bi-arrow-up-circle ${styles.reportIconUp}`}></i>
                  <div className={styles.reportItemInfo}>
                    <div className={styles.reportLabel}>Đã nạp</div>
                    <div className={styles.reportAmountRow}>
                      <div className={styles.reportAmount}>
                        {formatBalance(weeklyReport.totalDeposited, wallet?.currency || 'VND')}
                      </div>
                      <div className={`${styles.reportPercentage} ${weeklyReport.depositChangePercentage >= 0 ? styles.percentageIncrease : styles.percentageDecrease}`}>
                        {weeklyReport.depositChangePercentage >= 0 ? '+' : ''}{weeklyReport.depositChangePercentage}% so với tuần trước
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className={styles.depositCard}>
          <div className={styles.depositHeader}>
            <div className={styles.depositIcon}>
              <i className="bi bi-wallet2"></i>
            </div>
            <h3 className={styles.depositTitle}>Giao dịch ví</h3>
          </div>
          <div>
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
                    <i className="bi bi-hourglass-split" style={{ marginRight: '8px' }}></i>
                    Đang xử lý...
                  </>
                ) : (
                  <>
                    <i className="bi bi-plus-circle" style={{ marginRight: '8px' }}></i>
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
                    <i className="bi bi-hourglass-split" style={{ marginRight: '8px' }}></i>
                    Đang xử lý...
                  </>
                ) : (
                  <>
                    <i className="bi bi-arrow-down-circle" style={{ marginRight: '8px' }}></i>
                    Rút tiền
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className={styles.transactionsCard}>
        <div className={styles.transactionsHeader}>
          <div className={styles.transactionsIcon}>
            <i className="bi bi-credit-card"></i>
          </div>
          <h3 className={styles.transactionsTitle}>Giao dịch gần đây</h3>
        </div>

        <div className={styles.tabsContainer}>
          <div className={styles.tabsList}>
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`${styles.tab} ${activeTab === tab.id ? styles.active : ''}`}
              >
                <i className={`bi ${tab.icon}`} style={{ marginRight: '6px' }}></i>
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
            filteredTransactions.map((transaction) => (
              <div key={transaction.id} className={styles.transactionItem}>
                <div className={styles.transactionLeft}>
                  <div className={styles.transactionIconWrapper}>
                    <i className={getTransactionTypeIcon(transaction.transactionTypeCode)}></i>
                  </div>
                  <div className={styles.transactionInfo}>
                    <div className={styles.transactionHeader}>
                      <div className={styles.transactionName}>
                        {getTransactionTypeName(transaction.transactionTypeCode)}
                        <span className={styles.transactionDateInline}>
                          {' '}
                          {(() => {
                            const dateStr = transaction.transactionDate || transaction.createdAt;
                            if (dateStr) {
                              try {
                                const date = new Date(dateStr);
                                if (!isNaN(date.getTime())) {
                                  return date.toLocaleString('vi-VN', {
                                    day: '2-digit',
                                    month: '2-digit',
                                    year: 'numeric',
                                    hour: '2-digit',
                                    minute: '2-digit'
                                  });
                                }
                              } catch (e) {
                              }
                            }
                            return 'N/A';
                          })()}
                        </span>
                      </div>
                    </div>
                    <div className={styles.transactionDescription}>
                    {cleanDescription(formatTransactionDescription(transaction))}
                      {transaction.orderCode && transaction.orderCode !== 0 && !formatTransactionDescription(transaction).includes('Mã đơn:') && (
                        <span className={styles.orderCode}> • Mã đơn: {transaction.orderCode}</span>
                      )}
                    </div>
                  </div>
                </div>
                <div className={styles.transactionRight}>
                  <div 
                    className={styles.transactionAmount}
                    style={{ color: getTransactionColor(transaction.transactionTypeCode) }}
                  >
                    {formatTransactionAmount(transaction.amount, transaction.transactionTypeCode)}
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
            ))
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
