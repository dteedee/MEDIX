import React, { useEffect, useMemo, useState } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { userAdminService } from '../../services/userService'
import { UserDTO, UpdateUserRequest } from '../../types/user.types'
import { useToast } from '../../contexts/ToastContext'
import { useAuth } from '../../contexts/AuthContext'
import UserDetails from './UserDetails'
import styles from '../../styles/admin/UserList.module.css'

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
  if (user.lockoutEnabled === true) return true;
  const lockoutEndVal = user.lockoutEnd;
  if (lockoutEndVal) {
    try {
      const lockoutEndDate = new Date(lockoutEndVal);
      return lockoutEndDate.getTime() > Date.now();
    } catch {
      return true;
    }
  }
  return false;
};

export default function UserList() {
  const [allUsers, setAllUsers] = useState<UserDTO[]>([]);
  const [total, setTotal] = useState<number | undefined>(undefined);
  const [filters, setFilters] = useState<UserListFilters>(getInitialState);
  const [loading, setLoading] = useState(true);
  const [viewing, setViewing] = useState<UserDTO | null>(null);
  const [loadingDetails, setLoadingDetails] = useState(false);
  const [updatingIds, setUpdatingIds] = useState<Record<string, boolean>>({});
  const [showFilters, setShowFilters] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(true);

  const { showToast } = useToast();
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const load = async () => {
    const r = await userAdminService.list(1, 10000);
    setAllUsers(r.items || []);
    setTotal(r.total);
    setLoading(false);
  }

  useEffect(() => {
    try {
      localStorage.setItem('userListState', JSON.stringify(filters));
    } catch (e) {
      console.error("Failed to save userListState to localStorage", e);
    }
    load();
  }, [location.pathname]);

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

  const handleStatusChange = async (userToUpdate: UserDTO, isBeingLocked: boolean) => {
    const currentUser = allUsers.find(u => u.id === userToUpdate.id) ?? userToUpdate;

    if (isUserLocked(currentUser) === isBeingLocked) {
      return;
    }

    const actionText = isBeingLocked ? 'khóa' : 'mở khóa';
    if (!confirm(`Bạn có chắc muốn ${actionText} tài khoản "${currentUser.fullName}" không?`)) {
      return;
    }

    setUpdatingIds(prev => ({ ...prev, [userToUpdate.id]: true }));

    try {
      const payload: UpdateUserRequest = {
        role: currentUser.role,
        lockoutEnabled: isBeingLocked,
      };
      await userAdminService.update(userToUpdate.id, payload);
      showToast(`Đã ${actionText} tài khoản thành công.`);
      await load(); 
    } catch (error) {
      showToast('Không thể cập nhật trạng thái tài khoản.', 'error');
    } finally {
      setUpdatingIds(prev => ({ ...prev, [userToUpdate.id]: false }));
    }
  };

  const handleSort = (column: string) => {
    if (filters.sortBy === column) {
      handleFilterChange('sortDirection', filters.sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setFilters(prev => ({ ...prev, sortBy: column, sortDirection: 'desc' as const }));
    }
  };

  const onCreate = () => navigate('/app/admin/users/new');
  const onEdit = (u: UserDTO) => navigate(`/app/admin/users/edit/${u.id}`);

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

  const processedItems = useMemo(() => {
    const from = filters.dateFrom ? new Date(filters.dateFrom) : undefined;
    const to = filters.dateTo ? (() => {
      const date = new Date(filters.dateTo);
      date.setHours(23, 59, 59, 999);
      return date;
    })() : undefined;

    const filtered = allUsers.filter(u => {
      const searchTerm = filters.search.toLowerCase();
      const okSearch = !searchTerm ||
        (u.fullName && u.fullName.toLowerCase().includes(searchTerm)) ||
        (u.email && u.email.toLowerCase().includes(searchTerm));

      const okRole = filters.roleFilter === 'all' || (u.role?.toLowerCase() === filters.roleFilter.toLowerCase());
      
      const isLocked = isUserLocked(u);
      const okStatus = filters.statusFilter === 'all' || (filters.statusFilter === 'locked' ? isLocked : !isLocked);

      let okDate = true;
      if (from || to) {
        const created = u.createdAt ? new Date(u.createdAt) : undefined;
        okDate = !!created && (!from || created >= from) && (!to || created <= to);
      }

      return okSearch && okRole && okStatus && okDate;
    });

    const sorted = [...filtered].sort((a, b) => {
      let valA: any, valB: any;
      
      if (filters.sortBy === 'createdAt') {
        valA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
        valB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
      } else if (filters.sortBy === 'fullName') {
        valA = (a.fullName || '').toLowerCase();
        valB = (b.fullName || '').toLowerCase();
      } else if (filters.sortBy === 'email') {
        valA = (a.email || '').toLowerCase();
        valB = (b.email || '').toLowerCase();
      } else if (filters.sortBy === 'role') {
        valA = (a.role || '').toLowerCase();
        valB = (b.role || '').toLowerCase();
      }

      if (valA < valB) return filters.sortDirection === 'asc' ? -1 : 1;
      if (valA > valB) return filters.sortDirection === 'asc' ? 1 : -1;
      return 0;
    });

    const startIndex = (filters.page - 1) * filters.pageSize;
    const endIndex = startIndex + filters.pageSize;
    
    return sorted.slice(startIndex, endIndex);
  }, [allUsers, filters]);

  const handleResetFilters = () => {
    setFilters({
      ...filters,
      roleFilter: 'all',
      statusFilter: 'all',
      dateFrom: '',
      dateTo: '',
    });
  };

  // Calculate new users (last 7 days)
  const newUsersCount = useMemo(() => {
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    return allUsers.filter(u => u.createdAt && new Date(u.createdAt) >= sevenDaysAgo).length;
  }, [allUsers]);

  // Calculate growth percentage
  const growthPercentage = useMemo(() => {
    const fourteenDaysAgo = new Date();
    fourteenDaysAgo.setDate(fourteenDaysAgo.getDate() - 14);
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    
    const previousWeek = allUsers.filter(u => 
      u.createdAt && 
      new Date(u.createdAt) >= fourteenDaysAgo && 
      new Date(u.createdAt) < sevenDaysAgo
    ).length;
    
    if (previousWeek === 0) return newUsersCount > 0 ? 100 : 0;
    return Math.round(((newUsersCount - previousWeek) / previousWeek) * 100);
  }, [allUsers, newUsersCount]);

  const totalPages = Math.ceil((total ?? 0) / filters.pageSize);

  return (
    <div className={styles.wrapper}>
      {/* Sidebar */}
      <div className={`${styles.sidebar} ${!sidebarOpen ? styles.sidebarClosed : ''}`}>
        <div className={styles.sidebarHeader}>
          <div className={styles.logo}>
            <img src="/images/medix-logo.png" alt="MEDIX" />
            {sidebarOpen && <span>MEDIX Admin</span>}
          </div>
        </div>

         <nav className={styles.sidebarNav}>
           <a href="/app/admin" className={styles.navItem}>
             <i className="bi bi-speedometer2"></i>
             {sidebarOpen && <span>Dashboard</span>}
           </a>
           <a href="/app/admin/users" className={`${styles.navItem} ${styles.active}`}>
             <i className="bi bi-people"></i>
             {sidebarOpen && <span>Người dùng</span>}
           </a>
           <a href="/app/admin/tracking" className={styles.navItem}>
             <i className="bi bi-search"></i>
             {sidebarOpen && <span>Truy vết</span>}
           </a>
           <a href="/app/admin/settings" className={styles.navItem}>
             <i className="bi bi-gear"></i>
             {sidebarOpen && <span>Cấu hình</span>}
           </a>
         </nav>

         {/* User Section */}
         <div className={styles.userSection}>
           <div className={styles.userInfo}>
             <div className={styles.userAvatar}>
               <img 
                 src={user?.avatarUrl || `https://ui-avatars.com/api/?name=${encodeURIComponent(user?.fullName || user?.email || 'Admin')}&background=667eea&color=fff`}
                 alt={user?.fullName || 'Admin'}
               />
             </div>
             {sidebarOpen && (
               <div className={styles.userDetails}>
                 <div className={styles.userName}>{user?.fullName || 'Admin'}</div>
                 <div className={styles.userRole}>Quản trị viên</div>
               </div>
             )}
           </div>
           <button 
             className={styles.logoutBtn}
             onClick={() => {
               logout();
               navigate('/login');
             }}
             title="Đăng xuất"
           >
             <i className="bi bi-box-arrow-right"></i>
             {sidebarOpen && <span>Đăng xuất</span>}
           </button>
         </div>

        <button 
          className={styles.sidebarToggle}
          onClick={() => setSidebarOpen(!sidebarOpen)}
        >
          <i className={`bi bi-chevron-${sidebarOpen ? 'left' : 'right'}`}></i>
        </button>
      </div>

      {/* Main Content */}
      <div className={styles.mainContent}>
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
                <div className={styles.statValue}>{total ?? 0}</div>
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
                <div className={styles.statValue}>
                  {allUsers.filter(u => !isUserLocked(u)).length}
                </div>
                <div className={styles.statTrend}>
                  <i className="bi bi-graph-up"></i>
                  <span>+5.2% tuần này</span>
                </div>
              </div>
              <div className={styles.statBg}>
                <i className="bi bi-person-check-fill"></i>
              </div>
            </div>

            <div className={`${styles.statCard} ${styles.statCard3}`}>
              <div className={styles.statIcon}>
                <i className="bi bi-person-plus-fill"></i>
              </div>
              <div className={styles.statContent}>
                <div className={styles.statLabel}>Người dùng mới</div>
                <div className={styles.statValue}>{newUsersCount}</div>
                <div className={`${styles.statTrend} ${growthPercentage < 0 ? styles.negative : ''}`}>
                  <i className={`bi bi-${growthPercentage >= 0 ? 'graph-up' : 'graph-down'}`}></i>
                  <span>{growthPercentage >= 0 ? '+' : ''}{growthPercentage}% so với tuần trước</span>
                </div>
              </div>
              <div className={styles.statBg}>
                <i className="bi bi-person-plus-fill"></i>
              </div>
            </div>

            <div className={`${styles.statCard} ${styles.statCard4}`}>
              <div className={styles.statIcon}>
                <i className="bi bi-person-badge-fill"></i>
              </div>
              <div className={styles.statContent}>
                <div className={styles.statLabel}>Bác sĩ</div>
                <div className={styles.statValue}>
                  {allUsers.filter(u => u.role === 'DOCTOR').length}
                </div>
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
                    <option value="all">Tất cả vai trò</option>
                    <option value="ADMIN">Quản trị viên</option>
                    <option value="MANAGER">Quản lý</option>
                    <option value="DOCTOR">Bác sĩ</option>
                    <option value="PATIENT">Bệnh nhân</option>
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
                            <span className={`${styles.roleBadge} ${styles[`role${u.role}`]}`}>
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
        </div>
      </div>

      {viewing && (
        <UserDetails user={viewing} onClose={() => setViewing(null)} isLoading={loadingDetails} />
      )}
    </div>
  );
}