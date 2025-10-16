import React, { useEffect, useMemo, useState, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { userService } from '../../services/userService'
import { UserDTO } from '../../types/user.types'
import { useToast } from '../../contexts/ToastContext'

// SVG Icons for actions
const EditIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ color: '#4b5563' }}>
    <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
    <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
  </svg>
);

const DeleteIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ color: '#ef4444' }}>
    <polyline points="3 6 5 6 21 6" />
    <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
  </svg>
);
export default function UserList() {
  const [users, setUsers] = useState<UserDTO[]>([])
  const [total, setTotal] = useState<number | undefined>(undefined)
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)
  const [search, setSearch] = useState('')
  const [roleFilter, setRoleFilter] = useState<'all' | 'Admin' | 'Doctor' | 'Patient'>('all')
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>('all')
  const [dateFrom, setDateFrom] = useState<string>('')
  const [dateTo, setDateTo] = useState<string>('')
  const [loading, setLoading] = useState(false)
  const searchRef = useRef<number | undefined>(undefined)

  const { showToast } = useToast()
  const navigate = useNavigate()
  const load = async () => {
    const r = await userService.list(page, pageSize, search)
    setUsers(r.items)
    setTotal(r.total)
  }

  useEffect(() => { load() }, [page, pageSize])

  const onDelete = async (id: string) => {
    if (!confirm('Delete this user?')) return
    await userService.remove(id)
    showToast('Xóa người dùng thành công!')
    // reload current page
    await load()
  }

  const onCreate = () => navigate('/admin/users/new')
  const onEdit = (u: UserDTO) => navigate(`/admin/users/edit/${u.id}`)

  const onSearchChange = (v: string) => {
    setSearch(v)
  }

  const doSearch = () => {}

  const filtered = useMemo(() => {
    const from = dateFrom ? new Date(dateFrom) : undefined
    const to = dateTo ? new Date(dateTo) : undefined
    return users.filter(u => {
      // Lọc theo vai trò (client-side)
      const okRole = roleFilter === 'all' || (u.role?.toLowerCase() === roleFilter.toLowerCase())
      // status (using emailConfirmed as proxy for active)
      const okStatus = statusFilter === 'all' || (statusFilter === 'active' ? Boolean(u.emailConfirmed) : !u.emailConfirmed)
      // date range on createdAt
      let okDate = true
      if (from || to) {
        const created = u.createdAt ? new Date(u.createdAt) : undefined
        okDate = !!created && (!from || created >= from) && (!to || created <= to)
      }
      return okRole && okStatus && okDate
    })
  }, [users, roleFilter, statusFilter, dateFrom, dateTo])

  const pill = (v?: boolean) => {
    const on = Boolean(v)
    const text = on ? 'Đã xác thực' : 'Chưa'
    const bg = on ? '#e7f9ec' : '#fff7e6'
    const color = on ? '#16a34a' : '#b45309'
    return <span style={{ background: bg, color, padding: '6px 10px', borderRadius: 16, fontSize: 12 }}>{text}</span>
  }

  // Removed Avatar column per design update

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
              placeholder="Tên, email, SĐT..."
              value={search}
              onChange={e => onSearchChange(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); load() } }}
              style={{ width: '100%', padding: '10px 12px', border: '1px solid #d1d5db', borderRadius: 8, fontSize: 14 }}
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
              <option value="active">Đã xác thực</option>
              <option value="inactive">Chưa xác thực</option>
            </select>
          </div>
          <div style={{ flex: '1 1 150px' }}>
            <label style={{ fontSize: 14, color: '#4b5563', marginBottom: 6, display: 'block' }}>Từ ngày</label>
            <input type="date" value={dateFrom} onChange={e => setDateFrom(e.target.value)} style={{ padding: 9, width: '100%', border: '1px solid #d1d5db', borderRadius: 8, fontSize: 14 }} />
          </div>
          <div style={{ flex: '1 1 150px' }}>
            <label style={{ fontSize: 14, color: '#4b5563', marginBottom: 6, display: 'block' }}>Đến ngày</label>
            <input type="date" value={dateTo} onChange={e => setDateTo(e.target.value)} style={{ padding: 9, width: '100%', border: '1px solid #d1d5db', borderRadius: 8, fontSize: 14 }} />
          </div>
          <div>
            <button onClick={() => load()} style={{ padding: '10px 20px', background: '#1f2937', color: '#fff', borderRadius: 8, border: 'none', fontWeight: 500, cursor: 'pointer', width: '100%' }}>Tìm</button>
          </div>
        </div>
      </div>

      {/* Table */}
      <div style={{ background: '#fff', borderRadius: 12, border: '1px solid #e5e7eb', overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead style={{ backgroundColor: '#f9fafb' }}>
            <tr>
              <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: 13, color: '#6b7280', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Họ và tên</th>
              <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: 13, color: '#6b7280', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Vai trò</th>
              <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: 13, color: '#6b7280', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Email</th>
              <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: 13, color: '#6b7280', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Ngày đăng kí</th>
              <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: 13, color: '#6b7280', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Trạng thái</th>
              <th style={{ padding: '12px 16px', textAlign: 'right', fontSize: 13, color: '#6b7280', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Thao tác</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((u, index) => (
              <tr key={u.id} style={{ borderTop: '1px solid #e5e7eb' }}>
                <td style={{ padding: '16px', color: '#111827', fontWeight: 500, fontSize: 14 }}>{u.fullName ?? '-'}</td>
                <td style={{ padding: '16px', color: '#4b5563', fontSize: 14 }}>{u.role ?? '-'}</td>
                <td style={{ padding: '16px', color: '#4b5563', fontSize: 14 }}>{u.email}</td>
                <td style={{ padding: '16px', color: '#4b5563', fontSize: 14 }}>{u.createdAt ? new Date(u.createdAt).toLocaleDateString() : '-'}</td>
                <td style={{ padding: '16px' }}>{pill(u.emailConfirmed)}</td>
                <td style={{ padding: '16px', display: 'flex', gap: 16, justifyContent: 'flex-end', alignItems: 'center' }}>
                  <button onClick={() => onEdit(u)} title="Sửa" style={{ background: 'transparent', border: 'none', cursor: 'pointer', padding: 0 }}><EditIcon /></button>
                  <button onClick={() => onDelete(u.id)} title="Xóa" style={{ background: 'transparent', border: 'none', cursor: 'pointer', padding: 0 }}><DeleteIcon /></button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      <div style={{ marginTop: 24, display: 'flex', justifyContent: 'space-between', alignItems: 'center', color: '#4b5563', fontSize: 14 }}>
        <div>
          Hiển thị {filtered.length} trên tổng số {total ?? 0} kết quả
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
    </div>
  )
}
