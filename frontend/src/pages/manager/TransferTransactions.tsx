import React, { useState, useEffect, useMemo } from 'react';
import {
  Calendar,
  RefreshCcw,
  Search,
  Wallet,
  CheckCircle,
  AlertTriangle,
  ArrowDownRight,
  ClipboardList,
  ShieldCheck,
} from 'lucide-react';
import styles from '../../styles/manager/TransferTransactions.module.css';
import {
  transferTransactionService,
  TransferTransactionDto,
} from '../../services/transferTransactionService';

type StatusFilter = 'all' | 'Pending' | 'Accepted' | 'Rejected';
type StatusBadgeKey = TransferTransactionDto['status'] | 'all';
type DateFilter = 'all' | 'today' | '7days' | '30days';
type SortOption = 'newest' | 'oldest' | 'amountDesc' | 'amountAsc';

const STATUS_FILTERS: StatusFilter[] = ['all', 'Pending', 'Accepted', 'Rejected'];
const DATE_FILTERS: DateFilter[] = ['all', 'today', '7days', '30days'];
const STATUS_LABELS: Record<StatusFilter, string> = {
  all: 'Tất cả',
  Pending: 'Chờ xử lý',
  Accepted: 'Đã chấp nhận',
  Rejected: 'Đã từ chối',
};

const TransferTransactions: React.FC = () => {
  const [transactions, setTransactions] = useState<TransferTransactionDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [dateFilter, setDateFilter] = useState<DateFilter>('all');
  const [sortBy, setSortBy] = useState<SortOption>('newest');
  const [acceptingId, setAcceptingId] = useState<string | null>(null);
  const [rejectingId, setRejectingId] = useState<string | null>(null);
  const [selectedTransaction, setSelectedTransaction] = useState<TransferTransactionDto | null>(null);
  const [lastSyncedAt, setLastSyncedAt] = useState<Date | null>(null);

  useEffect(() => {
    loadTransactions();
  }, []);

  const loadTransactions = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await transferTransactionService.getAllTransferTransactions();
      setTransactions(data);
      setLastSyncedAt(new Date());
    } catch (err: any) {
      console.error('Error loading transactions:', err);
      const errorMessage =
        err?.response?.data?.message || err?.message || 'Không thể tải danh sách giao dịch';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleAcceptTransfer = async (transferTransactionId: string) => {
    if (!window.confirm('Bạn có chắc chắn muốn chấp nhận giao dịch này?')) return;
    setAcceptingId(transferTransactionId);
    try {
      await transferTransactionService.acceptTransfer({ TransferTransactionID: transferTransactionId });
      await loadTransactions();
    } catch (err: any) {
      alert(err?.response?.data?.message || err?.message || 'Có lỗi khi xác nhận giao dịch!');
    } finally {
      setAcceptingId(null);
    }
  };

  const handleRejectTransfer = async (transferTransactionId: string) => {
    if (!window.confirm('Bạn có chắc chắn muốn từ chối giao dịch này?')) return;
    setRejectingId(transferTransactionId);
    try {
      await transferTransactionService.rejectTransfer({ TransferTransactionID: transferTransactionId });
      await loadTransactions();
    } catch (err: any) {
      alert(err?.response?.data?.message || err?.message || 'Có lỗi khi từ chối giao dịch!');
    } finally {
      setRejectingId(null);
    }
  };

  const formatCurrency = (amount: number) =>
    new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND',
      maximumFractionDigits: 0,
    }).format(amount);

  const formatDateTime = (dateString: string) =>
    new Date(dateString).toLocaleString('vi-VN', {
      hour: '2-digit',
      minute: '2-digit',
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });

  const stats = useMemo(() => {
    const baseCounts: Record<TransferTransactionDto['status'], number> = {
      Pending: 0,
      Accepted: 0,
      Rejected: 0,
    };
    const baseAmounts: Record<TransferTransactionDto['status'], number> = {
      Pending: 0,
      Accepted: 0,
      Rejected: 0,
    };

    let totalAmount = 0;
    let highestTxn: TransferTransactionDto | null = null;

    const pendingQueue: TransferTransactionDto[] = [];

    transactions.forEach(txn => {
      totalAmount += txn.amount;
      baseCounts[txn.status] += 1;
      baseAmounts[txn.status] += txn.amount;
      if (!highestTxn || txn.amount > highestTxn.amount) {
        highestTxn = txn;
      }
      if (txn.status === 'Pending') {
        pendingQueue.push(txn);
      }
    });

    return { totalAmount, counts: baseCounts, amounts: baseAmounts, highestTxn, pendingQueue };
  }, [transactions]);

  const filteredTransactions = useMemo(() => {
    const search = searchTerm.trim().toLowerCase();
    let result = [...transactions];

    if (search) {
      result = result.filter(txn => {
        const haystack = [
          txn.referenceCode,
          txn.id,
          txn.toAccountNumber,
          txn.fromAccountNumber,
          txn.description,
        ]
          .filter(Boolean)
          .map(item => item!.toLowerCase());
        return haystack.some(field => field.includes(search));
      });
    }

    if (statusFilter !== 'all') {
      result = result.filter(txn => txn.status === statusFilter);
    }

    if (dateFilter !== 'all') {
      const now = new Date();
      result = result.filter(txn => {
        const created = new Date(txn.createdAt);
        if (dateFilter === 'today') {
          return created.toDateString() === now.toDateString();
        }
        if (dateFilter === '7days') {
          const sevenDaysAgo = new Date();
          sevenDaysAgo.setDate(now.getDate() - 7);
          return created >= sevenDaysAgo;
        }
        if (dateFilter === '30days') {
          const thirtyDaysAgo = new Date();
          thirtyDaysAgo.setDate(now.getDate() - 30);
          return created >= thirtyDaysAgo;
        }
        return true;
      });
    }

    switch (sortBy) {
      case 'amountAsc':
        result.sort((a, b) => a.amount - b.amount);
        break;
      case 'amountDesc':
        result.sort((a, b) => b.amount - a.amount);
        break;
      case 'oldest':
        result.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
        break;
      case 'newest':
      default:
        result.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
        break;
    }

    return result;
  }, [transactions, searchTerm, statusFilter, dateFilter, sortBy]);

  const statusBadge = (status: StatusBadgeKey) => {
    const lookup: Record<StatusBadgeKey, { label: string; tone: string }> = {
      Pending: { label: 'Chờ xử lý', tone: styles.badgePending },
      Accepted: { label: 'Đã chấp nhận', tone: styles.badgeAccepted },
      Rejected: { label: 'Đã từ chối', tone: styles.badgeRejected },
      all: { label: 'Tất cả', tone: styles.badgeNeutral },
    };
    const info = lookup[status] ?? lookup.all;
    return (
      <span className={`${styles.statusBadge} ${info.tone}`}>
        <span className={styles.statusDot}></span>
        {info.label}
      </span>
    );
  };

  const renderLoading = () => (
    <div className={styles.stateCard}>
      <div className={styles.loader}></div>
      <p>Đang tải danh sách giao dịch...</p>
    </div>
  );

  const renderError = () => (
    <div className={`${styles.stateCard} ${styles.errorCard}`}>
      <AlertTriangle size={32} />
      <h3>Có lỗi xảy ra</h3>
      <p>{error}</p>
      <button onClick={loadTransactions} className={styles.primaryButton}>
        <RefreshCcw size={16} />
        Thử lại
      </button>
    </div>
  );

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <div className={styles.headerLeft}>
          <div className={styles.titleWrapper}>
            <div className={styles.titleIcon}>
              <ClipboardList size={28} />
            </div>
            <div>
              <h1 className={styles.title}>Quản lý yêu cầu chuyển tiền</h1>
              <p className={styles.subtitle}>Theo dõi trạng thái, kiểm soát rủi ro và xử lý yêu cầu rút tiền</p>
            </div>
          </div>
        </div>
        <div className={styles.headerRight}>
          <div className={styles.dateTime}>
            <div className={styles.dateIconWrapper}>
              <Calendar size={20} className={styles.dateIcon} />
            </div>
            <div className={styles.dateContent}>
              <span className={styles.dateText}>
                {new Date().toLocaleDateString('vi-VN', {
                  weekday: 'long',
                  day: 'numeric',
                  month: 'long',
                  year: 'numeric',
                })}
              </span>
              <div className={styles.dateGlow}></div>
            </div>
          </div>
          <button className={styles.refreshBtn} onClick={loadTransactions} disabled={loading}>
            <RefreshCcw size={16} />
            Làm mới
          </button>
        </div>
      </div>


      <div className={styles.summaryGrid}>
        <div className={`${styles.summaryCard} ${styles.summaryCardPrimary}`}>
          <div className={styles.summaryCardContent}>
            <div className={styles.summaryCardIcon}>
              <Wallet size={20} />
            </div>
            <div>
              <p>Tổng giao dịch</p>
              <h3>{transactions.length}</h3>
              <span>Giá trị {formatCurrency(stats.totalAmount)}</span>
            </div>
          </div>
        </div>
        <div className={`${styles.summaryCard} ${styles.summaryCardWarning}`}>
          <div className={styles.summaryCardContent}>
            <div className={styles.summaryCardIcon}>
              <AlertTriangle size={20} />
            </div>
            <div>
              <p>Chờ xử lý</p>
              <h3>{stats.counts.Pending}</h3>
              <span>Khối lượng {formatCurrency(stats.amounts.Pending)}</span>
            </div>
          </div>
        </div>
        <div className={`${styles.summaryCard} ${styles.summaryCardSuccess}`}>
          <div className={styles.summaryCardContent}>
            <div className={styles.summaryCardIcon}>
              <CheckCircle size={20} />
            </div>
            <div>
              <p>Đã chấp nhận</p>
              <h3>{stats.counts.Accepted}</h3>
              <span>{formatCurrency(stats.amounts.Accepted)}</span>
            </div>
          </div>
        </div>
        <div className={`${styles.summaryCard} ${styles.summaryCardNeutral}`}>
          <div className={styles.summaryCardContent}>
            <div className={styles.summaryCardIcon}>
              <ArrowDownRight size={20} />
            </div>
            <div>
              <p>Đã từ chối</p>
              <h3>{stats.counts.Rejected}</h3>
              <span>{formatCurrency(stats.amounts.Rejected)}</span>
            </div>
          </div>
        </div>
      </div>

      <div className={styles.toolbar}>
        <div className={styles.toolbarLeft}>
          <div className={styles.searchBox}>
            <Search size={16} />
            <input
              type="text"
              placeholder="Tìm theo tài khoản, mã giao dịch, mô tả..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
            />
          </div>
          <div className={styles.statusFilters}>
            {STATUS_FILTERS.map(status => (
              <button
                key={status}
                data-status={status}
                className={`${styles.filterButton} ${statusFilter === status ? styles.filterButtonActive : ''}`}
                onClick={() => setStatusFilter(status)}
              >
                <span className={styles.filterDot}></span>
                {STATUS_LABELS[status]}
              </button>
            ))}
          </div>
        </div>
      </div>

      {loading && renderLoading()}
      {error && renderError()}

      {!loading && !error && (
        <>
          <div className={styles.tableHeader}>
            <div>
              <h3>Danh sách yêu cầu</h3>
              <p>{filteredTransactions.length} giao dịch phù hợp bộ lọc hiện tại</p>
            </div>
            <div className={styles.tableFilters}>
              {DATE_FILTERS.map(filter => (
                <button
                  key={filter}
                  className={`${styles.pillButton} ${dateFilter === filter ? styles.pillButtonActive : ''}`}
                  onClick={() => setDateFilter(filter)}
                >
                  {filter === 'all' && 'Mọi thời gian'}
                  {filter === 'today' && 'Hôm nay'}
                  {filter === '7days' && '7 ngày'}
                  {filter === '30days' && '30 ngày'}
                </button>
              ))}
            </div>
          </div>

          {filteredTransactions.length === 0 ? (
            <div className={styles.emptyState}>
              <div className={styles.emptyIcon}>
                <ClipboardList size={32} />
              </div>
              <h3>Không tìm thấy giao dịch</h3>
              <p>Điều chỉnh bộ lọc hoặc làm mới dữ liệu để xem thêm yêu cầu.</p>
            </div>
          ) : (
            <div className={styles.tableWrapper}>
              <table className={styles.transactionTable}>
                <thead>
                  <tr>
                    <th>Mã giao dịch</th>
                    <th>Người chuyển</th>
                    <th>Người nhận</th>
                    <th>Số tiền</th>
                    <th>Thời gian</th>
                    <th>Trạng thái</th>
                    <th>Thao tác</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredTransactions.map(txn => (
                    <tr key={txn.id}>
                      <td>
                        <div className={styles.transactionId}>
                          <span>#{txn.referenceCode || txn.id.substring(0, 8)}</span>
                          <small>{txn.walletTransactionID}</small>
                        </div>
                      </td>
                      <td>
                        {txn.fromAccountNumber ? (
                          <div className={styles.accountInfo}>
                            <span className={styles.accountNumber}>{txn.fromAccountNumber}</span>
                            <span className={styles.accountBank}>{txn.fromBin}</span>
                          </div>
                        ) : (
                          <span className={styles.noInfo}>Không xác định</span>
                        )}
                      </td>
                      <td>
                        <div className={styles.accountInfo}>
                          <span className={styles.accountNumber}>{txn.toAccountNumber}</span>
                          <span className={styles.accountBank}>{txn.toBin}</span>
                        </div>
                      </td>
                      <td>
                        <span className={styles.amount}>{formatCurrency(txn.amount)}</span>
                      </td>
                      <td>
                        <span className={styles.date}>{formatDateTime(txn.createdAt)}</span>
                      </td>
                      <td>{statusBadge(txn.status)}</td>
                      <td>
                        <div className={styles.actionGroup}>
                          <button className={styles.detailBtn} onClick={() => setSelectedTransaction(txn)}>
                            Xem chi tiết
                          </button>
                          {txn.status === 'Pending' && (
                            <>
                              <button
                                className={styles.acceptBtn}
                                onClick={() => handleAcceptTransfer(txn.id)}
                                disabled={acceptingId === txn.id || rejectingId === txn.id}
                              >
                                {acceptingId === txn.id ? <span className={styles.btnSpinner}></span> : 'Chấp nhận'}
                              </button>
                              <button
                                className={styles.rejectBtn}
                                onClick={() => handleRejectTransfer(txn.id)}
                                disabled={rejectingId === txn.id || acceptingId === txn.id}
                              >
                                {rejectingId === txn.id ? <span className={styles.btnSpinner}></span> : 'Từ chối'}
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
        </>
      )}

      {selectedTransaction && (
        <div className={styles.detailOverlay} onClick={() => setSelectedTransaction(null)}>
          <div className={styles.detailPanel} onClick={e => e.stopPropagation()}>
            <div className={styles.detailHeader}>
              <div>
                <p>Mã tham chiếu</p>
                <h2>{selectedTransaction.referenceCode || selectedTransaction.id}</h2>
              </div>
              <button className={styles.closeButton} onClick={() => setSelectedTransaction(null)}>
                ×
              </button>
            </div>

            <div className={styles.detailSection}>
              <h4>Thông tin giao dịch</h4>
              <div className={styles.detailGrid}>
                <div>
                  <span>Người chuyển</span>
                  <strong>{selectedTransaction.fromAccountNumber || 'Không có dữ liệu'}</strong>
                </div>
                <div>
                  <span>Ngân hàng nguồn</span>
                  <strong>{selectedTransaction.fromBin || 'Không xác định'}</strong>
                </div>
                <div>
                  <span>Người nhận</span>
                  <strong>{selectedTransaction.toAccountNumber}</strong>
                </div>
                <div>
                  <span>Ngân hàng nhận</span>
                  <strong>{selectedTransaction.toBin}</strong>
                </div>
                <div>
                  <span>Số tiền</span>
                  <strong>{formatCurrency(selectedTransaction.amount)}</strong>
                </div>
                <div>
                  <span>Thời gian tạo</span>
                  <strong>{formatDateTime(selectedTransaction.createdAt)}</strong>
                </div>
                <div>
                  <span>Trạng thái</span>
                  <div className={styles.detailStatus}>{statusBadge(selectedTransaction.status)}</div>
                </div>
                <div>
                  <span>Người yêu cầu</span>
                  <strong>{selectedTransaction.userId}</strong>
                </div>
              </div>
              <div className={styles.detailDescription}>
                <span>Nội dung</span>
                <p>{selectedTransaction.description}</p>
              </div>
            </div>

            {selectedTransaction.status === 'Pending' && (
              <div className={styles.detailActions}>
                <button
                  className={styles.acceptBtn}
                  onClick={() => handleAcceptTransfer(selectedTransaction.id)}
                  disabled={acceptingId === selectedTransaction.id}
                >
                  {acceptingId === selectedTransaction.id ? <span className={styles.btnSpinner}></span> : 'Chấp nhận yêu cầu'}
                </button>
                <button
                  className={styles.rejectBtn}
                  onClick={() => handleRejectTransfer(selectedTransaction.id)}
                  disabled={rejectingId === selectedTransaction.id}
                >
                  {rejectingId === selectedTransaction.id ? <span className={styles.btnSpinner}></span> : 'Từ chối yêu cầu'}
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default TransferTransactions;
