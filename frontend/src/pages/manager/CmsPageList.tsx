import React, { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { cmspageService } from '../../services/cmspageService'
import { CmsPageDTO } from '../../types/cmspage.types'
import CmsPageDetails from '../../components/admin/CmsPageDetails'
import { useToast } from '../../contexts/ToastContext'

// Icons
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

export default function CmsPageList() {
  const [items, setItems] = useState<CmsPageDTO[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)
  const [viewing, setViewing] = useState<CmsPageDTO | null>(null)
  const [search, setSearch] = useState('')

  const load = async () => {
    const r = await cmspageService.list(page, pageSize, search)
    setItems(r.items)
    setTotal(r.total)
  }

  const { showToast } = useToast()
  const navigate = useNavigate()
  
  // Load data when page, pageSize, or search term changes
  useEffect(() => {
    load();
  }, [page, pageSize, search]);

  const onCreate = () => navigate('/manager/cms-pages/new')
  const onEdit = (p: CmsPageDTO) => navigate(`/manager/cms-pages/edit/${p.id}`)
  const onDelete = async (id: string) => {
    if (!confirm('Delete this page?')) return;
    await cmspageService.remove(id);
    showToast('Xóa trang thành công!')
    await load() }
  
  const pill = (p: CmsPageDTO) => {
    const text = p.isPublished ? 'Đang hoạt động' : 'Nháp'
    const bg = p.isPublished ? '#e7f9ec' : '#fff7e6'
    const color = p.isPublished ? '#16a34a' : '#b45309'
    return <span style={{ background: bg, color, padding: '6px 10px', borderRadius: 16, fontSize: 12 }}>{text}</span>
  }

  return (
    <div style={{ padding: 24, backgroundColor: '#f9fafb', minHeight: '100vh' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <h1 style={{ margin: 0, fontSize: '1.875rem', fontWeight: 'bold', color: '#111827' }}>Quản lý Trang (CMS)</h1>
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
        <div style={{ display: 'flex', gap: 16, alignItems: 'end' }}>
          <div style={{ flex: '1 1 300px' }}>
            <label style={{ fontSize: 14, color: '#4b5563', marginBottom: 6, display: 'block' }}>Tìm kiếm</label>
            <input
              placeholder="Tìm theo tiêu đề hoặc slug..."
              value={search}
              onChange={e => setSearch(e.target.value)} // Search will trigger useEffect
              onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); setPage(1); /* load() is now handled by useEffect */ } }}
              style={{ width: '100%', padding: '10px 12px', border: '1px solid #d1d5db', borderRadius: 8, fontSize: 14 }}
            />
          </div>
          <div>
            <button onClick={() => { setPage(1); load(); /* Keep manual trigger for explicit action */ }} style={{ padding: '10px 20px', background: '#0455ebff', color: '#fff', borderRadius: 8, border: 'none', fontWeight: 500, cursor: 'pointer', width: '100%' }}>
              Tìm
            </button>
          </div>
        </div>
      </div>

      {/* Table */}
      <div style={{ background: '#fff', borderRadius: 12, border: '1px solid #e5e7eb', overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead style={{ backgroundColor: '#f9fafb' }}>
            <tr>
              <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: 13, color: '#6b7280', fontWeight: 600, textTransform: 'uppercase' }}>Tiêu đề</th>
              <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: 13, color: '#6b7280', fontWeight: 600, textTransform: 'uppercase' }}>Slug</th>
              <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: 13, color: '#6b7280', fontWeight: 600, textTransform: 'uppercase' }}>Tác giả</th>
              <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: 13, color: '#6b7280', fontWeight: 600, textTransform: 'uppercase' }}>Trạng thái</th>
              <th style={{ padding: '12px 16px', textAlign: 'right', fontSize: 13, color: '#6b7280', fontWeight: 600, textTransform: 'uppercase' }}>Thao tác</th>
            </tr>
          </thead>
          <tbody>
            {items.map((p) => (
              <tr key={p.id} style={{ borderTop: '1px solid #e5e7eb' }}>
                <td style={{ padding: '16px', color: '#111827', fontWeight: 500, fontSize: 14 }}>{p.pageTitle}</td>
                <td style={{ padding: '16px', color: '#4b5563', fontSize: 14 }}>{p.pageSlug}</td>
                <td style={{ padding: '16px', color: '#4b5563', fontSize: 14 }}>{p.authorName ?? '-'}</td>
                <td style={{ padding: '16px' }}>{pill(p)}</td>
                <td style={{ padding: '16px', display: 'flex', gap: 16, justifyContent: 'flex-end', alignItems: 'center' }}>
                  <button onClick={() => onEdit(p)} title="Sửa" style={{ background: 'transparent', border: 'none', cursor: 'pointer', padding: 0 }}><EditIcon /></button>
                  <button onClick={() => onDelete(p.id)} title="Xóa" style={{ background: 'transparent', border: 'none', cursor: 'pointer', padding: 0 }}><DeleteIcon /></button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      <div style={{ marginTop: 24, display: 'flex', justifyContent: 'space-between', alignItems: 'center', color: '#4b5563', fontSize: 14 }}>
        <div>
          Hiển thị {items.length} trên tổng số {total} kết quả
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page <= 1} style={{ padding: '8px 16px', borderRadius: 8, border: '1px solid #d1d5db', background: '#fff', cursor: 'pointer', opacity: page <= 1 ? 0.6 : 1 }}>
            Trang trước
          </button>
          <button onClick={() => setPage(p => p + 1)} disabled={items.length < pageSize} style={{ padding: '8px 16px', borderRadius: 8, border: '1px solid #d1d5db', background: '#fff', cursor: 'pointer', opacity: items.length < pageSize ? 0.6 : 1 }}>
            Trang sau
          </button>
        </div>
      </div>

      {viewing && (
        <CmsPageDetails page={viewing} onClose={() => setViewing(null)} />
      )}
    </div>
  )
}
