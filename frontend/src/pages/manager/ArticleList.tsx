import React, { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { articleService } from '../../services/articleService'
import { ArticleDTO } from '../../types/article.types'
import ArticleDetails from '../../components/admin/ArticleDetails'
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

export default function ArticleList() {
  const [items, setItems] = useState<ArticleDTO[]>([])
  const [total, setTotal] = useState<number | undefined>(undefined)
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)
  const [viewing, setViewing] = useState<ArticleDTO | null>(null)

  // filter/search UI
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<'all' | 'published' | 'draft'>('all')
  const { showToast } = useToast()

  const load = async () => {
    const r = await articleService.list(page, pageSize, search)
    setItems(r.items)
    setTotal(r.total)
  }

  const navigate = useNavigate()
  
  useEffect(() => {
    load()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, pageSize])

  const onCreate = () => navigate('/manager/articles/new')
  const onEdit = (a: ArticleDTO) => navigate(`/manager/articles/edit/${a.id}`)
  const onDelete = async (id: string) => {
    if (!confirm('Delete this article?')) return;
    await articleService.remove(id);
    showToast('Xóa bài viết thành công!')
    await load() }

  const truncate = (s?: string, n = 120) => s && s.length > n ? s.slice(0, n).trim() + '...' : (s || '')
  const fmtDate = (d?: string) => d ? new Date(d).toLocaleDateString() : '-'

  // client-side filtered view to mimic the admin mockup filters
  const filtered = useMemo(() => {
    let arr = items;
    if (statusFilter === 'published') arr = arr.filter(a => (a.statusCode ?? '').toLowerCase().includes('publ'))
    if (statusFilter === 'draft') arr = arr.filter(a => (a.statusCode ?? '').toLowerCase().includes('draft'))
    return arr
  }, [items, search, statusFilter])

  return (
    <div style={{ padding: 24, backgroundColor: '#f9fafb', minHeight: '100vh' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <h1 style={{ margin: 0, fontSize: '1.875rem', fontWeight: 'bold', color: '#111827' }}>Quản lý Bài viết</h1>
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
              onChange={e => setSearch(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); setPage(1); load(); } }}
              style={{ width: '100%', padding: '10px 12px', border: '1px solid #d1d5db', borderRadius: 8, fontSize: 14 }}
            />
          </div>
          <div style={{ flex: '1 1 180px' }}>
            <label style={{ fontSize: 14, color: '#4b5563', marginBottom: 6, display: 'block' }}>Trạng thái</label>
            <select value={statusFilter} onChange={e => setStatusFilter(e.target.value as any)} style={{ width: '100%', padding: '10px 12px', border: '1px solid #d1d5db', borderRadius: 8, fontSize: 14 }}>
              <option value="all">Tất cả</option>
              <option value="published">Đã xuất bản</option>
              <option value="draft">Bản nháp</option>
            </select>
          </div>
          <div style={{ flex: '0 0 120px' }}>
            <label style={{ fontSize: 14, color: '#4b5563', marginBottom: 6, display: 'block' }}>Số lượng</label>
            <select value={pageSize} onChange={e => { setPageSize(Number(e.target.value)); setPage(1); }} style={{ width: '100%', padding: '10px 12px', border: '1px solid #d1d5db', borderRadius: 8, fontSize: 14 }}>
              <option value={5}>5</option>
              <option value={10}>10</option>
              <option value={20}>20</option>
            </select>
          </div>
          <div>
            <button onClick={() => { setPage(1); load(); }} style={{ padding: '10px 20px', background: '#0455ebff', color: '#fff', borderRadius: 8, border: 'none', fontWeight: 500, cursor: 'pointer', width: '100%' }}>Tìm</button>
          </div>
        </div>
      </div>

      {/* Article List */}
      <div style={{ background: '#fff', borderRadius: 12, border: '1px solid #e5e7eb', overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead style={{ backgroundColor: '#f9fafb' }}>
            <tr>
              <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: 13, color: '#6b7280', fontWeight: 600, textTransform: 'uppercase', width: '40%' }}>Bài viết</th>
              <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: 13, color: '#6b7280', fontWeight: 600, textTransform: 'uppercase' }}>Danh mục</th>
              <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: 13, color: '#6b7280', fontWeight: 600, textTransform: 'uppercase' }}>Trạng thái</th>
              <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: 13, color: '#6b7280', fontWeight: 600, textTransform: 'uppercase' }}>Ngày đăng</th>
              <th style={{ padding: '12px 16px', textAlign: 'right', fontSize: 13, color: '#6b7280', fontWeight: 600, textTransform: 'uppercase' }}>Thao tác</th>
            </tr>
          </thead>
          <tbody>
          {filtered.map(a => (
              <tr key={a.id} style={{ borderTop: '1px solid #e5e7eb' }}>
                <td style={{ padding: '16px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                    <div style={{ width: 100, height: 60, background: '#f3f4f6', borderRadius: 6, overflow: 'hidden', flexShrink: 0 }}>
                      {a.thumbnailUrl ? <img src={a.thumbnailUrl} alt={a.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : <div style={{ color: '#9ca3af', fontSize: 12, textAlign: 'center', padding: 4 }}>No image</div>}
                    </div>
                    <div>
                      <div style={{ color: '#111827', fontWeight: 600, fontSize: 14 }}>{a.title}</div>
                      <div style={{ color: '#6b7280', fontSize: 13, marginTop: 2 }}>/{a.slug}</div>
                    </div>
                  </div>
                </td>
                <td style={{ padding: '16px' }}>
                  <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                  {(a.categories || []).map((c, i) => (
                    <span key={`${c.name}-${i}`} style={{ background: '#eef2ff', color: '#4338ca', padding: '4px 8px', borderRadius: 12, fontSize: 12, fontWeight: 500 }}>{c.name}</span>
                  ))}
                  </div>
                </td>
                <td style={{ padding: '16px' }}>
                  <span style={{ padding: '4px 10px', borderRadius: 16, fontSize: 12, background: (a.statusCode ?? '').toLowerCase().includes('publ') ? '#dcfce7' : '#fef3c7', color: (a.statusCode ?? '').toLowerCase().includes('publ') ? '#166534' : '#92400e', fontWeight: 500 }}>{a.statusCode ?? 'Unknown'}</span>
                </td>
                <td style={{ padding: '16px', color: '#4b5563', fontSize: 14 }}>{fmtDate(a.publishedAt ?? a.createdAt)}</td>
                <td style={{ padding: '16px', display: 'flex', gap: 16, justifyContent: 'flex-end', alignItems: 'center' }}>
                  <button onClick={() => onEdit(a)} title="Sửa" style={{ background: 'transparent', border: 'none', cursor: 'pointer', padding: 0 }}><EditIcon /></button>
                  <button onClick={() => onDelete(a.id)} title="Xóa" style={{ background: 'transparent', border: 'none', cursor: 'pointer', padding: 0 }}><DeleteIcon /></button>
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
          <button onClick={() => setPage(p => p + 1)} disabled={(total !== undefined) ? (page * pageSize >= (total ?? 0)) : (items.length < pageSize)} style={{ padding: '8px 16px', borderRadius: 8, border: '1px solid #d1d5db', background: '#fff', cursor: 'pointer', opacity: (total !== undefined) ? (page * pageSize >= (total ?? 0) ? 0.6 : 1) : (items.length < pageSize ? 0.6 : 1) }}>
            Trang sau
          </button>
        </div>
      </div>

      {viewing && (
        <ArticleDetails article={viewing} onClose={() => setViewing(null)} />
      )}
    </div>
  )
}
