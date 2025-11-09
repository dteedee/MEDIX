import React, { useState, useEffect, useMemo } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { walletService } from '../../services/walletService';
import { appointmentService } from '../../services/appointmentService';
import { WalletDto, OrderCreateRequest, WalletTransactionDto } from '../../types/wallet.types';
import { Appointment } from '../../types/appointment.types';
import styles from '../../styles/patient/PatientFinance.module.css';

type TabType = 'all' | 'deposit' | 'withdrawal' | 'payment' | 'refund';

export const PatientFinance: React.FC = () => {
  const { user } = useAuth();
  const [wallet, setWallet] = useState<WalletDto | null>(null);
  const [transactions, setTransactions] = useState<WalletTransactionDto[]>([]);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [loadingTransactions, setLoadingTransactions] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [depositAmount, setDepositAmount] = useState<string>('');
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [activeTab, setActiveTab] = useState<TabType>('all');

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
        await fetchTransactions();
      } catch (err: any) {
        console.error('Error fetching wallet:', err);
        setError(err.message || 'Không thể tải thông tin ví');
      } finally {
        setLoading(false);
      }
    };

    fetchWallet();
  }, []);

  const fetchTransactions = async () => {
    try {
      setLoadingTransactions(true);
      const transactionData = await walletService.getTransactionsByWalletId();
      setTransactions(transactionData);
    } catch (err: any) {
      console.error('Error fetching transactions:', err);
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

  const formatTransactionDescription = (transaction: WalletTransactionDto): string => {
    const appointment = transaction.relatedAppointmentId 
      ? appointments.find(apt => apt.id === transaction.relatedAppointmentId)
      : null;

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

    switch (transaction.transactionTypeCode) {
      case 'AppointmentPayment':
        if (appointment) {
          return `Thanh toán đặt lịch thành công cho bác sĩ ${appointment.doctorName} ngày ${formatDate(new Date(appointment.appointmentStartTime))}`;
        }
        return transaction.description || `Thanh toán cuộc hẹn${transactionDate ? ` ngày ${formatDate(transactionDate)}` : ''}`;
      
      case 'AppointmentRefund':
        if (appointment) {
          const refundPercent = transaction.description?.match(/(\d+)%/)?.[1] || '80';
          const cancelFee = transaction.description?.match(/Phí hủy: ([\d.,]+)/)?.[1] || '';
          let desc = `Hoàn tiền hủy lịch hẹn cho bác sĩ ${appointment.doctorName} ngày ${formatDate(new Date(appointment.appointmentStartTime))}`;
          if (refundPercent) {
            desc += ` (${refundPercent}%`;
            if (cancelFee) {
              desc += ` - Phí hủy: ${cancelFee}`;
            }
            desc += ')';
          }
          return desc;
        }
        return transaction.description || `Hoàn tiền cuộc hẹn${transactionDate ? ` ngày ${formatDate(transactionDate)}` : ''}`;
      
      case 'Deposit':
        if (transaction.description) {
          // Handle English descriptions like "Payment for order 123456"
          if (transaction.description.toLowerCase().includes('payment for order')) {
            const orderMatch = transaction.description.match(/order\s+(\d+)/i);
            if (orderMatch) {
              return `Nạp tiền vào ví - Mã đơn: ${orderMatch[1]}`;
            }
            return `Nạp tiền vào ví`;
          }
          // If description is already in Vietnamese or doesn't match pattern, use it
          return transaction.description;
        }
        return `Nạp tiền vào ví${transactionDate ? ` ngày ${formatDate(transactionDate)}` : ''}`;
      
      case 'Withdrawal':
        return transaction.description || `Rút tiền từ ví${transactionDate ? ` ngày ${formatDate(transactionDate)}` : ''}`;
      
      default:
        return transaction.description || 'Giao dịch';
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
    
    const allowedTypes = typeMap[activeTab];
    return transactions.filter(t => 
      t.transactionTypeCode && allowedTypes.includes(t.transactionTypeCode)
    );
  }, [transactions, activeTab]);

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
          console.warn('Failed to save order to localStorage:', storageError);
        }
        
        window.location.href = order.checkoutUrl;
      } else {
        throw new Error('Không nhận được link thanh toán từ server');
      }
    } catch (err: any) {
      console.error('Error processing deposit:', err);
      
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
              <>
                <div className={styles.walletAmount}>
                  {formatBalance(wallet.balance, wallet.currency)}
                </div>
                <div className={styles.walletCurrency}>
                  {wallet.currency}
                </div>
              </>
            ) : (
              <div className={styles.walletAmount}>N/A</div>
            )}
          </div>
        </div>

        <div className={styles.depositCard}>
          <div className={styles.depositHeader}>
            <div className={styles.depositIcon}>
              <i className="bi bi-cash-stack"></i>
            </div>
            <h3 className={styles.depositTitle}>Nạp tiền vào ví</h3>
          </div>
          <div>
            <input
              type="text"
              value={depositAmount}
              onChange={handleAmountChange}
              placeholder="Nhập số tiền muốn nạp"
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

            <button
              onClick={handleDeposit}
              disabled={isProcessing || !depositAmount || parseFormattedNumber(depositAmount) <= 0}
              className={styles.depositButton}
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
                    <div className={styles.transactionName}>
                      {getTransactionTypeName(transaction.transactionTypeCode)}
                    </div>
                    <div className={styles.transactionDate}>
                      {transaction.transactionDate ? 
                        new Date(transaction.transactionDate).toLocaleString('vi-VN', {
                          day: '2-digit',
                          month: '2-digit',
                          year: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit'
                        }) : 
                        'N/A'
                      }
                    </div>
                    <div className={styles.transactionDescription}>
                      {formatTransactionDescription(transaction)}
                    </div>
                    {transaction.orderCode && transaction.orderCode !== 0 && (
                      <div className={styles.transactionDescription}>
                        Mã đơn: {transaction.orderCode}
                      </div>
                    )}
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
    </div>
  );
};
