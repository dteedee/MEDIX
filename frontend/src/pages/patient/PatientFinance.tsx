import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { walletService } from '../../services/walletService';
import { WalletDto, OrderCreateRequest, WalletTransactionDto } from '../../types/wallet.types';
import styles from '../../styles/patient/PatientDashboard.module.css';

export const PatientFinance: React.FC = () => {
  const { user } = useAuth();
  const [wallet, setWallet] = useState<WalletDto | null>(null);
  const [transactions, setTransactions] = useState<WalletTransactionDto[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [loadingTransactions, setLoadingTransactions] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [depositAmount, setDepositAmount] = useState<string>('');
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [showAllTransactions, setShowAllTransactions] = useState<boolean>(false);

  useEffect(() => {
    const fetchWallet = async () => {
      try {
        setLoading(true);
        setError(null);
        const walletData = await walletService.getWalletByUserId();
        setWallet(walletData);
        
        // Fetch transactions - không cần walletId nữa
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
      // Không set error ở đây để không ảnh hưởng UI chính
    } finally {
      setLoadingTransactions(false);
    }
  };

  const formatBalance = (balance: number, currency: string): string => {
    const formatted = new Intl.NumberFormat('vi-VN').format(balance);
    return `${formatted} ${currency}`;
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

  // Check if transaction is debit (money out) or credit (money in)
  const isDebitTransaction = (typeCode: string | undefined): boolean => {
    if (!typeCode) return false;
    
    // AppointmentPayment and Withdrawal are debit transactions (money out, negative)
    const debitTypes = ['AppointmentPayment', 'Withdrawal'];
    return debitTypes.includes(typeCode);
  };

  // Format amount with proper sign based on transaction type
  const formatTransactionAmount = (amount: number | undefined, typeCode: string | undefined): string => {
    if (!amount) return 'N/A';
    
    const isDebit = isDebitTransaction(typeCode);
    const sign = isDebit ? '-' : '+';
    const absAmount = Math.abs(amount);
    
    return `${sign}${formatBalance(absAmount, 'VND')}`;
  };

  // Get color for transaction amount
  const getTransactionColor = (typeCode: string | undefined): string => {
    return isDebitTransaction(typeCode) ? '#e53e3e' : '#38a169';
  };

  const handleDeposit = async () => {
    const amount = parseFloat(depositAmount);
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

      console.log('Sending payment request:', paymentRequest);

      const order = await walletService.createPayment(paymentRequest);
      
      console.log('Received order response:', order);
      
      if (order && order.checkoutUrl) {
        try {
          localStorage.setItem('lastPaymentOrder', JSON.stringify({
            ...order,
            requestedAmount: amount,
            timestamp: new Date().toISOString()
          }));
          console.log('Payment order saved to localStorage');
        } catch (storageError) {
          console.warn('Failed to save order to localStorage:', storageError);
        }
        
        console.log('Redirecting to checkout URL:', order.checkoutUrl);
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
  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <div className={styles.headerLeft}>
          <h1>Tài chính</h1>
          <p>Quản lý thanh toán và hóa đơn</p>
        </div>
        <div className={styles.headerRight}>
          <div className={styles.dateTime}>
            <i className="bi bi-calendar3"></i>
            <span>{new Date().toLocaleDateString('vi-VN')}</span>
          </div>
        </div>
      </div>

      {/* Wallet Balance Card */} 
      <div className={styles.card} style={{ marginBottom: '24px' }}>
        <div className={styles.cardHeader}>
          <div className={styles.cardIcon}>
            <i className="bi bi-wallet2"></i>
          </div>
          <h3 className={styles.cardTitle}>Số dư ví</h3>
        </div>
        <div style={{ padding: '24px' }}>
          {loading ? (
            <div style={{ textAlign: 'center', color: '#718096' }}>Đang tải...</div>
          ) : error ? (
            <div style={{ textAlign: 'center', color: '#ef4444' }}>Lỗi: {error}</div>
          ) : wallet ? (
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '32px', fontWeight: 'bold', color: '#667eea', marginBottom: '8px' }}>
                {formatBalance(wallet.balance, wallet.currency)}
              </div>
              <div style={{ fontSize: '14px', color: '#718096' }}>
                {wallet.isActive ? 'Ví đang hoạt động' : 'Ví đã bị khóa'}
              </div>
            </div>
          ) : (
            <div style={{ textAlign: 'center', color: '#718096' }}>Không có thông tin ví</div>
          )}
        </div>
      </div>

      {/* Payment and Deposit Container */}
      <div className={styles.card} style={{ marginBottom: '24px' }}>
        <div className={styles.cardHeader}>
          <div className={styles.cardIcon}>
            <i className="bi bi-cash-stack"></i>
          </div>
          <h3 className={styles.cardTitle}>Nạp tiền vào ví</h3>
        </div>
        <div style={{ padding: '24px' }}>
          <div style={{ marginBottom: '16px' }}>
            <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', color: '#4a5568', fontWeight: '500' }}>
              Nhập số tiền (VND)
            </label>
            <input
              type="number"
              value={depositAmount}
              onChange={(e) => setDepositAmount(e.target.value)}
              placeholder="Nhập số tiền muốn nạp"
              style={{
                width: '100%',
                padding: '12px 16px',
                border: '1px solid #e2e8f0',
                borderRadius: '8px',
                fontSize: '16px',
                outline: 'none',
                transition: 'border-color 0.2s',
              }}
              onFocus={(e) => e.target.style.borderColor = '#667eea'}
              onBlur={(e) => e.target.style.borderColor = '#e2e8f0'}
              min="0"
              step="1000"
            />
          </div>

          {/* Quick Amount Buttons */}
          <div style={{ marginBottom: '20px' }}>
            <div style={{ fontSize: '14px', color: '#718096', marginBottom: '12px' }}>
              Chọn nhanh số tiền:
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
              {quickAmounts.map((amount) => (
                <button
                  key={amount}
                  onClick={() => setDepositAmount(amount.toString())}
                  style={{
                    padding: '8px 16px',
                    border: '1px solid #e2e8f0',
                    borderRadius: '6px',
                    backgroundColor: depositAmount === amount.toString() ? '#667eea' : 'white',
                    color: depositAmount === amount.toString() ? 'white' : '#4a5568',
                    cursor: 'pointer',
                    fontSize: '14px',
                    fontWeight: '500',
                    transition: 'all 0.2s',
                  }}
                  onMouseEnter={(e) => {
                    if (depositAmount !== amount.toString()) {
                      e.currentTarget.style.backgroundColor = '#f7fafc';
                      e.currentTarget.style.borderColor = '#667eea';
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (depositAmount !== amount.toString()) {
                      e.currentTarget.style.backgroundColor = 'white';
                      e.currentTarget.style.borderColor = '#e2e8f0';
                    }
                  }}
                >
                  {amount.toLocaleString('vi-VN')} đ
                </button>
              ))}
            </div>
          </div>

          <button
            onClick={handleDeposit}
            disabled={isProcessing || !depositAmount || parseFloat(depositAmount) <= 0}
            style={{
              width: '100%',
              padding: '14px',
              backgroundColor: isProcessing || !depositAmount || parseFloat(depositAmount) <= 0 ? '#cbd5e0' : '#667eea',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              fontSize: '16px',
              fontWeight: '600',
              cursor: isProcessing || !depositAmount || parseFloat(depositAmount) <= 0 ? 'not-allowed' : 'pointer',
              transition: 'background-color 0.2s',
            }}
            onMouseEnter={(e) => {
              if (!isProcessing && depositAmount && parseFloat(depositAmount) > 0) {
                e.currentTarget.style.backgroundColor = '#5568d3';
              }
            }}
            onMouseLeave={(e) => {
              if (!isProcessing && depositAmount && parseFloat(depositAmount) > 0) {
                e.currentTarget.style.backgroundColor = '#667eea';
              }
            }}
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

      {/* Recent Bills Card */}
      <div className={styles.card}>
        <div className={styles.cardHeader}>
          <div className={styles.cardIcon}>
            <i className="bi bi-credit-card"></i>
          </div>
          <h3 className={styles.cardTitle}>Hóa đơn gần đây</h3>
        </div>
        <div style={{ padding: '20px' }}>
          {loadingTransactions ? (
            <div style={{ textAlign: 'center', color: '#718096' }}>
              <i className="bi bi-arrow-clockwise" style={{ fontSize: '24px', marginBottom: '8px', display: 'block' }}></i>
              <p>Đang tải lịch sử giao dịch...</p>
            </div>
          ) : transactions.length === 0 ? (
            <div style={{ textAlign: 'center', color: '#718096' }}>
              <i className="bi bi-receipt" style={{ fontSize: '48px', marginBottom: '16px', display: 'block' }}></i>
              <p>Chưa có giao dịch nào</p>
            </div>
          ) : (
            <div>
              {transactions.slice(0, 5).map((transaction, index) => (
                <div key={transaction.id || index} style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  padding: '16px 0',
                  borderBottom: index < Math.min(transactions.length, 5) - 1 ? '1px solid #e2e8f0' : 'none'
                }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ 
                      display: 'flex', 
                      alignItems: 'center', 
                      gap: '8px',
                      marginBottom: '6px'
                    }}>
                      <i className={getTransactionTypeIcon(transaction.transactionTypeCode)} style={{
                        fontSize: '18px',
                        color: '#667eea'
                      }}></i>
                      <span style={{ 
                        fontSize: '15px', 
                        fontWeight: '600', 
                        color: '#2d3748' 
                      }}>
                        {getTransactionTypeName(transaction.transactionTypeCode)}
                      </span>
                    </div>
                    <div style={{ fontSize: '13px', color: '#718096', marginLeft: '26px' }}>
                      {transaction.transactionDate ? 
                        new Date(transaction.transactionDate).toLocaleDateString('vi-VN', {
                          day: '2-digit',
                          month: '2-digit',
                          year: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit'
                        }) : 
                        'N/A'
                      }
                    </div>
                    {transaction.description && (
                      <div style={{ 
                        fontSize: '12px', 
                        color: '#a0aec0',
                        marginLeft: '26px',
                        marginTop: '2px'
                      }}>
                        {transaction.description}
                      </div>
                    )}
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{
                      fontWeight: '600',
                      color: getTransactionColor(transaction.transactionTypeCode),
                      marginBottom: '8px',
                      fontSize: '16px'
                    }}>
                      {formatTransactionAmount(transaction.amount, transaction.transactionTypeCode)}
                    </div>
                    <div style={{
                      fontSize: '12px',
                      padding: '4px 8px',
                      borderRadius: '12px',
                      backgroundColor: (transaction.status === 'Completed' || transaction.status === 'Compeleted') ? '#c6f6d5' : 
                                     transaction.status === 'Pending' ? '#fef5e7' : '#e2e8f0',
                      color: (transaction.status === 'Completed' || transaction.status === 'Compeleted') ? '#22543d' : 
                             transaction.status === 'Pending' ? '#744210' : '#2d3748',
                      fontWeight: '500'
                    }}>
                      {transaction.status === 'Compeleted' ? 'Completed' : transaction.status || 'N/A'}
                    </div>
                  </div>
                </div>
              ))}
              {transactions.length > 5 && (
                <div style={{ textAlign: 'center', marginTop: '16px' }}>
                  <button onClick={() => setShowAllTransactions(true)} style={{
                    background: 'none',
                    border: '1px solid #cbd5e0',
                    borderRadius: '6px',
                    padding: '8px 16px',
                    color: '#4a5568',
                    fontSize: '14px',
                    cursor: 'pointer'
                  }}>
                    Xem tất cả ({transactions.length} giao dịch)
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Modal hiển thị toàn bộ giao dịch */}
      {showAllTransactions && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.5)',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          zIndex: 1000
        }}>
          <div style={{
            backgroundColor: 'white',
            borderRadius: '12px',
            padding: '24px',
            width: '90%',
            maxWidth: '800px',
            maxHeight: '80vh',
            overflow: 'hidden',
            display: 'flex',
            flexDirection: 'column'
          }}>
            {/* Header */}
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: '20px',
              paddingBottom: '16px',
              borderBottom: '1px solid #e2e8f0'
            }}>
              <h2 style={{ margin: 0, color: '#2d3748', fontSize: '20px', fontWeight: '600' }}>
                Lịch sử giao dịch ({transactions.length})
              </h2>
              <button 
                onClick={() => setShowAllTransactions(false)}
                style={{
                  background: 'none',
                  border: 'none',
                  fontSize: '24px',
                  cursor: 'pointer',
                  color: '#718096',
                  padding: '0',
                  width: '32px',
                  height: '32px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}
              >
                ×
              </button>
            </div>

            {/* Content */}
            <div style={{ 
              flex: 1, 
              overflowY: 'auto',
              paddingRight: '8px'
            }}>
              {transactions.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '40px', color: '#718096' }}>
                  <i className="bi bi-receipt" style={{ fontSize: '48px', marginBottom: '16px', display: 'block' }}></i>
                  <p>Chưa có giao dịch nào</p>
                </div>
              ) : (
                <div>
                  {transactions.map((transaction, index) => (
                    <div key={transaction.id || index} style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      padding: '16px 0',
                      borderBottom: index < transactions.length - 1 ? '1px solid #e2e8f0' : 'none'
                    }}>
                      <div style={{ flex: 1 }}>
                        <div style={{ 
                          display: 'flex', 
                          alignItems: 'center', 
                          gap: '10px',
                          marginBottom: '8px'
                        }}>
                          <i className={getTransactionTypeIcon(transaction.transactionTypeCode)} style={{
                            fontSize: '20px',
                            color: '#667eea'
                          }}></i>
                          <span style={{ 
                            fontSize: '16px', 
                            fontWeight: '600', 
                            color: '#2d3748' 
                          }}>
                            {getTransactionTypeName(transaction.transactionTypeCode)}
                          </span>
                        </div>
                        <div style={{ fontSize: '13px', color: '#718096', marginLeft: '30px', marginBottom: '4px' }}>
                          {transaction.transactionDate ? 
                            new Date(transaction.transactionDate).toLocaleDateString('vi-VN', {
                              day: '2-digit',
                              month: '2-digit',
                              year: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit'
                            }) : 
                            'N/A'
                          }
                        </div>
                        {transaction.description && (
                          <div style={{ fontSize: '13px', color: '#a0aec0', marginLeft: '30px', marginBottom: '4px' }}>
                            {transaction.description}
                          </div>
                        )}
                        {transaction.orderCode && transaction.orderCode !== 0 && (
                          <div style={{ fontSize: '12px', color: '#a0aec0', marginLeft: '30px' }}>
                            Mã đơn: {transaction.orderCode}
                          </div>
                        )}
                      </div>
                      <div style={{ textAlign: 'right' }}>
                        <div style={{
                          fontWeight: '600',
                          color: getTransactionColor(transaction.transactionTypeCode),
                          marginBottom: '8px',
                          fontSize: '16px'
                        }}>
                          {formatTransactionAmount(transaction.amount, transaction.transactionTypeCode)}
                        </div>
                        <div style={{
                          fontSize: '12px',
                          padding: '4px 8px',
                          borderRadius: '12px',
                          backgroundColor: (transaction.status === 'Completed' || transaction.status === 'Compeleted') ? '#c6f6d5' : 
                                         transaction.status === 'Pending' ? '#fef5e7' : '#e2e8f0',
                          color: (transaction.status === 'Completed' || transaction.status === 'Compeleted') ? '#22543d' : 
                                 transaction.status === 'Pending' ? '#744210' : '#2d3748',
                          fontWeight: '500'
                        }}>
                          {transaction.status === 'Compeleted' ? 'Completed' : transaction.status || 'N/A'}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
