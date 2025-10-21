import React, { useEffect, useMemo, useState, useRef } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { userAdminService } from '../../services/userService'
import { UserDTO, UpdateUserRequest } from '../../types/user.types'
import { useToast } from '../../contexts/ToastContext'
import UserDetails from '../../components/admin/UserDetails'

// SVG Icons for actions
const ViewIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ color: '#4b5563' }}>
    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
    <circle cx="12" cy="12" r="3" />
  </svg>
);

const EditIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ color: '#4b5563' }}>
    <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
    <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
  </svg>
);

const SortIcon = ({ direction }: { direction?: 'asc' | 'desc' }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ display: 'inline-block', marginLeft: 4, color: direction ? '#111827' : '#9ca3af' }}>
    {/* Up-arrow for 'asc' */}
    {direction === 'asc' && <path d="M18 15l-6-6-6 6" />}
    {/* Down-arrow for 'desc' */}
    {direction === 'desc' && <path d="M6 9l6 6 6-6" />}
  </svg>
);
const LockIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ color: '#ef4444' }}>
    <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
    <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
  </svg>
);

const UnlockIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ color: '#22c55e' }}>
    <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
    <path d="M7 11V7a5 5 0 0 1 9.9-1"></path>
  </svg>
);

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
  // Default state if nothing is saved or parsing fails
  return {
    page: 1,
    pageSize: 5,
    search: '',
    roleFilter: 'all' as const,
    statusFilter: 'all',
    dateFrom: '',
    dateTo: '',
    sortBy: 'createdAt',
    sortDirection: 'desc' as const,
  };
};

/**
 * Determines if a user is locked based on lockoutEnabled or a future lockoutEnd date.
 * This logic is centralized to be used by both filtering and UI rendering.
 */
const isUserLocked = (user?: UserDTO): boolean => {
  if (!user) return false;

  // Nếu lockoutEnabled = true → đang khóa
  if (user.lockoutEnabled === true) return true;

  // Nếu lockoutEnd còn hiệu lực → khóa tạm thời
  const lockoutEndVal = user.lockoutEnd;
  if (lockoutEndVal) {
    try {
      const lockoutEndDate = new Date(lockoutEndVal);
      // Chỉ so sánh nếu ngày hợp lệ. `getTime()` sẽ là NaN nếu ngày không hợp lệ.
      return lockoutEndDate.getTime() > Date.now();
    } catch {
      // Nếu có lỗi khi phân tích ngày, nhưng giá trị tồn tại, an toàn nhất là coi như đang bị khóa.
      return true;
    }
  }

  return false;
};

const pill = (user: UserDTO) => {
  const isLocked = isUserLocked(user);
  const text = isLocked ? 'Đang khóa' : 'Hoạt động';
  const bg = isLocked ? '#fee2e2' : '#e7f9ec';
  const color = isLocked ? '#dc2626' : '#16a34a';

  return (
    <span
      style={{
        background: bg,
        color,
        padding: '6px 10px',
        borderRadius: 16,
        fontSize: 12,
      }}
    >
      {text}
    </span>
  );
};


export default function UserList() {
  const [allUsers, setAllUsers] = useState<UserDTO[]>([]); // Stores all users from server
  const [total, setTotal] = useState<number | undefined>(undefined)
  const [filters, setFilters] = useState<UserListFilters>(getInitialState);
  const [loading, setLoading] = useState(true)
  const [viewing, setViewing] = useState<UserDTO | null>(null)
  const [loadingDetails, setLoadingDetails] = useState(false)
  const [updatingIds, setUpdatingIds] = useState<Record<string, boolean>>({})

  const { showToast } = useToast()
  const navigate = useNavigate()
  const load = async () => {
    // Fetch a large list of users for client-side filtering.
    // We ignore local filters for the API call, except for maybe a base search if desired.
    const r = await userAdminService.list(1, 10000); // Fetch up to 10000 users
    console.debug('[UserList] loaded users', r.items)
    setAllUsers(r.items || [])
    setTotal(r.total)
    setLoading(false)
  }

  const location = useLocation()

  // Load data once on component mount or when returning to the page.
  useEffect(() => {
    // Save state to localStorage whenever filters change
    try {
      localStorage.setItem('userListState', JSON.stringify(filters));
    } catch (e) {
      console.error("Failed to save userListState to localStorage", e);
    }
    load()
  }, [location.pathname])

  // Persist filters to localStorage whenever they change
  useEffect(() => {
    localStorage.setItem('userListState', JSON.stringify(filters));
  }, [filters]);
  
  // Scroll to top on page or page size change
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [filters.page, filters.pageSize]);

  const handleFilterChange = (key: keyof UserListFilters, value: any) => {
    setFilters(prev => {
      const newState = { ...prev, [key]: value };
      // Reset page to 1 if any filter changes, except for pagination itself
      if (key !== 'page') newState.page = 1;
      return newState;
    });
  };

  const handleStatusChange = async (userToUpdate: UserDTO, isBeingLocked: boolean) => {
    // Lấy user mới nhất trong state (nếu có), fallback userToUpdate
    const currentUser = allUsers.find(u => u.id === userToUpdate.id) ?? userToUpdate;

    // Nếu không có thay đổi thì bỏ qua
    if (isUserLocked(currentUser) === isBeingLocked) {
      return;
    }

    const actionText = isBeingLocked ? 'khóa' : 'mở khóa';
    if (!confirm(`Bạn có chắc muốn ${actionText} tài khoản "${currentUser.fullName}" không?`)) {
      return;
    }

    setUpdatingIds(prev => ({ ...prev, [userToUpdate.id]: true }));

    try {
      // Gửi một payload đơn giản chỉ chứa các trường cần thiết để thay đổi trạng thái.
      // Giữ nguyên vai trò hiện tại của người dùng.
      const payload: UpdateUserRequest = {
        role: currentUser.role,
        lockoutEnabled: isBeingLocked,
      };
      await userAdminService.update(userToUpdate.id, payload);
      showToast(`Đã ${actionText} tài khoản thành công.`);
      // Tải lại toàn bộ danh sách để đảm bảo dữ liệu (bao gồm cả trạng thái) là mới nhất.
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


  const onCreate = () => navigate('/app/admin/users/new')
  const onEdit = (u: UserDTO) => navigate(`/app/admin/users/edit/${u.id}`)

  const handleViewDetails = async (userId: string) => {
    setLoadingDetails(true);
    setViewing({ id: userId } as UserDTO); // Đặt tạm để modal mở ra
    try {
      const fullUser = await userAdminService.get(userId);
      setViewing(fullUser);
    } catch (error) {
      console.error("Failed to load user details:", error);
      showToast('Không thể tải chi tiết người dùng', 'error');
      setViewing(null); // Đóng modal nếu có lỗi
    } finally {
      setLoadingDetails(false);
    }
  }

  const processedItems = useMemo(() => {
    const from = filters.dateFrom ? new Date(filters.dateFrom) : undefined
    const to = filters.dateTo ? (() => {
      const date = new Date(filters.dateTo);
      date.setHours(23, 59, 59, 999); // Set to the end of the day
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
      if (filters.sortBy === 'createdAt') {
        const valA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
        const valB = b.createdAt ? new Date(b.createdAt).getTime() : 0;

        if (valA < valB) return filters.sortDirection === 'asc' ? -1 : 1;
        if (valA > valB) return filters.sortDirection === 'asc' ? 1 : -1;
      }
      // Add other sortable columns here if needed
      return 0;
    });

    // Apply pagination
    const startIndex = (filters.page - 1) * filters.pageSize;
    const endIndex = startIndex + filters.pageSize;
    
    return sorted.slice(startIndex, endIndex);
  }, [allUsers, filters]);

  const handleResetFilters = () => {
    localStorage.removeItem('userListState');
    // We can either reload the page or reset state manually
    // Reloading is simpler and ensures a clean slate
    window.location.reload();
    // Or manual reset: setFilters(getInitialState());
  };


    return (
    <div style={{ padding: 24, backgroundColor: '#f9fafb', minHeight: '100vh' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <h1 style={{ margin: 0, fontSize: '1.875rem', fontWeight: 'bold', color: '#111827' }}>Quản lý Người dùng</h1>
        <button 
          onClick={onCreate} 
          style={{ 
            padding: '10px 20px', 
            background: '#2563eb', 
            color: '#fff', 
            borderRadius: 8, 
            border: 'none', 
            fontWeight: 600,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: 8
          }}
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>
          Tạo mới
        </button>
      </div>

      {/* Filter Section */}
      <div style={{ marginBottom: 24, background: '#fff', border: '1px solid #e5e7eb', borderRadius: 12, padding: 20 }}>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 16, alignItems: 'end' }}>
          <div style={{ flex: '2 1 200px' }}>
            <label style={{ fontSize: 14, color: '#4b5563', marginBottom: 6, display: 'block' }}>Tìm kiếm</label>
            <input
              placeholder="Tìm kiếm theo tên..."
              value={filters.search}
              onChange={e => handleFilterChange('search', e.target.value)}
              style={{ width: '80%', padding: '10px 12px', border: '1px solid #d1d5db', borderRadius: 8, fontSize: 14 }}
            />
          </div>
          <div style={{ flex: '1 1 150px' }}>
            <label style={{ fontSize: 14, color: '#4b5563', marginBottom: 6, display: 'block' }}>Vai trò</label>
            <select value={filters.roleFilter} onChange={e => handleFilterChange('roleFilter', e.target.value)} style={{ padding: 10, width: '100%', border: '1px solid #d1d5db', borderRadius: 8, fontSize: 14 }}>
              <option value="all">Tất cả</option>
              <option value="ADMIN">Quản trị</option>
              <option value="MANAGER">Quản lý</option>
              <option value="DOCTOR">Bác sĩ</option>
              <option value="PATIENT">Bệnh nhân</option>
            </select>
          </div>
          <div style={{ flex: '1 1 150px' }}>
            <label style={{ fontSize: 14, color: '#4b5563', marginBottom: 6, display: 'block' }}>Trạng thái</label>
            <select value={filters.statusFilter} onChange={e => handleFilterChange('statusFilter', e.target.value)} style={{ padding: 10, width: '100%', border: '1px solid #d1d5db', borderRadius: 8, fontSize: 14 }}>
              <option value="all">Tất cả</option>
              <option value="unlocked">Hoạt động</option>
              <option value="locked">Đang khóa</option>
            </select>
          </div>
          <div style={{ flex: '1 1 150px' }}>
            <label style={{ fontSize: 14, color: '#4b5563', marginBottom: 6, display: 'block' }}>Từ ngày</label>
            <input type="date" value={filters.dateFrom} onChange={e => handleFilterChange('dateFrom', e.target.value)} style={{ padding: 9, width: '80%', border: '1px solid #d1d5db', borderRadius: 8, fontSize: 14 }} />
          </div>
          <div style={{ flex: '1 1 150px' }}>
            <label style={{ fontSize: 14, color: '#4b5563', marginBottom: 6, display: 'block' }}>Đến ngày</label>
            <input type="date" value={filters.dateTo} onChange={e => handleFilterChange('dateTo', e.target.value)} style={{ padding: 9, width: '80%', border: '1px solid #d1d5db', borderRadius: 8, fontSize: 14 }} />
          </div>
          <div style={{ flex: '0 0 auto' }}>
            <button 
              onClick={handleResetFilters}
              style={{
                padding: '10px 16px',
                background: '#f3f4f6',
                color: '#4b5563',
                border: '1px solid #d1d5db',
                borderRadius: 8,
                fontWeight: 500,
                cursor: 'pointer'
              }}
            >
              Xóa bộ lọc
            </button>
          </div>
        </div>
      </div>

      {/* Table */}
      <div style={{ background: '#fff', borderRadius: 12, border: '1px solid #e5e7eb', overflowX: 'auto' }}>
        {processedItems.length > 0 ? (
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead style={{ backgroundColor: '#f9fafb' }}>
              <tr>
                <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: 13, color: '#6b7280', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', width: '50px' }}>STT</th>
                <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: 13, color: '#6b7280', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Họ và tên</th>
                <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: 13, color: '#6b7280', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Vai trò</th>
                <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: 13, color: '#6b7280', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Email</th>
                <th onClick={() => handleSort('createdAt')} style={{ padding: '12px 16px', textAlign: 'left', fontSize: 13, color: '#6b7280', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', cursor: 'pointer' }}>Ngày đăng kí <SortIcon direction={filters.sortBy === 'createdAt' ? filters.sortDirection : undefined} /></th>
                <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: 13, color: '#6b7280', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Trạng thái</th>
                <th style={{ padding: '12px 16px', textAlign: 'right', fontSize: 13, color: '#6b7280', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {processedItems.map((u, index) => (
                <tr key={u.id} style={{ borderTop: '1px solid #e5e7eb' }}>
                  <td style={{ padding: '12px 16px', color: '#4b5563', fontSize: 14, textAlign: 'center' }}>
                    {(filters.page - 1) * filters.pageSize + index + 1}
                  </td>
                  <td style={{ padding: '16px', color: '#111827', fontWeight: 500, fontSize: 14 }}>{u.fullName ?? '-'}</td>
                  <td style={{ padding: '16px', color: '#4b5563', fontSize: 14 }}>{u.role ?? '-'}</td>
                  <td style={{ padding: '16px', color: '#4b5563', fontSize: 14 }}>{u.email}</td>
                  <td style={{ padding: '16px', color: '#4b5563', fontSize: 14 }}>{u.createdAt ? new Date(u.createdAt).toLocaleDateString() : '-'}</td>
                  <td style={{ padding: '16px' }}>{pill(u)}</td>
                  <td style={{ padding: '16px', display: 'flex', gap: 16, justifyContent: 'flex-end', alignItems: 'center' }}>
                    <button onClick={() => handleViewDetails(u.id)} title="Xem chi tiết" style={{ background: 'transparent', border: 'none', cursor: 'pointer', padding: 0 }}><ViewIcon /></button>
                    <button onClick={() => onEdit(u)} title="Sửa vai trò" style={{ background: 'transparent', border: 'none', cursor: 'pointer', padding: 0 }}><EditIcon /></button>
                    <button
                      onClick={() => handleStatusChange(u, !isUserLocked(u))}
                      disabled={Boolean(updatingIds[u.id])}
                      title={isUserLocked(u) ? 'Mở khóa tài khoản' : 'Khóa tài khoản'}
                      style={{ background: 'transparent', border: 'none', cursor: 'pointer', padding: 0, opacity: updatingIds[u.id] ? 0.6 : 1 }}
                    >
                      {isUserLocked(u) ? <UnlockIcon /> : <LockIcon />}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : !loading ? (
          <div style={{ padding: '48px 16px', textAlign: 'center', color: '#6b7280', fontSize: 14 }}>
            Không tìm thấy kết quả
          </div>
        ) : (
          <div style={{ padding: '48px 16px', textAlign: 'center', color: '#6b7280', fontSize: 14 }}>
            Đang tải dữ liệu...
          </div>
        ) }
      </div>

      {/* Pagination */}
      <div style={{ marginTop: 24, display: 'flex', justifyContent: 'space-between', alignItems: 'center', color: '#4b5563', fontSize: 14 }}>
        <div>
          Hiển thị {processedItems.length} trên tổng số {total ?? 0} kết quả
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <label htmlFor="pageSize" style={{ fontSize: 14 }}>Số mục:</label>
            <select id="pageSize" value={filters.pageSize} onChange={e => setFilters(prev => ({ ...prev, pageSize: Number(e.target.value), page: 1 }))} style={{ padding: '6px 10px', borderRadius: 8, border: '1px solid #d1d5db' }}>
              <option value={5}>5</option>
              <option value={10}>10</option>
              <option value={15}>15</option>
            </select>
          </div>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button onClick={() => handleFilterChange('page', Math.max(1, filters.page - 1))} disabled={filters.page <= 1} style={{ padding: '8px 16px', borderRadius: 8, border: '1px solid #d1d5db', background: '#fff', cursor: 'pointer', opacity: filters.page <= 1 ? 0.6 : 1 }}>
            Trang trước
          </button>
          <button onClick={() => handleFilterChange('page', filters.page + 1)} disabled={processedItems.length < filters.pageSize} style={{ padding: '8px 16px', borderRadius: 8, border: '1px solid #d1d5db', background: '#fff', cursor: 'pointer', opacity: processedItems.length < filters.pageSize ? 0.6 : 1 }}>
            Trang sau
          </button>
        </div>
      </div>

      {viewing && (
        <UserDetails user={viewing} onClose={() => setViewing(null)} isLoading={loadingDetails} />
      )}
    </div>
  )
}
