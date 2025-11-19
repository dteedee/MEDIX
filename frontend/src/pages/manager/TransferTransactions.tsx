import React, { useState, useEffect } from 'react';
import styles from '../../styles/manager/TransferTransactions.module.css';
import { transferTransactionService, TransferTransactionDto } from '../../services/transferTransactionService';

const TransferTransactions: React.FC = () => {
  const [transactions, setTransactions] = useState<TransferTransactionDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [acceptingId, setAcceptingId] = useState<string | null>(null);
  const [rejectingId, setRejectingId] = useState<string | null>(null);
    const handleRejectTransfer = async (transferTransactionId: string) => {
      if (!window.confirm('Bạn có chắc chắn muốn từ chối giao dịch này?')) return;
      setRejectingId(transferTransactionId);
      try {
        await transferTransactionService.rejectTransfer({ TransferTransactionID: transferTransactionId });
        await loadTransactions();
      } catch (err: any) {
        alert(
          err?.response?.data?.message || err?.message || 'Có lỗi khi từ chối giao dịch!'
        );
      } finally {
        setRejectingId(null);
      }
    };
  const handleAcceptTransfer = async (transferTransactionId: string) => {
    if (!window.confirm('Bạn có chắc chắn muốn chấp nhận giao dịch này?')) return;
    setAcceptingId(transferTransactionId);
    try {
      await transferTransactionService.acceptTransfer({ TransferTransactionID: transferTransactionId });
      await loadTransactions();
    } catch (err: any) {
      alert(
        err?.response?.data?.message || err?.message || 'Có lỗi khi xác nhận giao dịch!'
      );
    } finally {
      setAcceptingId(null);
    }
  };

  useEffect(() => {
    loadTransactions();
  }, []);

  const loadTransactions = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await transferTransactionService.getAllTransferTransactions();
      console.log('Loaded transactions:', data);
      setTransactions(data);
    } catch (err: any) {
      console.error('Error loading transactions:', err);
      console.error('Error response:', err.response);
      const errorMessage = err.response?.data?.message || err.message || 'Không thể tải danh sách giao dịch';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND'
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('vi-VN');
  };

  const getStatusBadge = (status: string) => {
    const statusMap: { [key: string]: { label: string; className: string } } = {
      'Pending': { label: 'Chờ xử lý', className: styles.statusPending },
      'Accepted': { label: 'Đã chấp nhận', className: styles.statusAccepted },
      'Rejected': { label: 'Đã từ chối', className: styles.statusRejected }
    };

    const statusInfo = statusMap[status] || { label: status, className: styles.statusDefault };
    
    return (
      <span className={`${styles.statusBadge} ${statusInfo.className}`}>
        {statusInfo.label}
      </span>
    );
  };

  const filteredTransactions = transactions.filter(transaction => {
    const matchesSearch = 
      transaction.toAccountNumber.includes(searchTerm) ||
      transaction.fromAccountNumber?.includes(searchTerm) ||
      transaction.referenceCode?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      transaction.description.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus = statusFilter === 'all' || transaction.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  if (loading) {
    return (
      <div className={styles.container}>
        <div className={styles.loadingContainer}>
          <div className={styles.spinner}></div>
          <p>Đang tải danh sách giao dịch...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={styles.container}>
        <div className={styles.errorContainer}>
          <i className="bi bi-exclamation-triangle-fill"></i>
          <h3>Có lỗi xảy ra</h3>
          <p>{error}</p>
          <button onClick={loadTransactions} className={styles.retryBtn}>
            <i className="bi bi-arrow-clockwise"></i>
            Thử lại
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <div className={styles.headerContent}>
          <h1 className={styles.title}>
            <i className="bi bi-arrow-left-right"></i>
            Quản lý Yêu cầu Chuyển tiền
          </h1>
          <p className={styles.subtitle}>
            Theo dõi và quản lý tất cả giao dịch chuyển tiền trong hệ thống
          </p>
        </div>
        <button className={styles.refreshBtn} onClick={loadTransactions}>
          <i className="bi bi-arrow-clockwise"></i>
          Làm mới
        </button>
      </div>

      <div className={styles.filterSection}>
        <div className={styles.searchBox}>
          <i className="bi bi-search"></i>
          <input
            type="text"
            placeholder="Tìm kiếm theo số tài khoản, mã giao dịch..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        <select
          className={styles.statusFilter}
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
        >
          <option value="all">Tất cả trạng thái</option>
          <option value="Pending">Chờ xử lý</option>
          <option value="Accepted">Đã chấp nhận</option>
          <option value="Rejected">Đã từ chối</option>
        </select>
      </div>

      <div className={styles.statsCards}>
        <div className={styles.statCard}>
          <div className={styles.statIcon} style={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' }}>
            <i className="bi bi-list-ul"></i>
          </div>
          <div className={styles.statInfo}>
            <span className={styles.statValue}>{transactions.length}</span>
            <span className={styles.statLabel}>Tổng giao dịch</span>
          </div>
        </div>

        <div className={styles.statCard}>
          <div className={styles.statIcon} style={{ background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)' }}>
            <i className="bi bi-clock-history"></i>
          </div>
          <div className={styles.statInfo}>
            <span className={styles.statValue}>
              {transactions.filter(t => t.status === 'Pending').length}
            </span>
            <span className={styles.statLabel}>Chờ xử lý</span>
          </div>
        </div>

        <div className={styles.statCard}>
          <div className={styles.statIcon} style={{ background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)' }}>
            <i className="bi bi-check-circle"></i>
          </div>
          <div className={styles.statInfo}>
            <span className={styles.statValue}>
              {transactions.filter(t => t.status === 'Accepted').length}
            </span>
            <span className={styles.statLabel}>Đã chấp nhận</span>
          </div>
        </div>

        <div className={styles.statCard}>
          <div className={styles.statIcon} style={{ background: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)' }}>
            <i className="bi bi-x-circle"></i>
          </div>
          <div className={styles.statInfo}>
            <span className={styles.statValue}>
              {transactions.filter(t => t.status === 'Rejected').length}
            </span>
            <span className={styles.statLabel}>Đã từ chối</span>
          </div>
        </div>
      </div>

      {filteredTransactions.length === 0 ? (
        <div className={styles.emptyState}>
          <div className={styles.emptyIcon}>
            <i className="bi bi-inbox"></i>
          </div>
          <h3>Không có giao dịch nào</h3>
          <p>Chưa có yêu cầu chuyển tiền nào trong hệ thống</p>
        </div>
      ) : (
        <div className={styles.tableContainer}>
          <table className={styles.transactionTable}>
            <thead>
              <tr>
                <th>Mã giao dịch</th>
                <th>Người chuyển</th>
                <th>Người nhận</th>
                <th>Số tiền</th>
                <th>Mô tả</th>
                <th>Thời gian</th>
                <th>Trạng thái</th>
                <th>Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {filteredTransactions.map((transaction) => (
                <tr key={transaction.id}>
                  <td>
                    <div className={styles.transactionId}>
                      <i className="bi bi-hash"></i>
                      <span>{transaction.referenceCode || transaction.id.substring(0, 8)}</span>
                    </div>
                  </td>
                  <td>
                    <div className={styles.accountInfo}>
                      {transaction.fromAccountNumber ? (
                        <>
                          <span className={styles.accountNumber}>{transaction.fromAccountNumber}</span>
                          <span className={styles.bankCode}>({transaction.fromBin})</span>
                        </>
                      ) : (
                        <span className={styles.noInfo}>N/A</span>
                      )}
                    </div>
                  </td>
                  <td>
                    <div className={styles.accountInfo}>
                      <span className={styles.accountNumber}>{transaction.toAccountNumber}</span>
                      <span className={styles.bankCode}>({transaction.toBin})</span>
                    </div>
                  </td>
                  <td>
                    <span className={styles.amount}>{formatCurrency(transaction.amount)}</span>
                  </td>
                  <td>
                    <span className={styles.description} title={transaction.description}>
                      {transaction.description}
                    </span>
                  </td>
                  <td>
                    <span className={styles.date}>{formatDate(transaction.createdAt)}</span>
                  </td>
                  <td>{getStatusBadge(transaction.status)}</td>
                  <td>
                    <div style={{ display: 'flex', gap: 8 }}>
                      <button className={styles.detailBtn} title="Xem chi tiết">
                        <i className="bi bi-eye"></i>
                      </button>
                      {transaction.status === 'Pending' && (
                        <>
                          <button
                            className={styles.acceptBtn}
                            title="Chấp nhận giao dịch"
                            onClick={() => handleAcceptTransfer(transaction.id)}
                            disabled={acceptingId === transaction.id || rejectingId === transaction.id}
                          >
                            {acceptingId === transaction.id ? (
                              <span className={styles.btnSpinner}></span>
                            ) : (
                              <><i className="bi bi-check-circle"></i> Chấp nhận</>
                            )}
                          </button>
                          <button
                            className={styles.rejectBtn}
                            title="Từ chối giao dịch"
                            onClick={() => handleRejectTransfer(transaction.id)}
                            disabled={rejectingId === transaction.id || acceptingId === transaction.id}
                          >
                            {rejectingId === transaction.id ? (
                              <span className={styles.btnSpinner}></span>
                            ) : (
                              <><i className="bi bi-x-circle"></i> Từ chối</>
                            )}
                          </button>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default TransferTransactions;
