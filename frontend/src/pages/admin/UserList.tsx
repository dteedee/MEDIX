import React, { useEffect, useMemo, useState, useCallback } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { userAdminService } from '../../services/userService'
import { UserDTO, UpdateUserRequest, CreateUserRequest } from '../../types/user.types'
import { useToast } from '../../contexts/ToastContext'
import { useAuth } from '../../contexts/AuthContext'
import UserDetails from './UserDetails' // Make sure this component can handle a possibly null user
import UserForm from './UserForm' // Make sure this component can handle a possibly null user
import ConfirmationDialog from '../../components/ui/ConfirmationDialog'
import styles from '../../styles/admin/UserList.module.css'

interface Role {
  code: string;
  displayName: string;
}

interface UserStats {
  totalUsers: number;
  activeUsers: number;
  newUsersLast7Days: number;
  doctorCount: number;
  growthPercentageLast7Days: number;
}

interface UserListFilters {
  page: number;
  pageSize: number;
  search: string;
  roleFilter: 'all' | 'ADMIN' | 'MANAGER' | 'DOCTOR' | 'PATIENT';
  statusFilter: 'all' | 'locked' | 'unlocked';
  dateFrom: string;
  dateTo: string;
  sortBy: string;
  sortDirection: 'asc' | 'desc';
}

const getInitialState = (): UserListFilters => {
  try {
    const savedState = localStorage.getItem('userListState');
    if (savedState) {
      return JSON.parse(savedState);
    }
  } catch (e) {
    console.error("Failed to parse userListState from localStorage", e);
  }
  return {
    page: 1,
    pageSize: 10,
    search: '',
    roleFilter: 'all' as const,
    statusFilter: 'all',
    dateFrom: '',
    dateTo: '',
    sortBy: 'createdAt',
    sortDirection: 'desc' as const,
  };
};

const isUserLocked = (user?: UserDTO): boolean => {
  if (!user) return false;
  if (user.lockoutEnabled === true) {
    return true;
  }
  const lockoutEndVal = user.lockoutEnd;
  if (lockoutEndVal) {
    return new Date(lockoutEndVal).getTime() > Date.now();
  }
  return false;
};

export default function UserList() {  const [users, setUsers] = useState<UserDTO[]>([]);
  const [total, setTotal] = useState<number | undefined>(undefined);
  const [allUsersForStats, setAllUsersForStats] = useState<UserDTO[]>([]);  const [rolesList, setRolesList] = useState<Role[]>([]);
  const [stats, setStats] = useState<UserStats | null>(null);
  const [filters, setFilters] = useState<UserListFilters>(getInitialState);
  const [loading, setLoading] = useState(true);
  const [viewing, setViewing] = useState<UserDTO | null>(null);
  const [editing, setEditing] = useState<UserDTO | null>(null);
  const [creating, setCreating] = useState(false);
  const [loadingDetails, setLoadingDetails] = useState(false);
  const [updatingIds, setUpdatingIds] = useState<Record<string, boolean>>({});
  const [showFilters, setShowFilters] = useState(false);
  const [confirmationDialog, setConfirmationDialog] = useState<{
    isOpen: boolean;
    user: UserDTO | null;
    action: 'lock' | 'unlock' | null;
  }>({
    isOpen: false,
    user: null,
    action: null
  });

  const { showToast } = useToast();
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const load = useCallback(async () => {
    setLoading(true);
    try {
      // TODO: Backend và userAdminService.list cần được cập nhật để xử lý đầy đủ các bộ lọc.
      // Tạm thời chỉ truyền các tham số được hỗ trợ để tránh lỗi.
      // Khi backend sẵn sàng, bạn có thể truyền đầy đủ object `filters`.
      // const response = await userAdminService.list(filters);
      const response = await userAdminService.list(filters.page, filters.pageSize, filters.search);
      setUsers(response.items || []);
      setTotal(response.total);
    } catch (error) {
      showToast('Không thể tải danh sách người dùng.', 'error');
    } finally {
      setLoading(false);
    }
  }, [filters, showToast]); // Dependency `filters` là đúng để load lại khi filter thay đổi

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    const fetchRoles = async () => {
      try {
        const roles = await userAdminService.getRoles();
        setRolesList(roles);
      } catch (error) {
        console.error("Failed to fetch roles:", error);        
        showToast('Không thể tải danh sách vai trò.', 'error');
      }
    };

    const fetchStats = async () => {
      try {
        // Tải một lượng lớn người dùng (không phân trang) để tính toán thống kê phía client.
        // Đây là giải pháp tạm thời khi chưa có API thống kê riêng.
        const statsResponse = await userAdminService.list(1, 5000); // Lấy 5000 người dùng
        setAllUsersForStats(statsResponse.items || []);
      } catch (error) {
        showToast('Không thể tải dữ liệu thống kê.', 'warning');
        console.error("Failed to fetch stats:", error);
      }
    };
    fetchRoles();
    fetchStats();
  }, [showToast]);

  useEffect(() => {
    localStorage.setItem('userListState', JSON.stringify(filters));
  }, [filters]);
  
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [filters.page, filters.pageSize]);

  const handleFilterChange = (key: keyof UserListFilters, value: any) => {
    setFilters(prev => {
      const newState = { ...prev, [key]: value };
      if (key !== 'page') newState.page = 1;
      return newState;
    });
  };

  const handleStatusChange = (userToUpdate: UserDTO, isBeingLocked: boolean) => {
    const currentUser = users.find(u => u.id === userToUpdate.id) ?? userToUpdate;
    const currentlyLocked = isUserLocked(currentUser);

    // Nếu trạng thái hiện tại giống với action muốn thực hiện thì không làm gì
    if (currentlyLocked === isBeingLocked) return;

    setConfirmationDialog({
      isOpen: true,
      user: currentUser,
      action: isBeingLocked ? 'lock' : 'unlock'
    });
  };

  const handleConfirmStatusChange = async () => {
    if (!confirmationDialog.user || !confirmationDialog.action) return;

    const { user: currentUser, action } = confirmationDialog;
    const isBeingLocked = action === 'lock';
    const actionText = isBeingLocked ? 'khóa' : 'mở khóa';

    setConfirmationDialog({ isOpen: false, user: null, action: null });
    showToast(`Đang ${actionText} tài khoản "${currentUser.fullName || currentUser.email}"...`, 'info');

    setUpdatingIds(prev => ({ ...prev, [currentUser.id]: true }));

    try {
      const payload: UpdateUserRequest = {
        role: currentUser.role,
        lockoutEnabled: isBeingLocked,
      };
      
      // Nếu mở khóa thì clear lockoutEnd
      if (!isBeingLocked) {
        (payload as any).lockoutEnd = null;
      }

      await userAdminService.update(currentUser.id, payload);
      showToast(`Đã ${actionText} tài khoản thành công.`, 'success');
      await load(); // Tải lại dữ liệu sau khi cập nhật
    } catch (error: any) {
      console.error('Lỗi khi cập nhật trạng thái:', error);
      const message = error?.response?.data?.message || error?.message || 'Không thể cập nhật trạng thái tài khoản.';
      showToast(message, 'error');
    } finally {
      setUpdatingIds(prev => ({ ...prev, [currentUser.id]: false }));
    }
  };

  const handleSort = (column: string) => {
    if (filters.sortBy === column) {
      handleFilterChange('sortDirection', filters.sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setFilters(prev => ({ ...prev, sortBy: column, sortDirection: 'desc' as const }));
    }
  };

  const onCreate = () => setCreating(true);
  const onEdit = (u: UserDTO) => setEditing(u);

  const handleViewDetails = async (userId: string) => {
    setLoadingDetails(true);
    setViewing({ id: userId } as UserDTO);
    try {
      const fullUser = await userAdminService.get(userId);
      setViewing(fullUser);
    } catch (error) {
      console.error("Failed to load user details:", error);
      showToast('Không thể tải chi tiết người dùng', 'error');
      setViewing(null);
    } finally {
      setLoadingDetails(false);
    }
  }

  const handleCreateUser = async (userData: CreateUserRequest) => {
    try {
      showToast('Đang tạo người dùng mới...', 'info');
      await userAdminService.create(userData);
      showToast('Tạo người dùng thành công!', 'success');
      setCreating(false); // Đóng modal
      await load();
    } catch (error: any) {
      console.error('Failed to create user:', error);
      const message = error?.response?.data?.message || error?.message || 'Không thể tạo người dùng';
      showToast(message, 'error');
    }
  }

  const handleEditUser = async (userData: UpdateUserRequest) => {
    if (!editing) return;
    
    try {
      showToast('Đang cập nhật thông tin người dùng...', 'info');
      await userAdminService.update(editing.id, userData);
      showToast('Cập nhật thành công!', 'success');
      setEditing(null); // Đóng modal
      await load();
    } catch (error: any) {
      console.error('Failed to update user:', error);
      const message = error?.response?.data?.message || error?.message || 'Không thể cập nhật người dùng';
      showToast(message, 'error');
    }
  }

  const handleCreateFormSaved = () => {
    setCreating(false);
    load();
  }

  const handleEditFormSaved = () => {
    setEditing(null);
    load();
  }

  // Với phân trang phía server, `users` chính là danh sách đã được xử lý cho trang hiện tại.
  const processedItems = users;

  const handleResetFilters = () => {
    setFilters({
      ...filters,
      roleFilter: 'all',
      statusFilter: 'all',
      dateFrom: '',
      dateTo: '',
    });
  };

  // Tính toán thống kê từ danh sách đã tải về
  const calculatedStats = useMemo(() => {
    if (allUsersForStats.length === 0) {
      return { activeUsers: 0, newUsersLast7Days: 0, doctorCount: 0, growthPercentageLast7Days: 0, lockedUsersCount: 0 };
    }

    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    const fourteenDaysAgo = new Date();
    fourteenDaysAgo.setDate(fourteenDaysAgo.getDate() - 14);

    const activeUsers = allUsersForStats.filter(u => !isUserLocked(u)).length;
    const newUsersLast7Days = allUsersForStats.filter(u => u.createdAt && new Date(u.createdAt) >= sevenDaysAgo).length;
    const doctorCount = allUsersForStats.filter(u => u.role?.toUpperCase() === 'DOCTOR').length;
    const lockedUsersCount = allUsersForStats.filter(u => isUserLocked(u)).length;
    
    const previousWeekUsers = allUsersForStats.filter(u => u.createdAt && new Date(u.createdAt) >= fourteenDaysAgo && new Date(u.createdAt) < sevenDaysAgo).length;
    const growthPercentage = previousWeekUsers > 0 
      ? Math.round(((newUsersLast7Days - previousWeekUsers) / previousWeekUsers) * 100) 
      : (newUsersLast7Days > 0 ? 100 : 0);

    return { activeUsers, newUsersLast7Days, doctorCount, growthPercentageLast7Days: growthPercentage, lockedUsersCount };
  }, [allUsersForStats]);

  const totalPages = total ? Math.ceil(total / filters.pageSize) : 1;

  return (
    <div className={styles.container}>
      {/* Header */}
      <div className={styles.header}>
        <div className={styles.headerLeft}>
          <h1 className={styles.title}>Quản lý Người dùng</h1>
          <p className={styles.subtitle}>Quản lý và theo dõi tất cả người dùng trong hệ thống</p>
        </div>
        <button onClick={onCreate} className={styles.btnCreate}>
          <i className="bi bi-plus-lg"></i>
          Tạo mới
        </button>
      </div>

      {/* Stats Cards */}
      <div className={styles.statsGrid}>
        <div className={`${styles.statCard} ${styles.statCard1}`}>
          <div className={styles.statIcon}>
            <i className="bi bi-people-fill"></i>
          </div>
          <div className={styles.statContent}>
            <div className={styles.statLabel}>Tổng người dùng</div>
            <div className={styles.statValue}>{stats?.totalUsers ?? total ?? 0}</div>
            <div className={styles.statTrend}>
              <i className="bi bi-graph-up"></i>
              <span>+2.5% so với tháng trước</span>
            </div>
          </div>
          <div className={styles.statBg}>
            <i className="bi bi-people-fill"></i>
          </div>
        </div>

        <div className={`${styles.statCard} ${styles.statCard2}`}>
          <div className={styles.statIcon}>
            <i className="bi bi-person-check-fill"></i>
          </div>
          <div className={styles.statContent}>
            <div className={styles.statLabel}>Đang hoạt động</div>
            <div className={styles.statValue}>{stats?.activeUsers ?? calculatedStats.activeUsers}</div>
            <div className={styles.statTrend}>
              <i className="bi bi-graph-up"></i>
              <span>+5.2% tuần này</span>
            </div>
          </div>
          <div className={styles.statBg}>
            <i className="bi bi-person-check-fill"></i>
          </div>
        </div>

        <div className={`${styles.statCard} ${styles.statCardLocked}`}>
          <div className={styles.statIcon}>
            <i className="bi bi-lock-fill"></i>
          </div>
          <div className={styles.statContent}>
            <div className={styles.statLabel}>Đang khóa</div>
            <div className={styles.statValue}>{stats?.totalUsers ? (stats.totalUsers - (stats.activeUsers ?? 0)) : calculatedStats.lockedUsersCount}</div>
            <div className={styles.statTrend}>
            </div>
          </div>
          <div className={styles.statBg}>
            <i className="bi bi-lock-fill"></i>
          </div>
        </div>

        <div className={`${styles.statCard} ${styles.statCard4}`}>
          <div className={styles.statIcon}>
            <i className="bi bi-person-badge-fill"></i>
          </div>
          <div className={styles.statContent}>
            <div className={styles.statLabel}>Bác sĩ</div>
            <div className={styles.statValue}>{stats?.doctorCount ?? calculatedStats.doctorCount}</div>
            <div className={styles.statTrend}>
              <i className="bi bi-graph-up"></i>
              <span>+1.3% tháng này</span>
            </div>
          </div>
          <div className={styles.statBg}>
            <i className="bi bi-person-badge-fill"></i>
          </div>
        </div>
      </div>

      {/* Search and Filter */}
      <div className={styles.searchSection}>
        <div className={styles.searchWrapper}>
          <i className="bi bi-search"></i>
          <input
            type="text"
            placeholder="Tìm kiếm theo tên hoặc email..."
            value={filters.search}
            onChange={e => handleFilterChange('search', e.target.value)}
            className={styles.searchInput}
          />
          {filters.search && (
            <button 
              className={styles.clearSearch}
              onClick={() => handleFilterChange('search', '')}
            >
              <i className="bi bi-x-lg"></i>
            </button>
          )}
        </div>

        <button 
          className={`${styles.btnFilter} ${showFilters ? styles.active : ''}`}
          onClick={() => setShowFilters(!showFilters)}
        >
          <i className="bi bi-funnel"></i>
          Bộ lọc
          {(filters.roleFilter !== 'all' || filters.statusFilter !== 'all' || filters.dateFrom || filters.dateTo) && (
            <span className={styles.filterBadge}></span>
          )}
        </button>
      </div>

      {/* Advanced Filters */}
      {showFilters && (
        <div className={styles.filterPanel}>
          <div className={styles.filterGrid}>
            <div className={styles.filterItem}>
              <label>
                <i className="bi bi-person-badge"></i>
                Vai trò
              </label>
              <select value={filters.roleFilter} onChange={e => handleFilterChange('roleFilter', e.target.value)}>
                <option value="all">Tất cả</option>
                {rolesList.length === 0 && <option disabled>Đang tải...</option>}
                {rolesList.map(r => (
                  <option key={r.code} value={r.code}>{r.displayName}</option>
                ))}
              </select>
            </div>

            <div className={styles.filterItem}>
              <label>
                <i className="bi bi-toggle-on"></i>
                Trạng thái
              </label>
              <select value={filters.statusFilter} onChange={e => handleFilterChange('statusFilter', e.target.value)}>
                <option value="all">Tất cả trạng thái</option>
                <option value="unlocked">Đang hoạt động</option>
                <option value="locked">Đang khóa</option>
              </select>
            </div>

            <div className={styles.filterItem}>
              <label>
                <i className="bi bi-calendar-event"></i>
                Từ ngày
              </label>
              <input 
                type="date" 
                value={filters.dateFrom} 
                onChange={e => handleFilterChange('dateFrom', e.target.value)} 
              />
            </div>

            <div className={styles.filterItem}>
              <label>
                <i className="bi bi-calendar-check"></i>
                Đến ngày
              </label>
              <input 
                type="date" 
                value={filters.dateTo} 
                onChange={e => handleFilterChange('dateTo', e.target.value)} 
              />
            </div>
          </div>

          <div className={styles.filterActions}>
            <button onClick={handleResetFilters} className={styles.btnResetFilter}>
              <i className="bi bi-arrow-counterclockwise"></i>
              Đặt lại bộ lọc
            </button>
            <button onClick={() => setShowFilters(false)} className={styles.btnApplyFilter}>
              <i className="bi bi-check2"></i>
              Áp dụng
            </button>
          </div>
        </div>
      )}

      {/* Table */}
      <div className={styles.tableCard}>
        {loading ? (
          <div className={styles.loading}>
            <div className={styles.loadingSpinner}></div>
            <p>Đang tải dữ liệu...</p>
          </div>
        ) : processedItems.length > 0 ? (
          <div className={styles.tableWrapper}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th style={{ width: '60px' }}>STT</th>
                  <th onClick={() => handleSort('fullName')} className={styles.sortable}>
                    Họ và tên
                    {filters.sortBy === 'fullName' && (
                      <i className={`bi bi-arrow-${filters.sortDirection === 'asc' ? 'up' : 'down'}`}></i>
                    )}
                  </th>
                  <th onClick={() => handleSort('role')} className={styles.sortable}>
                    Vai trò
                    {filters.sortBy === 'role' && (
                      <i className={`bi bi-arrow-${filters.sortDirection === 'asc' ? 'up' : 'down'}`}></i>
                    )}
                  </th>
                  <th onClick={() => handleSort('email')} className={styles.sortable}>
                    Email
                    {filters.sortBy === 'email' && (
                      <i className={`bi bi-arrow-${filters.sortDirection === 'asc' ? 'up' : 'down'}`}></i>
                    )}
                  </th>
                  <th onClick={() => handleSort('createdAt')} className={styles.sortable}>
                    Ngày đăng ký
                    {filters.sortBy === 'createdAt' && (
                      <i className={`bi bi-arrow-${filters.sortDirection === 'asc' ? 'up' : 'down'}`}></i>
                    )}
                  </th>
                  <th>Trạng thái</th>
                  <th style={{ textAlign: 'right', width: '150px' }}>Thao tác</th>
                </tr>
              </thead>
              <tbody>
                {processedItems.map((u, index) => {
                  const locked = isUserLocked(u);
                  return (
                    <tr key={u.id} className={styles.tableRow}>
                      <td className={styles.indexCell}>
                        {(filters.page - 1) * filters.pageSize + index + 1}
                      </td>
                      <td>
                        <div className={styles.userCell}>
                          <img 
                            src={u.avatarUrl || `https://ui-avatars.com/api/?name=${encodeURIComponent(u.fullName || u.email)}&background=667eea&color=fff`}
                            alt={u.fullName || ''}
                            className={styles.avatar}
                          />
                          <span className={styles.userName}>{u.fullName || '-'}</span>
                        </div>
                      </td>
                      <td>
                        <span className={`${styles.roleBadge} ${styles[`role${u.role?.toUpperCase()}`]}`}>
                          {u.role || '-'}
                        </span>
                      </td>
                      <td className={styles.emailCell}>{u.email}</td>
                      <td>{u.createdAt ? new Date(u.createdAt).toLocaleDateString('vi-VN') : '-'}</td>
                      <td>
                        <span className={`${styles.statusBadge} ${locked ? styles.statusLocked : styles.statusActive}`}>
                          <i className={`bi bi-${locked ? 'lock-fill' : 'check-circle-fill'}`}></i>
                          {locked ? 'Đang khóa' : 'Hoạt động'}
                        </span>
                      </td>
                      <td>
                        <div className={styles.actions}>
                          <button onClick={() => handleViewDetails(u.id)} title="Xem chi tiết" className={styles.actionBtn}>
                            <i className="bi bi-eye"></i>
                          </button>
                          <button onClick={() => onEdit(u)} title="Sửa" className={styles.actionBtn}>
                            <i className="bi bi-pencil"></i>
                          </button>
                          <button
                            onClick={() => handleStatusChange(u, !locked)}
                            disabled={Boolean(updatingIds[u.id])}
                            title={locked ? 'Mở khóa' : 'Khóa'}
                            className={`${styles.actionBtn} ${locked ? styles.actionUnlock : styles.actionLock}`}
                          >
                            <i className={`bi bi-${locked ? 'unlock' : 'lock'}`}></i>
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <div className={styles.emptyState}>
            <i className="bi bi-inbox"></i>
            <p>Không tìm thấy người dùng nào</p>
          </div>
        )}

        {/* Pagination */}
        {processedItems.length > 0 && (
          <div className={styles.pagination}>
            <div className={styles.paginationInfo}>
              Hiển thị {(filters.page - 1) * filters.pageSize + 1} - {Math.min(filters.page * filters.pageSize, total ?? 0)} trong tổng số {total ?? 0} kết quả
            </div>

            <div className={styles.paginationControls}>
              <select value={filters.pageSize} onChange={e => setFilters(prev => ({ ...prev, pageSize: Number(e.target.value), page: 1 }))}>
                <option value={5}>5 / trang</option>
                <option value={10}>10 / trang</option>
                <option value={15}>15 / trang</option>
                <option value={20}>20 / trang</option>
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

      {/* Modals */}
      {viewing && (
        <UserDetails user={viewing} onClose={() => setViewing(null)} isLoading={loadingDetails} />
      )}

      {creating && (
        <div className={styles.modalOverlay}>
          <div className={styles.modalContent}>
            <div className={styles.modalHeader}>
              <h2>Tạo Người dùng Mới</h2>
              <button onClick={() => setCreating(false)} className={styles.closeButton}>
                <i className="bi bi-x-lg"></i>
              </button>
            </div>
            <UserForm 
              onSaved={handleCreateFormSaved}
              onCancel={() => setCreating(false)}
            />
          </div>
        </div>
      )}

      {editing && (
        <div className={styles.modalOverlay}>
          <div className={styles.modalContent}>
            <div className={styles.modalHeader}>
              <h2>Chỉnh sửa Người dùng</h2>
              <button onClick={() => setEditing(null)} className={styles.closeButton}>
                <i className="bi bi-x-lg"></i>
              </button>
            </div>
            <UserForm 
              user={editing}
              onSaved={handleEditFormSaved}
              onCancel={() => setEditing(null)}
            />
          </div>
        </div>
      )}

      <ConfirmationDialog
        isOpen={confirmationDialog.isOpen}
        title={confirmationDialog.action === 'lock' ? 'Xác nhận khóa tài khoản' : 'Xác nhận mở khóa tài khoản'}
        message={
          confirmationDialog.action === 'lock' 
            ? `Bạn có chắc muốn khóa tài khoản "${confirmationDialog.user?.fullName || confirmationDialog.user?.email}" không?`
            : `Bạn có chắc muốn mở khóa tài khoản "${confirmationDialog.user?.fullName || confirmationDialog.user?.email}" không?`
        }
        confirmText={confirmationDialog.action === 'lock' ? 'Khóa tài khoản' : 'Mở khóa tài khoản'}
        cancelText="Hủy"
        onConfirm={handleConfirmStatusChange}
        onCancel={() => setConfirmationDialog({ isOpen: false, user: null, action: null })}
        type={confirmationDialog.action === 'lock' ? 'danger' : 'warning'}
      />
    </div>
  );
}