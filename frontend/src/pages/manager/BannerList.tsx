import React, { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { bannerService } from '../../services/bannerService'
import { BannerDTO } from '../../types/banner.types'
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

export default function BannerList() {
  const [banners, setBanners] = useState<BannerDTO[]>([])
  const [total, setTotal] = useState<number | undefined>(undefined)
  const [error, setError] = useState<string | null>(null)
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(5)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>('all')
  const { showToast } = useToast()

  const load = async (currentPage = page, currentSearch = search, currentStatus = statusFilter) => {
    try {
      setError(null)
      const params = { keyword: currentSearch, status: currentStatus };
      const r = await bannerService.list(currentPage, pageSize, params)
      setBanners(r.items)
      setTotal(r.total)
    } catch (err) {
      console.error('BannerList: failed to load banners', err)
      const anyErr: any = err
      const msg = anyErr?.response?.data?.title ?? anyErr?.message ?? 'Failed to load banners'
      setError(msg)
    }
  }
  const navigate = useNavigate()
  useEffect(() => { load() }, [page, pageSize, statusFilter])

  // Scroll to top on page or page size change
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [page, pageSize]);

  const handleSearch = () => {
    setPage(1); // Reset to first page on new search
    load(1, search, statusFilter);
  }

  const onCreate = () => navigate('/manager/banners/new')
  const onEdit = (b: BannerDTO) => navigate(`/manager/banners/edit/${b.id}`)
  const onDelete = async (id: string) => {
    if (!confirm('Delete this banner?')) return;
    await bannerService.remove(id);
    showToast('Xóa banner thành công!')
    await load() 
  }

  const pill = (active?: boolean) => {
    const isOn = Boolean(active)
    const text = isOn ? 'Đang hoạt động' : 'Ngừng'
    const bg = isOn ? '#e7f9ec' : '#fee2e2'
    const color = isOn ? '#16a34a' : '#dc2626'
    return <span style={{ background: bg, color, padding: '6px 10px', borderRadius: 16, fontSize: 12, fontWeight: 500 }}>{text}</span>
  }
  
  if (error) {
    return (
      <div style={{ padding: 24, color: 'red' }}>
        <h2>Error loading banners</h2>
        <pre>{error}</pre>
      </div>
    )
  }

  return (
    <div style={{ padding: 24, backgroundColor: '#f9fafb', minHeight: '100vh' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <h1 style={{ margin: 0, fontSize: '1.875rem', fontWeight: 'bold', color: '#111827' }}>Quản lý Banner</h1>
        <button
          onClick={onCreate}
          style={{ padding: '10px 20px', background: '#2563eb', color: '#fff', borderRadius: 8, border: 'none', fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8 }}
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>
          Tạo mới
        </button>
      </div>

      {/* Filter Section */}
      <div style={{ marginBottom: 24, background: '#fff', border: '1px solid #e5e7eb', borderRadius: 12, padding: 20 }}>
        <div style={{ display: 'flex', gap: 16, alignItems: 'end', flexWrap: 'wrap' }}>
          <div style={{ flex: '2 1 200px' }}>
            <label style={{ fontSize: 14, color: '#4b5563', marginBottom: 6, display: 'block' }}>Tìm kiếm</label>
            <input
              placeholder="Tìm theo tiêu đề hoặc link..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter') handleSearch() }}
              style={{ width: '100%', padding: '10px 12px', border: '1px solid #d1d5db', borderRadius: 8, fontSize: 14 }}
            />
          </div>
          <div style={{ flex: '1 1 150px' }}>
            <label style={{ fontSize: 14, color: '#4b5563', marginBottom: 6, display: 'block' }}>Trạng thái</label>
            <select value={statusFilter} onChange={e => setStatusFilter(e.target.value as any)} style={{ padding: 10, width: '100%', border: '1px solid #d1d5db', borderRadius: 8, fontSize: 14 }}>
              <option value="all">Tất cả</option>
              <option value="active">Đang hoạt động</option>
              <option value="inactive">Ngừng</option>
            </select>
          </div>
          <div>
            <button onClick={handleSearch} style={{ padding: '10px 20px', background: '#1f2937', color: '#fff', borderRadius: 8, border: 'none', fontWeight: 500, cursor: 'pointer' }}>
              Tìm
            </button>
          </div>
          <div>
            <button onClick={() => { setSearch(''); setStatusFilter('all'); load(1, '', 'all'); }} style={{ padding: '10px 20px', background: '#fff', color: '#374151', borderRadius: 8, border: '1px solid #d1d5db', fontWeight: 500, cursor: 'pointer' }}>
              Xóa
            </button>
          </div>
        </div>
      </div>

      {/* Table */}
      <div style={{ background: '#fff', borderRadius: 12, border: '1px solid #e5e7eb', overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: '800px' }}>
          <thead style={{ backgroundColor: '#f9fafb' }}>
            <tr>
              <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: 13, color: '#6b7280', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', width: '120px' }}>Ảnh</th>
              <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: 13, color: '#6b7280', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Tiêu đề</th>
              <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: 13, color: '#6b7280', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Link</th>
              <th style={{ padding: '12px 16px', textAlign: 'center', fontSize: 13, color: '#6b7280', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Thứ tự</th>
              <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: 13, color: '#6b7280', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Trạng thái</th>
              <th style={{ padding: '12px 16px', textAlign: 'right', fontSize: 13, color: '#6b7280', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Thao tác</th>
            </tr>
          </thead>
          <tbody>
            {banners.map((b) => (
              <tr key={b.id} style={{ borderTop: '1px solid #e5e7eb' }}>
                <td style={{ padding: '12px 16px' }}>
                  <div style={{ width: 100, height: 56, background: '#f0f2f5', borderRadius: 6, overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    {b.imageUrl ? <img src={b.imageUrl} alt={b.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : <span style={{ fontSize: 12, color: '#6b7280' }}>No Image</span>}
                  </div>
                </td>
                <td style={{ padding: '16px', color: '#111827', fontWeight: 500, fontSize: 14 }}>{b.title}</td>
                <td style={{ padding: '16px', color: '#4b5563', fontSize: 14, maxWidth: 250, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{b.link}</td>
                <td style={{ padding: '16px', color: '#4b5563', fontSize: 14, textAlign: 'center' }}>{b.order ?? '-'}</td>
                <td style={{ padding: '16px' }}>{pill(b.isActive)}</td>
                <td style={{ padding: '16px', display: 'flex', gap: 16, justifyContent: 'flex-end', alignItems: 'center' }}>
                  <button onClick={() => onEdit(b)} title="Sửa" style={{ background: 'transparent', border: 'none', cursor: 'pointer', padding: 0 }}><EditIcon /></button>
                  <button onClick={() => onDelete(b.id)} title="Xóa" style={{ background: 'transparent', border: 'none', cursor: 'pointer', padding: 0 }}><DeleteIcon /></button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      <div style={{ marginTop: 24, display: 'flex', justifyContent: 'space-between', alignItems: 'center', color: '#4b5563', fontSize: 14 }}>
        <div>
          Hiển thị {banners.length} trên tổng số {total ?? 0} kết quả
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
          <div style={{ display: 'flex', gap: 8 }}>
            <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page <= 1} style={{ padding: '8px 16px', borderRadius: 8, border: '1px solid #d1d5db', background: '#fff', cursor: 'pointer', opacity: page <= 1 ? 0.6 : 1 }}>
              Trang trước
            </button>
            <button onClick={() => setPage(p => p + 1)} disabled={banners.length < pageSize} style={{ padding: '8px 16px', borderRadius: 8, border: '1px solid #d1d5db', background: '#fff', cursor: 'pointer', opacity: banners.length < pageSize ? 0.6 : 1 }}>
              Trang sau
            </button>
          </div>
        </div>
      </div>

    </div>
  )

}