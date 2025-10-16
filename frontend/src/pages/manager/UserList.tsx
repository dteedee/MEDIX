import React, { useEffect, useMemo, useState, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { userService } from '../../services/userService'
import { UserDTO } from '../../types/user.types'
import { useToast } from '../../contexts/ToastContext'

export default function UserList() {
  const [users, setUsers] = useState<UserDTO[]>([])
  const [total, setTotal] = useState<number | undefined>(undefined)
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(false)
  const searchRef = useRef<number | undefined>(undefined)

  const { showToast } = useToast()
  const navigate = useNavigate()
  const load = async () => {
    const r = await userService.list(page, pageSize, search)
    setUsers(r.items)
    setTotal(r.total)
  }

  useEffect(() => { load() }, [page, pageSize, search])

  const onDelete = async (id: string) => {
    if (!confirm('Delete this user?')) return
    await userService.remove(id)
    showToast('Xóa người dùng thành công!')
    // reload current page
    await load()
  }

  const onCreate = () => navigate('/manager/users/new')
  const onEdit = (u: UserDTO) => navigate(`/manager/users/edit/${u.id}`)

  const onSearchChange = (v: string) => {
    setSearch(v)
    window.clearTimeout(searchRef.current)
    searchRef.current = window.setTimeout(() => setPage(1), 300) as unknown as number
  }

  const doSearch = () => {}

  const filtered = useMemo(() => {
    const k = search.trim().toLowerCase()
    if (!k) return users
    return users.filter(u => (u.fullName ?? '').toLowerCase().includes(k)
      || (u.email ?? '').toLowerCase().includes(k)
      || (u.phoneNumber ?? '').toLowerCase().includes(k)
      || (u.role ?? '').toLowerCase().includes(k))
  }, [users, search])

  const pill = (v?: boolean) => {
    const on = Boolean(v)
    const text = on ? 'Đã xác thực' : 'Chưa'
    const bg = on ? '#e7f9ec' : '#fff7e6'
    const color = on ? '#16a34a' : '#b45309'
    return <span style={{ background: bg, color, padding: '6px 10px', borderRadius: 16, fontSize: 12 }}>{text}</span>
  }

  return (
    <div style={{ padding: 16 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h2 style={{ margin: 0 }}>User Management</h2>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <label>Page size:</label>
          <select value={pageSize} onChange={e => { setPageSize(Number(e.target.value)); setPage(1) }} style={{ padding: 6 }}>
            <option value={5}>5</option>
            <option value={10}>10</option>
            <option value={25}>25</option>
          </select>
          <button onClick={onCreate} style={{ padding: '8px 12px', marginLeft: 8 }}>+ Tạo mới</button>
        </div>
      </div>

      <div style={{ marginTop: 12, display: 'flex', gap: 8, alignItems: 'center' }}>
        <input
          placeholder="Tìm theo tên"
          value={search}
          onChange={e => onSearchChange(e.target.value)}
          onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); doSearch() } }}
          style={{ width: 260, padding: 8 }}
        />
        <button type="button" onClick={() => doSearch()} disabled={loading}>Tìm</button>
        <button type="button" onClick={() => { setSearch(''); setPage(1); load() }} disabled={loading}>Xóa</button>
        {typeof total === 'number' && <div style={{ marginLeft: 'auto', color: '#666' }}>Tổng: {total}</div>}
      </div>

      <div style={{ marginTop: 12, background: '#fff', borderRadius: 8, border: '1px solid #eee', overflow: 'hidden' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '80px 1.6fr 1.2fr 1fr 1fr 1fr 120px', padding: '12px 16px', background: '#fafafa', color: '#666', fontWeight: 600, fontSize: 14 }}>
          <div>STT</div>
          <div>Email</div>
          <div>Họ tên</div>
          <div>Điện thoại</div>
          <div>Vai trò</div>
          <div>Xác thực</div>
          <div>Thao tác</div>
        </div>

        {filtered.map((u, idx) => (
          <div key={u.id} style={{ display: 'grid', gridTemplateColumns: '80px 1.6fr 1.2fr 1fr 1fr 1fr 120px', alignItems: 'center', padding: '14px 16px', borderTop: '1px solid #f0f0f0' }}>
            <div style={{ color: '#555' }}>{String((page - 1) * pageSize + idx + 1).padStart(3, '0')}</div>
            <div style={{ color: '#111' }}>{u.email}</div>
            <div style={{ color: '#111', fontWeight: 500 }}>{u.fullName ?? '-'}</div>
            <div style={{ color: '#666' }}>{u.phoneNumber ?? '-'}</div>
            <div style={{ color: '#666' }}>{u.role ?? '-'}</div>
            <div>{pill(u.emailConfirmed)}</div>
            <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end' }}>
              <button onClick={() => onEdit(u)} title="Sửa" style={{ background: 'transparent', border: 'none', cursor: 'pointer' }}>✏️</button>
              <button onClick={() => onDelete(u.id)} title="Xóa" style={{ background: 'transparent', border: 'none', cursor: 'pointer' }}>🗑️</button>
            </div>
          </div>
        ))}
      </div>

      <div style={{ marginTop: 12, display: 'flex', alignItems: 'center', gap: 8 }}>
        <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page <= 1}>Prev</button>
        <span>Page: {page}</span>
        <button onClick={() => setPage(p => p + 1)} disabled={users.length < pageSize}>Next</button>
      </div>
    </div>
  )
}
