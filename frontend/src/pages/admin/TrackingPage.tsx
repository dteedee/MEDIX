import React, { useState, useEffect, useMemo } from 'react';
import { apiClient } from '../../lib/apiClient';
import { useToast } from '../../contexts/ToastContext';
import styles from '../../styles/admin/TrackingPage.module.css';
import userStyles from '../../styles/admin/UserList.module.css'; // Import CSS từ UserList
import { LoadingSpinner } from '../../components/ui/LoadingSpinner';
import ConfirmationDialog from '../../components/ui/ConfirmationDialog';

interface AuditLog {
  id: number;
  userName: string;
  actionType: 'CREATE' | 'UPDATE' | 'DELETE' | 'LOGIN' | 'LOGOUT' | 'VIEW' | 'APPROVE' | 'REJECT';
  entityType: string;
  entityId: string;
  timestamp: string;
  ipAddress: string;
  oldValues: string | null;
  newValues: string | null;
  displayActionType: string;
}

interface Filters {
  page: number;
  pageSize: number;
  search: string;
  actionType: 'all' | AuditLog['actionType'];
  userFilter: string; // Thêm bộ lọc người dùng
  dateFrom: string;
  dateTo: string;
}
interface SortConfig {
  key: keyof AuditLog;
  direction: 'ascending' | 'descending';
}


interface ConfirmationDialogProps {
  isOpen: boolean;
  onCancel: () => void;
  children: React.ReactNode;
  title: string; showConfirmButton: boolean; cancelText: string; type: "info"; fullWidth: boolean;
}
export default function TrackingPage() {
  const [allRawLogs, setAllRawLogs] = useState<AuditLog[]>([]); // Lưu trữ tất cả logs lấy từ API (tối đa 5000 bản ghi)
  const [overallTotalLogs, setOverallTotalLogs] = useState(0); // Tổng số bản ghi từ phản hồi API
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState<Filters>({
    page: 1,
    pageSize: 15,
    search: '',
    actionType: 'all',
    userFilter: 'all', // Giá trị mặc định
    dateFrom: '',
    dateTo: '',
  });
  const [viewingLog, setViewingLog] = useState<AuditLog | null>(null);
  // Mặc định sắp xếp theo thời gian mới nhất
  const [sortConfig, setSortConfig] = useState<SortConfig>({ key: 'timestamp', direction: 'descending' });
  const [showFilters, setShowFilters] = useState(false);
  const { showToast } = useToast();

  const fetchLogs = async () => {
    setLoading(true);
    try {
      // Lấy một lượng lớn logs để thực hiện lọc và phân trang phía client
      // API backend hiện tại chỉ hỗ trợ page và pageSize, không hỗ trợ các bộ lọc khác.
      // Vì vậy, chúng ta lấy một khối lớn và lọc/phân trang trên client.
      const response = await apiClient.get('/AuditLogs', {
        params: {
          page: 1, // Luôn lấy trang đầu tiên
          pageSize: 5000, // Lấy một lượng lớn logs để xử lý phía client
        },
      });
      setAllRawLogs(response.data.data || []);
      setOverallTotalLogs(response.data.total || 0); // Tổng số bản ghi từ backend
    } catch (error) {
      console.error('Failed to fetch audit logs:', error);
      showToast('Không thể tải nhật ký hoạt động.', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, []); // Lấy tất cả logs một lần khi component được mount

  const handleFilterChange = (key: keyof Filters, value: any) => {
    setFilters(prev => {
      const newState = { ...prev, [key]: value };
      // Chỉ đặt lại trang về 1 nếu bộ lọc thay đổi không phải là 'page'
      if (key !== 'page') {
        newState.page = 1;
      }
      return newState;
    });
  };

  const handleResetFilters = () => {
    setFilters({
      page: 1,
      pageSize: 15,
      search: '',
      actionType: 'all',
      userFilter: 'all',
      dateFrom: '',
      dateTo: '',
    });
  };

  const requestSort = (key: keyof AuditLog) => {
    let direction: 'ascending' | 'descending' = 'ascending';
    if (sortConfig.key === key && sortConfig.direction === 'ascending') {
      direction = 'descending';
    }
    setSortConfig({ key, direction });
  };

  const { paginatedLogs, totalFilteredItems } = useMemo(() => {
    const from = filters.dateFrom ? new Date(filters.dateFrom) : null;
    if (from) from.setHours(0, 0, 0, 0);

    const to = filters.dateTo ? new Date(filters.dateTo) : null;
    if (to) to.setHours(23, 59, 59, 999);

    // 1. First, map over all logs to patch user names and determine display action type
    const patchedLogs = allRawLogs.map(log => {
      let displayActionType = log.actionType;
      if (log.entityType === 'RefreshToken') {
        if (log.actionType === 'CREATE') {
          displayActionType = 'LOGIN';
        } else if (log.actionType === 'DELETE') {
          displayActionType = 'LOGOUT';
        }
      }

      let patchedUserName = log.userName;
      if ((!log.userName || log.userName === 'Unknown') && (log.newValues || log.oldValues)) {
        try {
          const valuesString = log.newValues || log.oldValues;
          if (valuesString) {
            const parsedValues = JSON.parse(valuesString);
            const userId = parsedValues.UserId || parsedValues.userId;
            if (userId) {
              const knownLog = allRawLogs.find(l => (l.newValues?.includes(userId) || l.oldValues?.includes(userId)) && l.userName && l.userName !== 'Unknown');
              if (knownLog) {
                patchedUserName = knownLog.userName;
              }
            }
          }
        } catch (e) {
          // Ignore parsing errors
        }
      }
      return { ...log, userName: patchedUserName, displayActionType };
    });

    // 2. Now, filter the patched logs
    const finalFiltered = patchedLogs.filter(log => {
      // Always hide LOGOUT actions from the table
      if (log.displayActionType === 'LOGOUT') {
        return false;
      }

      const searchTerm = filters.search.toLowerCase();
      const okSearch = !searchTerm ||
        log.userName?.toLowerCase().includes(searchTerm) ||
        log.entityType?.toLowerCase().includes(searchTerm) ||
        log.displayActionType?.toLowerCase().includes(searchTerm);

      const okAction = filters.actionType === 'all' || log.displayActionType === filters.actionType;

      const okUser = filters.userFilter === 'all' || log.userName === filters.userFilter;

      const logDate = new Date(log.timestamp);
      const okDate = (!from || logDate >= from) && (!to || logDate <= to);

      return okSearch && okAction && okDate && okUser;
    });
    
    // 3. Sort the filtered logs
    const sortedLogs = [...finalFiltered].sort((a, b) => {
      const aValue = a[sortConfig.key];
      const bValue = b[sortConfig.key];

      if (aValue === null || bValue === null) return 0;

      let comparison = 0;
      if (typeof aValue === 'string' && typeof bValue === 'string') {
        comparison = aValue.localeCompare(bValue);
      } else {
        if (aValue < bValue) comparison = -1;
        if (aValue > bValue) comparison = 1;
      }
      return sortConfig.direction === 'ascending' ? comparison : -comparison;
    });

    // 4. Apply client-side pagination to the sorted logs
    const startIndex = (filters.page - 1) * filters.pageSize;
    const endIndex = startIndex + filters.pageSize;
    const paginated = sortedLogs.slice(startIndex, endIndex);

    return { paginatedLogs: paginated, totalFilteredItems: sortedLogs.length };
  }, [allRawLogs, filters, sortConfig]);
  
  const totalPages = Math.ceil(totalFilteredItems / filters.pageSize);

  // Các phép tính thống kê nên sử dụng allRawLogs
  const totalLogins = useMemo(() => allRawLogs.filter(log => log.entityType === 'RefreshToken' && log.actionType === 'CREATE').length, [allRawLogs]);
  const totalCreates = useMemo(() => allRawLogs.filter(log => log.actionType === 'CREATE' && log.entityType !== 'RefreshToken').length, [allRawLogs]);
  const totalUpdates = useMemo(() => allRawLogs.filter(log => log.actionType === 'UPDATE').length, [allRawLogs]);
  const totalDeletes = useMemo(() => allRawLogs.filter(log => log.actionType === 'DELETE' && log.entityType !== 'RefreshToken').length, [allRawLogs]);

  // Lấy danh sách người dùng duy nhất để hiển thị trong bộ lọc
  const uniqueUsers = useMemo(() => {
    const userNames = new Set<string>();
    // Use patchedLogs to get the correct user names
    allRawLogs.forEach(log => {
      let patchedUserName = log.userName;
      if ((!log.userName || log.userName === 'Unknown') && (log.newValues || log.oldValues)) {
        try {
          const valuesString = log.newValues || log.oldValues;
          if (valuesString) {
            const parsedValues = JSON.parse(valuesString);
            const userId = parsedValues.UserId || parsedValues.userId;
            if (userId) {
              const knownLog = allRawLogs.find(l => (l.newValues?.includes(userId) || l.oldValues?.includes(userId)) && l.userName && l.userName !== 'Unknown');
              if (knownLog) {
                patchedUserName = knownLog.userName;
              }
            }
          }
        } catch (e) { /* ignore */ }
      }

      if (patchedUserName && patchedUserName !== 'Unknown') {
        userNames.add(patchedUserName);
      }
    });
    return Array.from(userNames).sort();
  }, [allRawLogs]);

  // --- Friendly Display Functions ---
  // Chuyển đổi tên trường từ PascalCase/camelCase sang tiếng Việt
  const friendlyFieldNames: Record<string, string> = {
    DayOfWeek: 'Ngày trong tuần',
    StartTime: 'Giờ bắt đầu',
    EndTime: 'Giờ kết thúc',
    IsAvailable: 'Trạng thái sẵn sàng',
    OverrideDate: 'Ngày ghi đè',
    OverrideType: 'Loại lịch linh hoạt',
    Reason: 'Lý do',
    FullName: 'Họ và tên',
    PhoneNumber: 'Số điện thoại',
    Address: 'Địa chỉ',
    DateOfBirth: 'Ngày sinh',
    IdentificationNumber: 'Số CCCD',
    GenderCode: 'Giới tính',
    LockoutEnabled: 'Trạng thái khóa',
    Title: 'Tiêu đề',
    Summary: 'Tóm tắt',
    Content: 'Nội dung',
    CreatedAt: 'Ngày tạo',
    UpdatedAt: 'Ngày cập nhật',
    CreatedBy: 'Người tạo',
    UpdatedBy: 'Người cập nhật',
    IsActive: 'Trạng thái hoạt động',
    IsRead: 'Trạng thái đọc',
    IsPublished: 'Trạng thái xuất bản',
    IsApproved: 'Trạng thái phê duyệt',
    IsPinned: 'Ghim lên đầu',
    IsFeatured: 'Nổi bật',
    Message: 'Nội dung thông báo',
    Type: 'Kiểu',
    StatusCode: 'Trạng thái',
    // Thêm các trường khác nếu cần
    Slug: 'Đường dẫn (Slug)',
    DisplayType: 'Kiểu hiển thị',
    ThumbnailUrl: 'URL ảnh thu nhỏ',
    IsHomepageVisible: 'Hiển thị ở trang chủ',
    DisplayOrder: 'Thứ tự hiển thị',
    ViewCount: 'Lượt xem',
    LikeCount: 'Lượt thích',
    CoverImageUrl: 'URL ảnh bìa',
    MetaTitle: 'Tiêu đề SEO',
    MedicalHistory: 'Tiền sử bệnh',
    Token: 'Mã đăng nhập',
  };

  const getFriendlyFieldName = (key: string) => {
    if (friendlyFieldNames[key]) return friendlyFieldNames[key];
    const humanized = key
      .replace(/_/g, ' ')
      .replace(/([a-z0-9])([A-Z])/g, '$1 $2')
      .replace(/\s+/g, ' ')
      .trim();
    if (!humanized) return key;
    return humanized.charAt(0).toUpperCase() + humanized.slice(1);
  };

  // Chuyển đổi giá trị sang dạng dễ hiểu
  const getFriendlyValue = (key: string, value: any): string => {
    if (value === null || value === undefined) return 'Không có';
    
    const keyForCheck = key; // Sử dụng key gốc (PascalCase) để kiểm tra

    if (typeof value === 'boolean') {
      if (keyForCheck === 'IsAvailable') return value ? 'Sẵn sàng' : 'Không sẵn sàng';
      if (keyForCheck === 'LockoutEnabled') return value ? 'Đang khóa' : 'Hoạt động';
      if (keyForCheck === 'OverrideType') return value ? 'Tăng ca' : 'Nghỉ';
      if (keyForCheck === 'IsHomepageVisible') return value ? 'Hiển thị' : 'Ẩn';
      if (keyForCheck === 'IsRead') return value ? 'Đã đọc' : 'Chưa đọc';
      return value ? 'Có' : 'Không';
    }

    if (keyForCheck === 'OverrideType' && typeof value === 'number') {
      return value === 1 ? 'Tăng ca' : 'Nghỉ';
    }

    if (keyForCheck === 'DayOfWeek' && typeof value === 'number') {
      const days = ['Chủ Nhật', 'Thứ Hai', 'Thứ Ba', 'Thứ Tư', 'Thứ Năm', 'Thứ Sáu', 'Thứ Bảy'];
      return days[value] || 'Không xác định';
    }

    if (keyForCheck === 'StatusCode' && typeof value === 'string') {
      const statusMap: Record<string, string> = {
        'PUBLISHED': 'Đã xuất bản',
        'DRAFT': 'Bản nháp',
        'ARCHIVED': 'Lưu trữ',
      };
      return statusMap[value.toUpperCase()] || value;
    }

    if (key.toLowerCase().includes('date') && typeof value === 'string' && !isNaN(Date.parse(value))) {
      return new Date(value).toLocaleDateString('vi-VN');
    }

    const stringValue = String(value);
    if (stringValue.length > 50) {
      return stringValue.substring(0, 50) + '...';
    }

    return stringValue;
  };
  // --- End Friendly Display Functions ---

  const renderJson = (jsonString: string | null) => {
    if (!jsonString || jsonString.trim() === 'null' || jsonString.trim() === '{}') {
      return <div className={styles.jsonEmpty}>Không có dữ liệu</div>;
    }

    // --- Xử lý hiển thị diff cho HealthArticle ---
    // Dữ liệu diff từ backend có dạng đặc biệt với các dòng bắt đầu bằng '+' hoặc '-'
    const isDiffFormat = /"-\s+""|"\+\s+""/.test(jsonString) || (jsonString.includes('\r\n-') && jsonString.includes('\r\n+'));
    if (isDiffFormat) {
        try {
            // Chuẩn hóa chuỗi để có thể parse thành JSON
            const parsableJson = `[${jsonString.replace(/"\r\n/g, '",\r\n')}]`;
            const diffLines = JSON.parse(parsableJson);

            return (
                <div className={styles.diffContainer}>
                    {diffLines.map((line: string, index: number) => {
                        const trimmedLine = line.trim();
                        if (trimmedLine.startsWith('+')) {
                            return <div key={index} className={`${styles.diffLine} ${styles.diffAdded}`}>{trimmedLine}</div>;
                        }
                        if (trimmedLine.startsWith('-')) {
                            return <div key={index} className={`${styles.diffLine} ${styles.diffRemoved}`}>{trimmedLine}</div>;
                        }
                        return null; // Bỏ qua các dòng không phải là thay đổi
                    })}
                </div>
            );
        } catch (e) {
            // Nếu parse lỗi, hiển thị dạng thô
            return <pre>{jsonString}</pre>;
        }
    }

    // --- Xử lý hiển thị JSON thông thường ---
    try {
      const obj = JSON.parse(jsonString);
      if (typeof obj !== 'object' || obj === null) {
        return <pre>{jsonString}</pre>;
      }

      return (
        <div className={styles.jsonDetailList}>
          {Object.entries(obj).map(([key, value]) => {
            const lowerKey = key.toLowerCase();
            // Danh sách các trường kỹ thuật cần ẩn
            const fieldsToHide = [
              'id', 'userid', 'doctorid', 'patientid', 'appointmentid', 'medicalrecordid',
              'createdat', 'updatedat', 'normalizedemail', 'normalizedusername',
              'Id', 'UserId', 'DoctorId', 'PatientId', 'AppointmentId', 'MedicalRecordId',
              'passwordhash', 'securitystamp', 'concurrencystamp', 'walletid',
              'emailconfirmed', 'isprofilecompleted', 'accessfailedcount', 'istemporaryusername'
            ];

            // Ẩn các trường kỹ thuật không cần thiết
            if (fieldsToHide.some(field => lowerKey.endsWith(field))) {
              return null;
            }

            // Xử lý đặc biệt cho trường Content để hiển thị HTML
            if (key === 'Content' && typeof value === 'string') {
              // Giải mã các ký tự HTML
              const decodedContent = value.replace(/\\u003c/g, '<').replace(/\\u003e/g, '>');
              // Chuyển HTML thành văn bản thuần túy để rút gọn
              const plainText = decodedContent.replace(/<[^>]*>/g, '');
              const displayValue = plainText.length > 50 ? plainText.substring(0, 50) + '...' : plainText;

              return (
                  <div key={key} className={styles.jsonDetailItem}>
                      <strong className={styles.jsonKey}>{getFriendlyFieldName(key)}:</strong>
                      {/* Hiển thị văn bản đã được rút gọn */}
                      <div className={styles.jsonValue} title={plainText}>{displayValue}</div>
                  </div>
              );
            }

            if (key === 'User' && value === null) {
              return null;
            }

            return (
              <div key={key} className={styles.jsonDetailItem}>
                <strong className={styles.jsonKey}>{getFriendlyFieldName(key)}:</strong>
                <div className={styles.jsonValue} title={String(value)}>{getFriendlyValue(key, value)}</div>
              </div>
            );
          })}
        </div>
      );
    } catch {
      return <pre>{jsonString}</pre>;
    }
  };

  const actionLabelMap: Record<string, string> = {
    CREATE: 'Tạo mới',
    UPDATE: 'Cập nhật',
    DELETE: 'Xóa',
    LOGIN: 'Đăng nhập',
    LOGOUT: 'Đăng xuất',
    VIEW: 'Xem',
    APPROVE: 'Phê duyệt',
    REJECT: 'Từ chối',
  };

  const actionVerbMap: Record<string, string> = {
    CREATE: 'đã tạo mới',
    UPDATE: 'đã cập nhật',
    DELETE: 'đã xóa',
    LOGIN: 'đã đăng nhập vào',
    LOGOUT: 'đã đăng xuất khỏi',
    VIEW: 'đã xem',
    APPROVE: 'đã phê duyệt',
    REJECT: 'đã từ chối',
  };

  const entityLabelMap: Record<string, string> = {
    RefreshToken: 'Phiên đăng nhập',
    HealthArticle: 'Bài viết sức khỏe',
    DoctorSchedule: 'Lịch khám của bác sĩ',
    Appointment: 'Lịch hẹn',
    MedicalHistory: 'Hồ sơ bệnh án',
    Patient: 'Hồ sơ bệnh nhân',
    Doctor: 'Hồ sơ bác sĩ',
    Notification: 'Thông báo',
    SystemConfiguration: 'Cấu hình hệ thống',
    MedicalRecord: 'Hồ sơ bệnh án',
    BackupJob: 'Bản sao lưu',
    Feedback: 'Phản hồi người dùng',
  };

  const getFriendlyActionLabel = (action: string) =>
    actionLabelMap[action.toUpperCase()] || action;

  const getFriendlyEntityLabel = (entityType?: string) => {
    if (!entityType) return 'Đối tượng khác';
    if (entityType === 'RefreshToken') return entityLabelMap.RefreshToken;
    return entityLabelMap[entityType] || entityType;
  };

  const formatTimestamp = (timestamp: string) =>
    new Date(timestamp).toLocaleString('vi-VN', { timeZone: 'Asia/Ho_Chi_Minh' });

  const getActionDescription = (log: AuditLog) => {
    const actor = log.userName || 'Hệ thống';
    const actionVerb = actionVerbMap[log.displayActionType] || 'đã thao tác trên';
    if (log.displayActionType === 'LOGIN') {
      
    }
    const friendlyEntity =
      log.entityType === 'RefreshToken'
        ? 'phiên đăng nhập'
        : getFriendlyEntityLabel(log.entityType).toLowerCase();
    return `${actor} ${actionVerb} ${friendlyEntity}.`;
  };

  const getActionBadgeStyle = (action: string) => {
    switch (action.toUpperCase()) {
      case 'CREATE': return styles.actionCreate;
      case 'UPDATE': return styles.actionUpdate;
      case 'DELETE': return styles.actionDelete;
      case 'LOGIN': return styles.actionLogin;
      case 'LOGOUT': return styles.actionLogout;
      case 'VIEW': return styles.actionView;
      case 'APPROVE': return styles.actionApprove;
      case 'REJECT': return styles.actionReject;
      default: return '';
    }
  };

  return (
    <div className={userStyles.container}>
      <div className={userStyles.header}>
        <div className={userStyles.headerLeft}>
          <h1 className={userStyles.title}>Truy vết hoạt động</h1>
          <p className={userStyles.subtitle}>Theo dõi và phân tích các hoạt động trong hệ thống</p>
        </div>
        <div className={styles.headerRight}>
              <div className={styles.dateTime}>
                <i className="bi bi-calendar3"></i>
                <span>{new Date().toLocaleDateString('vi-VN')}</span>
              </div>
            </div>
      </div>

      <div className={styles.statsGrid}>
        <div className={`${styles.statCard} ${styles.statCard1}`}>
          <div className={styles.statIcon}><i className="bi bi-activity"></i></div>
          <div className={styles.statContent}>
            <div className={styles.statLabel}>Tổng hoạt động</div> {/* Tổng số bản ghi từ backend */}
            <div className={styles.statValue}>{totalFilteredItems}</div>
          </div>
        </div>
        <div className={`${styles.statCard} ${styles.statCardLogin}`}>
          <div className={styles.statIcon}><i className="bi bi-box-arrow-in-right"></i></div>
          <div className={styles.statContent}>
            <div className={styles.statLabel}>Đăng nhập</div>
            <div className={styles.statValue}>{totalLogins}</div>
          </div>
        </div>
        <div className={`${styles.statCard} ${styles.statCard2}`}>
          <div className={styles.statIcon}><i className="bi bi-plus-circle"></i></div>
          <div className={styles.statContent}>
            <div className={styles.statLabel}>Hành động Tạo mới</div>
            <div className={styles.statValue}>{totalCreates}</div>
          </div>
        </div>
        <div className={`${styles.statCard} ${styles.statCard4}`}>
          <div className={styles.statIcon}><i className="bi bi-pencil"></i></div>
          <div className={styles.statContent}>
            <div className={styles.statLabel}>Hành động Cập nhật</div>
            <div className={styles.statValue}>{totalUpdates}</div>
          </div>
        </div>
        <div className={`${styles.statCard} ${styles.statCard3}`}>
          <div className={styles.statIcon}><i className="bi bi-trash"></i></div>
          <div className={styles.statContent}>
            <div className={styles.statLabel}>Hành động Xóa</div>
            <div className={styles.statValue}>{totalDeletes}</div>
          </div>
        </div>
      </div>

      <div className={userStyles.contentCard}>
        

       

        {/* Search and Filter */}
        <div className={userStyles.searchSection}>
            <div className={userStyles.searchWrapper}>
                <i className="bi bi-search"></i>
                <input
                    type="text"
                    placeholder="Tìm kiếm theo tên hoặc loại đối tượng..."
                    value={filters.search}
                    onChange={e => handleFilterChange('search', e.target.value)}
                    className={userStyles.searchInput}
                />
                {filters.search && (
                    <button
                        className={userStyles.clearSearch}
                        onClick={() => handleFilterChange('search', '')}
                    >
                        <i className="bi bi-x-lg"></i>
                    </button>
                )}
            </div>

            <button
                className={`${userStyles.btnFilter} ${showFilters ? userStyles.active : ''}`}
                onClick={() => setShowFilters(!showFilters)}
            >
                <i className="bi bi-funnel"></i>
                Bộ lọc
                {(filters.actionType !== 'all' || filters.userFilter !== 'all' || filters.dateFrom || filters.dateTo) && (
                    <span className={userStyles.filterBadge}></span>
                )}
            </button>
        </div>

        {/* Advanced Filters */}
        {showFilters && (
            <div className={userStyles.filterPanel}>
                <div className={userStyles.filterGrid}>
                    <div className={userStyles.filterItem}>
                        <label><i className="bi bi-activity"></i> Hành động</label>
                        <select value={filters.actionType} onChange={e => handleFilterChange('actionType', e.target.value)}>
                            <option value="all">Tất cả hành động</option>
                            <option value="CREATE">Tạo mới (Create)</option>
                            <option value="UPDATE">Cập nhật (Update)</option>
                            <option value="DELETE">Xóa (Delete)</option>
                            <option value="LOGIN">Đăng nhập (Login)</option>
                        </select>
                    </div>
                    <div className={userStyles.filterItem}>
                        <label><i className="bi bi-person"></i> Người dùng</label>
                        <select value={filters.userFilter} onChange={e => handleFilterChange('userFilter', e.target.value)}>
                            <option value="all">Tất cả người dùng</option>
                            {uniqueUsers.map(user => (
                                <option key={user} value={user}>{user}</option>
                            ))}
                        </select>
                    </div>
                    <div className={userStyles.filterItem}>
                        <label><i className="bi bi-calendar-event"></i> Từ ngày</label>
                        <input type="date" value={filters.dateFrom} onChange={e => handleFilterChange('dateFrom', e.target.value)} />
                    </div>
                    <div className={userStyles.filterItem}>
                        <label><i className="bi bi-calendar-check"></i> Đến ngày</label>
                        <input type="date" value={filters.dateTo} onChange={e => handleFilterChange('dateTo', e.target.value)} />
                    </div>
                </div>
                <div className={userStyles.filterActions}>
                    <button onClick={handleResetFilters} className={userStyles.btnResetFilter}>
                        <i className="bi bi-arrow-counterclockwise"></i> Đặt lại bộ lọc
                    </button>
                </div>
            </div>
        )}

        <div className={userStyles.tableCard}>
          {loading ? (
            <div className={userStyles.loading}>
              <div className={userStyles.loadingSpinner}></div>
              <p>Đang tải dữ liệu...</p>
            </div>
          ) : paginatedLogs.length > 0 ? (
            <div className={userStyles.tableWrapper}>
              <table className={userStyles.table}>
                <thead>
                  <tr>
                    <th style={{ width: '60px' }}>STT</th>
                    <th onClick={() => requestSort('timestamp')} className={userStyles.sortable}>
                      Thời gian
                      {sortConfig.key === 'timestamp' && (
                        <i className={`bi bi-arrow-${sortConfig.direction === 'ascending' ? 'up' : 'down'}`}></i>
                      )}
                    </th>
                    <th onClick={() => requestSort('userName')} className={userStyles.sortable}>
                      Người dùng
                      {sortConfig.key === 'userName' && (
                        <i className={`bi bi-arrow-${sortConfig.direction === 'ascending' ? 'up' : 'down'}`}></i>
                      )}
                    </th>
                    <th>Hành động</th>
                  <th>Loại đối tượng</th>
                  <th>Mô tả chi tiết</th>
                    <th style={{ textAlign: 'right', width: '150px' }}>Thao tác</th>
                  </tr>
                </thead>
                <tbody>
                  {paginatedLogs.map((log, index) => (
                    <tr key={log.id} className={userStyles.tableRow}>
                      <td className={userStyles.indexCell}>
                        {(filters.page - 1) * filters.pageSize + index + 1}
                      </td>
                      <td title={new Date(log.timestamp).toLocaleString('vi-VN', { timeZone: 'Asia/Ho_Chi_Minh' })}>
                        {new Date(log.timestamp).toLocaleTimeString('vi-VN', { timeZone: 'Asia/Ho_Chi_Minh', hour12: false })}
                        <br />
                        <small>{new Date(log.timestamp).toLocaleDateString('vi-VN', { timeZone: 'Asia/Ho_Chi_Minh' })}</small>
                      </td>
                      <td>
                        <div className={userStyles.userCell}>
                          <img
                            src={`https://ui-avatars.com/api/?name=${encodeURIComponent(log.userName || 'Unknown')}&background=random&color=fff`}
                            alt={log.userName || 'Unknown'}
                            className={userStyles.avatar}
                          />
                          <span className={userStyles.userName}>{log.userName || 'Unknown'}</span>
                        </div>
                      </td>
                      <td>
                        <div className={styles.actionCell}>
                          <span className={`${styles.actionBadge} ${getActionBadgeStyle(log.displayActionType)}`}>
                            {getFriendlyActionLabel(log.displayActionType)}
                          </span>
                        </div>
                      </td>
                      <td>
                        <div className={styles.entityCell}>
                          <span className={styles.entityLabel}>
                            {log.entityType === 'RefreshToken' ? 'Phiên đăng nhập' : getFriendlyEntityLabel(log.entityType)}
                          </span>
                        </div>
                      </td>
                      <td className={styles.descriptionCell}>
                        <p className={styles.actionDescription}>{getActionDescription(log)}</p>
                        <div className={styles.descriptionMeta}>
                          <span className={styles.metaItem}>
                          
                          </span>
                          {log.ipAddress && (
                            <span className={styles.metaItem}>
                             
                            </span>
                          )}
                         
                        </div>
                      </td>
                      <td>
                        <div className={userStyles.actions}>
                          <button onClick={() => setViewingLog(log)} className={userStyles.actionBtn} title="Xem chi tiết">
                            <i className="bi bi-eye"></i>
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className={userStyles.emptyState}>
              <i className="bi bi-inbox"></i>
              <p>Không có dữ liệu truy vết nào</p>
            </div>
          )}

          {/* Pagination */}
          {paginatedLogs.length > 0 && (
            <div className={userStyles.pagination}>
              <div className={userStyles.paginationInfo}>
                Hiển thị {(filters.page - 1) * filters.pageSize + 1} - {Math.min(filters.page * filters.pageSize, totalFilteredItems)} trong tổng số {totalFilteredItems} kết quả
              </div>

              <div className={userStyles.paginationControls}>
                <select value={filters.pageSize} onChange={e => handleFilterChange('pageSize', Number(e.target.value))}>
                  <option value={5}>5 / trang</option>
                  <option value={10}>10 / trang</option>
                  <option value={15}>15 / trang</option>
                  <option value={20}>20 / trang</option>
                  <option value={50}>50 / trang</option>
                </select>

                <div className={userStyles.paginationButtons}>
                  <button onClick={() => handleFilterChange('page', 1)} disabled={filters.page <= 1} title="Trang đầu">
                    <i className="bi bi-chevron-double-left"></i>
                  </button>
                  <button onClick={() => handleFilterChange('page', filters.page - 1)} disabled={filters.page <= 1} title="Trang trước">
                    <i className="bi bi-chevron-left"></i>
                  </button>
                  <span className={userStyles.pageIndicator}>{filters.page} / {totalPages || 1}</span>
                  <button onClick={() => handleFilterChange('page', filters.page + 1)} disabled={filters.page >= totalPages} title="Trang sau">
                    <i className="bi bi-chevron-right"></i>
                  </button>
                  <button onClick={() => handleFilterChange('page', totalPages)} disabled={filters.page >= totalPages} title="Trang cuối">
                    <i className="bi bi-chevron-double-right"></i>
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

      </div>

      {viewingLog && (
        <div className={userStyles.modalOverlay} onClick={() => setViewingLog(null)}>
          <div className={userStyles.modalContent} onClick={(e) => e.stopPropagation()}>
            <div className={userStyles.modalHeader}>
              <h3>Chi tiết hoạt động</h3>
              <button onClick={() => setViewingLog(null)} className={userStyles.closeButton}>
                <i className="bi bi-x-lg"></i>
              </button>
            </div>
            <div 
              className={userStyles.modalBody} 
              style={{
                maxHeight: '70vh', // Giới hạn chiều cao tối đa của phần thân modal
                overflowY: 'auto'  // Thêm thanh cuộn dọc khi nội dung vượt quá chiều cao
              }}>
              <div className={styles.modalSummary}>
                <div className={styles.summaryIcon}>
                  <i className="bi bi-activity"></i>
                </div>
                <div>
                  <div className={styles.modalSummaryTitle}>{getActionDescription(viewingLog)}</div>
                  <div className={styles.summaryMeta}>
                    <span className={styles.infoPill}>
                      <i className="bi bi-person-circle"></i>
                      {viewingLog.userName || 'Không rõ người dùng'}
                    </span>
                    <span className={styles.infoPill}>
                      <i className="bi bi-cpu"></i>
                      {viewingLog.entityType === 'RefreshToken' ? 'Phiên đăng nhập' : getFriendlyEntityLabel(viewingLog.entityType)}
                    </span>
                    <span className={styles.infoPill}>
                      <i className="bi bi-clock-history"></i>
                      {formatTimestamp(viewingLog.timestamp)}
                    </span>
                    
                  </div>
                </div>
              </div>
              <div className={styles.jsonContainer}> 
                <div className={styles.jsonBox}> 
                  <h4>Trước khi thay đổi</h4>
                  {renderJson(viewingLog.oldValues)}
                </div>
                <div className={styles.jsonBox}> 
                  <h4>Sau khi thay đổi</h4>
                  {renderJson(viewingLog.newValues)}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
