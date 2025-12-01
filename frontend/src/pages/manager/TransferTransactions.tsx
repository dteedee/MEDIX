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
  XCircle,
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

const BANKS = [
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

  const getBankNameByBin = (bin: string | null | undefined): string => {
    if (!bin) return 'Không xác định';
    const bank = BANKS.find(b => b.bin === bin);
    return bank ? `${bank.shortName} - ${bank.name}` : bin;
  };

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
        <div className={`${styles.summaryCard} ${styles.summaryCard1}`}>
          <div className={styles.summaryCardIcon}>
            <Wallet size={28} />
          </div>
            <div className={styles.summaryCardContent}>
            <div className={styles.summaryCardLabel}>Tổng giao dịch</div>
            <div className={styles.summaryCardValue}>{transactions.length}</div>
            <div className={styles.summaryCardTrend}>
              <i className="bi bi-arrow-up"></i>
              <span>Giá trị {formatCurrencyCompact(stats.totalAmount)}</span>
            </div>
          </div>
          <div className={styles.summaryCardBg}>
            <i className="bi bi-wallet2"></i>
          </div>
        </div>
        <div className={`${styles.summaryCard} ${styles.summaryCard2}`}>
          <div className={styles.summaryCardIcon}>
            <AlertTriangle size={28} />
          </div>
            <div className={styles.summaryCardContent}>
            <div className={styles.summaryCardLabel}>Chờ xử lý</div>
            <div className={styles.summaryCardValue}>{stats.counts.Pending}</div>
            <div className={styles.summaryCardTrend}>
              <i className="bi bi-arrow-up"></i>
              <span>Khối lượng {formatCurrencyCompact(stats.amounts.Pending)}</span>
            </div>
          </div>
          <div className={styles.summaryCardBg}>
            <i className="bi bi-exclamation-triangle"></i>
          </div>
        </div>
        <div className={`${styles.summaryCard} ${styles.summaryCard3}`}>
          <div className={styles.summaryCardIcon}>
            <CheckCircle size={28} />
          </div>
            <div className={styles.summaryCardContent}>
            <div className={styles.summaryCardLabel}>Đã chấp nhận</div>
            <div className={styles.summaryCardValue}>{stats.counts.Accepted}</div>
            <div className={styles.summaryCardTrend}>
              <i className="bi bi-arrow-up"></i>
              <span>{formatCurrencyCompact(stats.amounts.Accepted)}</span>
            </div>
          </div>
          <div className={styles.summaryCardBg}>
            <i className="bi bi-check-circle"></i>
          </div>
        </div>
        <div className={`${styles.summaryCard} ${styles.summaryCard4}`}>
          <div className={styles.summaryCardIcon}>
            <ArrowDownRight size={28} />
          </div>
            <div className={styles.summaryCardContent}>
            <div className={styles.summaryCardLabel}>Đã từ chối</div>
            <div className={styles.summaryCardValue}>{stats.counts.Rejected}</div>
            <div className={styles.summaryCardTrend}>
              <i className="bi bi-arrow-down"></i>
              <span>{formatCurrencyCompact(stats.amounts.Rejected)}</span>
            </div>
          </div>
          <div className={styles.summaryCardBg}>
            <i className="bi bi-x-circle"></i>
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
                        
                        </div>
                      </td>
                      <td>
                        <div className={styles.accountInfo}>
                          <span className={styles.accountNumber}>{txn.toAccountNumber}</span>
                          <span className={styles.accountBank}>{getBankNameByBin(txn.toBin)}</span>
                        </div>
                      </td>
                      <td className={styles.amountCell}>
                        <span className={styles.amount}>{formatCurrencyCompact(txn.amount)}</span>
                      </td>
                      <td className={styles.timeCell}>
                        <span className={styles.date}>{formatDateTime(txn.createdAt)}</span>
                      </td>
                      <td className={styles.statusCell}>{statusBadge(txn.status)}</td>
                      <td>
                        <div className={styles.actionGroup}>
                          <button
                            className={`${styles.iconActionBtn} ${styles.iconNeutral}`}
                            onClick={() => setSelectedTransaction(txn)}
                            title="Xem chi tiết"
                          >
                            <ClipboardList size={16} />
                          </button>
                          {txn.status === 'Pending' && (
                            <>
                              <button
                                className={`${styles.iconActionBtn} ${styles.iconSuccess}`}
                                onClick={() => handleAcceptTransfer(txn.id)}
                                disabled={acceptingId === txn.id || rejectingId === txn.id}
                                title="Chấp nhận"
                              >
                                {acceptingId === txn.id ? (
                                  <span className={styles.btnSpinner}></span>
                                ) : (
                                  <ShieldCheck size={16} />
                                )}
                              </button>
                              <button
                                className={`${styles.iconActionBtn} ${styles.iconDanger}`}
                                onClick={() => handleRejectTransfer(txn.id)}
                                disabled={rejectingId === txn.id || acceptingId === txn.id}
                                title="Từ chối"
                              >
                                {rejectingId === txn.id ? (
                                  <span className={styles.btnSpinner}></span>
                                ) : (
                                  <XCircle size={16} />
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
                  <strong>{selectedTransaction.fromAccountNumber || 'Medix'}</strong>
                </div>
                <div>
                  <span>Ngân hàng nguồn</span>
                  <strong>{getBankNameByBin(selectedTransaction.fromBin)}</strong>
                </div>
                <div>
                  <span>Người nhận</span>
                  <strong>{selectedTransaction.toAccountNumber}</strong>
                </div>
                <div>
                  <span>Ngân hàng nhận</span>
                  <strong>{getBankNameByBin(selectedTransaction.toBin)}</strong>
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
