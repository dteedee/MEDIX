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
  dateFrom: string;
  dateTo: string;
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
    dateFrom: '',
    dateTo: '',
  });
  const [viewingLog, setViewingLog] = useState<AuditLog | null>(null);
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
      dateFrom: '',
      dateTo: '',
    });
  };

  const { paginatedLogs, totalFilteredItems } = useMemo(() => {
    const from = filters.dateFrom ? new Date(filters.dateFrom) : null;
    if (from) from.setHours(0, 0, 0, 0);

    const to = filters.dateTo ? new Date(filters.dateTo) : null;
    if (to) to.setHours(23, 59, 59, 999);

    // 1. Áp dụng bộ lọc phía client cho tất cả logs thô
    const filtered = allRawLogs.filter(log => {
      // Determine the display action type for filtering purposes
      let displayActionType = log.actionType;
      if (log.entityType === 'RefreshToken') {
        if (log.actionType === 'CREATE') {
          displayActionType = 'LOGIN';
        } else if (log.actionType === 'DELETE') {
          displayActionType = 'LOGOUT';
        }
      }

      const searchTerm = filters.search.toLowerCase();
      const okSearch = !searchTerm ||
        log.userName?.toLowerCase().includes(searchTerm) ||        
        log.entityType?.toLowerCase().includes(searchTerm) ||
        displayActionType?.toLowerCase().includes(searchTerm); // Use displayActionType for search

      const okAction = filters.actionType === 'all' || displayActionType === filters.actionType; // Filter by displayActionType

      const logDate = new Date(log.timestamp);
      const okDate = (!from || logDate >= from) && (!to || logDate <= to);

      return okSearch && okAction && okDate;
    }).map(log => {
      // Map to include displayActionType for rendering
      let displayActionTypeForRender: string = log.actionType;
      if (log.entityType === 'RefreshToken') {
        if (log.actionType === 'CREATE') {
          displayActionTypeForRender = 'LOGIN';
        } else if (log.actionType === 'DELETE') {
          displayActionTypeForRender = 'LOGOUT';
        }
      }
      return { ...log, displayActionType: displayActionTypeForRender };
    });

    // 2. Áp dụng phân trang phía client cho các logs đã lọc
    const startIndex = (filters.page - 1) * filters.pageSize;
    const endIndex = startIndex + filters.pageSize;
    const paginated = filtered.slice(startIndex, endIndex);

    return { paginatedLogs: paginated, totalFilteredItems: filtered.length };
  }, [allRawLogs, filters.search, filters.actionType, filters.dateFrom, filters.dateTo, filters.page, filters.pageSize]);

  const totalPages = Math.ceil(totalFilteredItems / filters.pageSize);

  // Các phép tính thống kê nên sử dụng allRawLogs
  const totalLogins = useMemo(() => allRawLogs.filter(log => log.entityType === 'RefreshToken' && log.actionType === 'CREATE').length, [allRawLogs]);
  const totalCreates = useMemo(() => allRawLogs.filter(log => log.actionType === 'CREATE' && log.entityType !== 'RefreshToken').length, [allRawLogs]);
  const totalUpdates = useMemo(() => allRawLogs.filter(log => log.actionType === 'UPDATE').length, [allRawLogs]);
  const totalDeletes = useMemo(() => allRawLogs.filter(log => log.actionType === 'DELETE' && log.entityType !== 'RefreshToken').length, [allRawLogs]);

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
            // Ẩn tất cả các trường có tên kết thúc bằng "Id" (không phân biệt chữ hoa chữ thường)
            if (key.toLowerCase().endsWith('id')) {
              return null;
            }

            let displayValue = JSON.stringify(value, null, 2);

            // Rút gọn giá trị dài và giải mã HTML cho trường Content
            if (key === 'Content' && typeof value === 'string') {
                const decodedContent = value.replace(/\\u003c/g, '<').replace(/\\u003e/g, '>');
                return (
                    <div key={key} className={styles.jsonDetailItem}>
                        <strong className={styles.jsonKey}>{key}:</strong>
                        <div className={styles.htmlContent} dangerouslySetInnerHTML={{ __html: decodedContent }} />
                    </div>
                );
            }

            if (typeof value === 'string' && value.length > 70) {
              displayValue = `"${value.substring(0, 70)}..."`;
            }

            if (key === 'User' && value === null) {
              return null;
            }

            return (
              <div key={key} className={styles.jsonDetailItem}>
                <strong className={styles.jsonKey}>{key}:</strong>
                <span className={styles.jsonValue} title={JSON.stringify(value, null, 2)}>{displayValue}</span>
              </div>
            );
          })}
        </div>
      );
    } catch {
      return <pre>{jsonString}</pre>;
    }
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
    <div className={styles.container}>
      <div className={styles.header}>
        <div className={styles.headerLeft}>
          <h1 className={styles.title}>Truy vết hoạt động</h1>
          <p className={styles.subtitle}>Theo dõi và phân tích các hoạt động trong hệ thống</p>
        </div>
      </div>

      <div className={styles.statsGrid}>
        <div className={`${styles.statCard} ${styles.statCard1}`}>
          <div className={styles.statIcon}><i className="bi bi-activity"></i></div>
          <div className={styles.statContent}>
            <div className={styles.statLabel}>Tổng hoạt động</div> {/* Tổng số bản ghi từ backend */}
            <div className={styles.statValue}>{overallTotalLogs}</div>
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

      <div className={styles.logCard}>
        <div className={styles.logHeader}>
          <h3>Nhật ký hoạt động</h3>
          <div className={styles.logActions}>
            <button onClick={fetchLogs} className={styles.refreshBtn} disabled={loading}>
              <i className={`bi bi-arrow-clockwise ${loading ? styles.spinning : ''}`}></i>
              Làm mới
            </button>
          </div>
        </div>

        <div className={styles.filterSection}>
          <div className={styles.searchWrapper}>
            <i className="bi bi-search"></i>
            <input
              type="text"
              placeholder="Tìm theo Tên, Loại đối tượng..."
              value={filters.search}
              onChange={e => handleFilterChange('search', e.target.value)}
              className={styles.searchInput}
            />
          </div>
          <select value={filters.actionType} onChange={e => handleFilterChange('actionType', e.target.value)} className={styles.filterSelect}>
            <option value="all">Tất cả hành động</option>
            <option value="CREATE">Tạo mới (Create)</option>
            <option value="UPDATE">Cập nhật (Update)</option>
            <option value="DELETE">Xóa (Delete)</option>
            <option value="LOGIN">Đăng nhập (Login)</option>
            <option value="LOGOUT">Đăng xuất (Logout)</option>
          </select>
          <input type="date" value={filters.dateFrom} onChange={e => handleFilterChange('dateFrom', e.target.value)} className={styles.dateInput} />
          <input type="date" value={filters.dateTo} onChange={e => handleFilterChange('dateTo', e.target.value)} className={styles.dateInput} />
          <button onClick={handleResetFilters} className={styles.resetBtn}>
            <i className="bi bi-x-circle"></i> Đặt lại
          </button>
        </div>

        {loading ? (
          <div className={styles.loadingContainer}><LoadingSpinner /></div>
        ) : paginatedLogs.length > 0 ? (
          <div className={styles.logTableWrapper}>
            <table className={styles.logTable}>
              <thead>
                <tr>
                  <th>STT</th>
                  <th>Thời gian</th>
                  <th>Người dùng</th>
                  <th>Hành động</th>
                  <th>Loại đối tượng</th>
                  <th>Chi tiết</th>
                </tr>
              </thead>
              <tbody>
                {paginatedLogs.map((log, index) => (
                  <tr key={log.id}>
                    <td>
                      {(filters.page - 1) * filters.pageSize + index + 1}
                    </td>
                    {/* Đảm bảo timestamp được xử lý như UTC trước khi chuyển đổi sang múi giờ Việt Nam */}
                    {/* Nếu log.timestamp là "YYYY-MM-DDTHH:mm:ss" (không có Z), new Date() sẽ hiểu là giờ địa phương. */}
                    {/* Thêm 'Z' để buộc hiểu là UTC. */}
                    <td title={new Date(`${log.timestamp}Z`).toLocaleString('vi-VN', { timeZone: 'Asia/Ho_Chi_Minh' })}>
                      {new Date(`${log.timestamp}Z`).toLocaleTimeString('vi-VN', { timeZone: 'Asia/Ho_Chi_Minh', hour12: false })}
                      <br />
                      <small>{new Date(`${log.timestamp}Z`).toLocaleDateString('vi-VN', { timeZone: 'Asia/Ho_Chi_Minh' })}</small>
                    </td>                    
                    <td>{log.userName || 'Unknown'}</td>
                    <td><span className={`${styles.actionBadge} ${getActionBadgeStyle(log.displayActionType)}`}>{log.displayActionType}</span></td>
                    <td>{log.entityType || 'N/A'}</td>
                    <td>
                      <button onClick={() => setViewingLog(log)} className={styles.detailBtn} title="Xem chi tiết">
                        <i className="bi bi-eye"></i>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className={styles.emptyState}>
            <i className="bi bi-inbox"></i>
            <p>Không có dữ liệu truy vết nào</p>
          </div>
        )}

        {/* Pagination */}
        {totalFilteredItems > 0 && (
          <div className={styles.pagination}>
            <div className={styles.paginationInfo}>
              Hiển thị {(filters.page - 1) * filters.pageSize + 1} - {Math.min(filters.page * filters.pageSize, totalFilteredItems)} trong tổng số {totalFilteredItems} kết quả
            </div>

            <div className={styles.paginationControls}>
              <select
                value={filters.pageSize}
                onChange={e => handleFilterChange('pageSize', Number(e.target.value))}
                className={styles.pageSizeSelect}
              >
                <option value={5}>5 / trang</option>
                <option value={10}>10 / trang</option>
                <option value={15}>15 / trang</option>
                <option value={20}>20 / trang</option>
                <option value={50}>50 / trang</option>
              </select>

              <div className={styles.paginationButtons}>
                <button
                  onClick={() => handleFilterChange('page', 1)}
                  disabled={filters.page <= 1}
                  title="Trang đầu"
                >
                  <i className="bi bi-chevron-double-left"></i>
                </button>
                <button
                  onClick={() => handleFilterChange('page', filters.page - 1)}
                  disabled={filters.page <= 1}
                  title="Trang trước"
                >
                  <i className="bi bi-chevron-left"></i>
                </button>

                <span className={styles.pageIndicator}>
                  {filters.page} / {totalPages || 1}
                </span>

                <button
                  onClick={() => handleFilterChange('page', filters.page + 1)}
                  disabled={filters.page >= totalPages}
                  title="Trang sau"
                >
                  <i className="bi bi-chevron-right"></i>
                </button>
                <button
                  onClick={() => handleFilterChange('page', totalPages)}
                  disabled={filters.page >= totalPages}
                  title="Trang cuối"
                >
                  <i className="bi bi-chevron-double-right"></i>
                </button>
              </div>
            </div>
          </div>
        )}

      </div>

      {viewingLog && (
        <div className={userStyles.modalOverlay} onClick={() => setViewingLog(null)}>
          <div className={userStyles.modalContent} onClick={(e) => e.stopPropagation()}>
            <div className={userStyles.modalHeader}>
              <h3>Chi tiết Log #{viewingLog.id}</h3>
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
              <div className={styles.detailItem}><strong>Hành động:</strong> {viewingLog.actionType}</div>
              <div className={styles.detailItem}><strong>Đối tượng:</strong> {viewingLog.entityType}</div>
              <div className={styles.detailItem}><strong>Người dùng:</strong> {viewingLog.userName}</div>
              <div className={styles.detailItem}><strong>Thời gian:</strong> {new Date(`${viewingLog.timestamp}Z`).toLocaleString('vi-VN', { timeZone: 'Asia/Ho_Chi_Minh' })}</div>
              <div className={styles.jsonContainer}> 
                <div className={styles.jsonBox}> 
                  <h4>Giá trị cũ (Old Values)</h4>
                  {renderJson(viewingLog.oldValues)}
                </div>
                <div className={styles.jsonBox}> 
                  <h4>Giá trị mới (New Values)</h4>
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
