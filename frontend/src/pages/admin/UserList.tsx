import React, { useEffect, useMemo, useState, useRef } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { userService } from '../../services/userService'
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
export default function UserList() {
  const [users, setUsers] = useState<UserDTO[]>([])
  const [total, setTotal] = useState<number | undefined>(undefined)
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(5)
  const [search, setSearch] = useState('')
  const [roleFilter, setRoleFilter] = useState<'all' | 'Admin' | 'Doctor' | 'Patient'>('all')
  const [statusFilter, setStatusFilter] = useState<'all' | 'locked' | 'unlocked'>('all')
  const [dateFrom, setDateFrom] = useState<string>('')
  const [dateTo, setDateTo] = useState<string>('')
  const [loading, setLoading] = useState(true)
  const [viewing, setViewing] = useState<UserDTO | null>(null)
  const [loadingDetails, setLoadingDetails] = useState(false)
  const [updatingIds, setUpdatingIds] = useState<Record<string, boolean>>({})
  const updatingRef = useRef<Record<string, boolean>>({})
  const debounceRef = useRef<Record<string, any>>({})
  const lastToastRef = useRef<Record<string, number>>({})
  // sorting
  const [sortBy, setSortBy] = useState('createdAt')
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc')
  const searchRef = useRef<number | undefined>(undefined)

  const { showToast } = useToast()
  const navigate = useNavigate()
  const load = async () => {
    const r = await userService.list(page, pageSize, search)
    console.debug('[UserList] loaded users', r.items)
    // Normalize lock state to ensure UI reflects DB regardless of backend field names/formats
    const normalized = (r.items || []).map(u => {
      const any = u as any
      let locked = false
      if (u.lockoutEnabled === true) locked = true
      if (any.isLocked === true) locked = true
      if (any.locked === true) locked = true
      if (any.isLockedOut === true) locked = true
      const lockoutEndVal = any.lockoutEnd ?? any.lockout_end ?? any.lockEnd ?? any.lockedUntil
      if (lockoutEndVal) {
        try {
          const ts = Date.parse(lockoutEndVal as any)
          if (!isNaN(ts) && ts > Date.now()) locked = true
          else if (isNaN(ts)) locked = true // treat truthy unparsable as locked
        } catch {
          locked = true
        }
      }
      return { ...u, lockoutEnabled: locked }
    })
    console.debug('[UserList] normalized users', normalized)
    setUsers(normalized)
    setTotal(r.total)
    setLoading(false)
  }

  const location = useLocation()

  // Load when page/pageSize changes and also when the route changes (so returning from edit reloads)
  useEffect(() => {
    load()
  }, [page, pageSize, location.pathname])

  // Scroll to top on page or page size change
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [page, pageSize]);

  const handleStatusChange = (userToUpdate: UserDTO, newStatus: boolean) => {
    // debounce rapid toggles per user (300ms)
    if (debounceRef.current[userToUpdate.id]) {
      clearTimeout(debounceRef.current[userToUpdate.id])
    }

    debounceRef.current[userToUpdate.id] = setTimeout(async () => {
      // Guard: ignore if same status or already updating for this user
      const currentUser = (users.find(u => u.id === userToUpdate.id) as any) ?? userToUpdate
      if (currentUser.lockoutEnabled === newStatus) return
      if (updatingRef.current[userToUpdate.id]) {
        console.debug('[UserList] update already in-flight for', userToUpdate.id)
        return
      }

      // Mark in-flight synchronously via ref then update UI state
      updatingRef.current[userToUpdate.id] = true
      setUpdatingIds(prev => ({ ...prev, [userToUpdate.id]: true }))

      // Optimistic UI: cập nhật ngay trong state
      setUsers(prev => prev.map(u => u.id === userToUpdate.id ? { ...u, lockoutEnabled: newStatus } : u))

      try {
        const payload: Partial<UpdateUserRequest> = { lockoutEnabled: newStatus }
        if (!newStatus) payload.lockoutEnd = null
        console.debug('[UserList] update payload', userToUpdate.id, payload)
        const resp = await userService.update(userToUpdate.id, payload)
        console.debug('[UserList] update response', resp)
        // reload list from server to get canonical DB state (handles backend using different fields/formats)
        try {
          await load()
        } catch (err) {
          console.debug('[UserList] reload after update failed', err)
        }
        // avoid duplicate toasts for the same user in short time
        const now = Date.now()
        const last = lastToastRef.current[userToUpdate.id] || 0
        if (now - last > 2000) {
          lastToastRef.current[userToUpdate.id] = now
          showToast(newStatus ? 'Tài khoản đã bị khóa.' : 'Tài khoản đã được mở khóa.')
        } else {
          console.debug('[UserList] skipped duplicate toast for', userToUpdate.id)
        }
      } catch (error) {
        // revert optimistic update
        setUsers(prev => prev.map(u => u.id === userToUpdate.id ? { ...u, lockoutEnabled: userToUpdate.lockoutEnabled } : u))
        showToast('Không thể cập nhật trạng thái tài khoản.', 'error')
      } finally {
        // clear ref and state
        updatingRef.current[userToUpdate.id] = false
        setUpdatingIds(prev => {
          const copy = { ...prev }
          delete copy[userToUpdate.id]
          return copy
        })
        // clear debounce timer
        if (debounceRef.current[userToUpdate.id]) {
          clearTimeout(debounceRef.current[userToUpdate.id])
          delete debounceRef.current[userToUpdate.id]
        }
      }
    }, 300)
  }

  const handleSort = (column: string) => {
    if (sortBy === column) {
      setSortDirection(prev => prev === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(column);
      setSortDirection('desc'); // Default to descending
    }
  }

  const onCreate = () => navigate('/admin/users/new')
  const onEdit = (u: UserDTO) => navigate(`/admin/users/edit/${u.id}`)

  const handleViewDetails = async (userId: string) => {
    setLoadingDetails(true);
    setViewing({ id: userId } as UserDTO); // Đặt tạm để modal mở ra
    try {
      const fullUser = await userService.get(userId);
      setViewing(fullUser);
    } catch (error) {
      console.error("Failed to load user details:", error);
      showToast('Không thể tải chi tiết người dùng', 'error');
      setViewing(null); // Đóng modal nếu có lỗi
    } finally {
      setLoadingDetails(false);
    }
  }

  const isLockedFor = (u?: UserDTO) => {
    if (!u) return false
    const any = u as any
    // Common explicit boolean field from identity frameworks
    if (u.lockoutEnabled === true) return true
    if (any.isLocked === true) return true
    if (any.locked === true) return true
    if (any.isLockedOut === true) return true

    // Common variants for lockoutEnd from backend
    const lockoutEndVal = any.lockoutEnd ?? any.lockout_end ?? any.lockEnd ?? any.lockedUntil
    if (lockoutEndVal) {
      try {
        const ts = Date.parse(lockoutEndVal as any)
        if (!isNaN(ts)) return ts > Date.now()
        // If parsing failed but value is truthy, treat as locked
        return true
      } catch {
        return true
      }
    }
    return false
  }

  const processedItems = useMemo(() => {
    const from = dateFrom ? new Date(dateFrom) : undefined
    const to = dateTo ? new Date(dateTo) : undefined
    
    // Bắt đầu với toàn bộ danh sách người dùng
    let filteredUsers = [...users];

    // Lọc theo từ khóa tìm kiếm (tên hoặc email)
    if (search.trim()) {
      const searchTerm = search.toLowerCase();
      filteredUsers = filteredUsers.filter(u =>
        (u.fullName && u.fullName.toLowerCase().includes(searchTerm)) ||
        (u.email && u.email.toLowerCase().includes(searchTerm))
      );
    }

    // Áp dụng các bộ lọc khác
    return filteredUsers.filter(u => {
      const okRole = roleFilter === 'all' || (u.role?.toLowerCase() === roleFilter.toLowerCase())
      // Lọc trạng thái theo giá trị đã được chuẩn hóa `lockoutEnabled`
      const isLocked = Boolean((u as any).lockoutEnabled)
      const okStatus = statusFilter === 'all' || (statusFilter === 'locked' ? isLocked : !isLocked);

      let okDate = true
      if (from || to) {
        const created = u.createdAt ? new Date(u.createdAt) : undefined
        okDate = !!created && (!from || created >= from) && (!to || created <= to)
      }
      return okRole && okStatus && okDate
    })
    .sort((a, b) => {
      if (sortBy === 'createdAt') {
        const valA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
        const valB = b.createdAt ? new Date(b.createdAt).getTime() : 0;

        if (valA < valB) return sortDirection === 'asc' ? -1 : 1;
        if (valA > valB) return sortDirection === 'asc' ? 1 : -1;
      }
      // Add other sortable columns here if needed
      return 0;
    });
  }, [users, search, roleFilter, statusFilter, dateFrom, dateTo, sortBy, sortDirection]);

  const pill = (lockoutEnabled?: boolean) => {
    const isLocked = Boolean(lockoutEnabled)
    const text = isLocked ? 'Đang khóa' : 'Hoạt động'
    const bg = isLocked ? '#fee2e2' : '#e7f9ec'
    const color = isLocked ? '#dc2626' : '#16a34a'
    return <span style={{ background: bg, color, padding: '6px 10px', borderRadius: 16, fontSize: 12 }}>{text}</span>
  }

  const getStatusStyle = (isLocked?: boolean): React.CSSProperties => {
    const locked = Boolean(isLocked)
    return {
      padding: '6px 12px',
      borderRadius: 16,
      border: '1px solid',
      borderColor: locked ? '#fca5a5' : '#6ee7b7',
      background: locked ? '#fee2e2' : '#e7f9ec',
      color: locked ? '#991b1b' : '#065f46',
      fontWeight: 600,
      cursor: 'pointer',
      fontSize: 13,
      appearance: 'none',
    }
  }

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
              value={search}
              onChange={e => setSearch(e.target.value)}
              style={{ width: '80%', padding: '10px 12px', border: '1px solid #d1d5db', borderRadius: 8, fontSize: 14 }}
            />
          </div>
          <div style={{ flex: '1 1 150px' }}>
            <label style={{ fontSize: 14, color: '#4b5563', marginBottom: 6, display: 'block' }}>Vai trò</label>
            <select value={roleFilter} onChange={e => setRoleFilter(e.target.value as any)} style={{ padding: 10, width: '100%', border: '1px solid #d1d5db', borderRadius: 8, fontSize: 14 }}>
              <option value="all">Tất cả</option>
              <option value="ADMIN">Quản trị</option>
              <option value="MANAGER">Quản lý</option>
              <option value="DOCTOR">Bác sĩ</option>
              <option value="PATIENT">Bệnh nhân</option>
            </select>
          </div>
          <div style={{ flex: '1 1 150px' }}>
            <label style={{ fontSize: 14, color: '#4b5563', marginBottom: 6, display: 'block' }}>Trạng thái</label>
            <select value={statusFilter} onChange={e => setStatusFilter(e.target.value as any)} style={{ padding: 10, width: '100%', border: '1px solid #d1d5db', borderRadius: 8, fontSize: 14 }}>
              <option value="all">Tất cả</option>
              <option value="unlocked">Hoạt động</option>
              <option value="locked">Đang khóa</option>
            </select>
          </div>
          <div style={{ flex: '1 1 150px' }}>
            <label style={{ fontSize: 14, color: '#4b5563', marginBottom: 6, display: 'block' }}>Từ ngày</label>
            <input type="date" value={dateFrom} onChange={e => setDateFrom(e.target.value)} style={{ padding: 9, width: '80%', border: '1px solid #d1d5db', borderRadius: 8, fontSize: 14 }} />
          </div>
          <div style={{ flex: '1 1 150px' }}>
            <label style={{ fontSize: 14, color: '#4b5563', marginBottom: 6, display: 'block' }}>Đến ngày</label>
            <input type="date" value={dateTo} onChange={e => setDateTo(e.target.value)} style={{ padding: 9, width: '80%', border: '1px solid #d1d5db', borderRadius: 8, fontSize: 14 }} />
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
                <th onClick={() => handleSort('createdAt')} style={{ padding: '12px 16px', textAlign: 'left', fontSize: 13, color: '#6b7280', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', cursor: 'pointer' }}>Ngày đăng kí <SortIcon direction={sortBy === 'createdAt' ? sortDirection : undefined} /></th>
                <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: 13, color: '#6b7280', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Trạng thái</th>
                <th style={{ padding: '12px 16px', textAlign: 'right', fontSize: 13, color: '#6b7280', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {processedItems.map((u, index) => (
                <tr key={u.id} style={{ borderTop: '1px solid #e5e7eb' }}>
                  <td style={{ padding: '12px 16px', color: '#4b5563', fontSize: 14, textAlign: 'center' }}>
                    {(page - 1) * pageSize + index + 1}
                  </td>
                  <td style={{ padding: '16px', color: '#111827', fontWeight: 500, fontSize: 14 }}>{u.fullName ?? '-'}</td>
                  <td style={{ padding: '16px', color: '#4b5563', fontSize: 14 }}>{u.role ?? '-'}</td>
                  <td style={{ padding: '16px', color: '#4b5563', fontSize: 14 }}>{u.email}</td>
                  <td style={{ padding: '16px', color: '#4b5563', fontSize: 14 }}>{u.createdAt ? new Date(u.createdAt).toLocaleDateString() : '-'}</td>
                  <td style={{ padding: '16px' }}>
                    <select
                      value={((u as any).lockoutEnabled ? 'locked' : 'unlocked')}
                      onChange={(e) => handleStatusChange(u, e.target.value === 'locked')}
                      disabled={Boolean(updatingIds[u.id])}
                      style={{
                        ...getStatusStyle((u as any).lockoutEnabled),
                        opacity: updatingIds[u.id] ? 0.6 : 1,
                        cursor: updatingIds[u.id] ? 'not-allowed' : 'pointer'
                      }}>
                      <option value="unlocked">Hoạt động</option>
                      <option value="locked">Đang khóa</option>
                    </select>
                  </td>
                  <td style={{ padding: '16px', display: 'flex', gap: 16, justifyContent: 'flex-end', alignItems: 'center' }}>
                    <button onClick={() => handleViewDetails(u.id)} title="Xem chi tiết" style={{ background: 'transparent', border: 'none', cursor: 'pointer', padding: 0 }}><ViewIcon /></button>
                    <button onClick={() => onEdit(u)} title="Sửa vai trò" style={{ background: 'transparent', border: 'none', cursor: 'pointer', padding: 0 }}><EditIcon /></button>
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
            <select id="pageSize" value={pageSize} onChange={e => { setPageSize(Number(e.target.value)); setPage(1) }} style={{ padding: '6px 10px', borderRadius: 8, border: '1px solid #d1d5db' }}>
              <option value={5}>5</option>
              <option value={10}>10</option>
              <option value={15}>15</option>
            </select>
          </div>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page <= 1} style={{ padding: '8px 16px', borderRadius: 8, border: '1px solid #d1d5db', background: '#fff', cursor: 'pointer', opacity: page <= 1 ? 0.6 : 1 }}>
            Trang trước
          </button>
          <button onClick={() => setPage(p => p + 1)} disabled={users.length < pageSize} style={{ padding: '8px 16px', borderRadius: 8, border: '1px solid #d1d5db', background: '#fff', cursor: 'pointer', opacity: users.length < pageSize ? 0.6 : 1 }}>
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
