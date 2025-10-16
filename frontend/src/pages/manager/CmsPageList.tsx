import React, { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { cmspageService } from '../../services/cmspageService'
import { CmsPageDTO } from '../../types/cmspage.types'
import CmsPageDetails from '../../components/admin/CmsPageDetails'
import { useToast } from '../../contexts/ToastContext'

export default function CmsPageList() {
  const [items, setItems] = useState<CmsPageDTO[]>([])
  const [viewing, setViewing] = useState<CmsPageDTO | null>(null)
  const [search, setSearch] = useState('')

  const load = async () => {
    const r = await cmspageService.list()
    setItems(r)
  }

  const { showToast } = useToast()
  const navigate = useNavigate()
  useEffect(() => { load() }, [])

  const onCreate = () => navigate('/manager/cms-pages/new')
  const onEdit = (p: CmsPageDTO) => navigate(`/manager/cms-pages/edit/${p.id}`)
  const onDelete = async (id: string) => {
    if (!confirm('Delete this page?')) return;
    await cmspageService.remove(id);
    showToast('Xóa trang thành công!')
    await load() }

  const filtered = useMemo(() => {
    const k = search.trim().toLowerCase()
    if (!k) return items
    return items.filter(p => (p.pageTitle ?? '').toLowerCase().includes(k) || (p.pageSlug ?? '').toLowerCase().includes(k))
  }, [items, search])

  const pill = (p: CmsPageDTO) => {
    const text = p.isPublished ? 'Đang hoạt động' : 'Nháp'
    const bg = p.isPublished ? '#e7f9ec' : '#fff7e6'
    const color = p.isPublished ? '#16a34a' : '#b45309'
    return <span style={{ background: bg, color, padding: '6px 10px', borderRadius: 16, fontSize: 12 }}>{text}</span>
  }

  return (
    <div style={{ padding: 16 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h2 style={{ margin: 0 }}>CMS Pages</h2>
        <button onClick={onCreate} style={{ padding: '8px 12px' }}>+ Tạo mới</button>
      </div>

      <div style={{ marginTop: 12, display: 'flex', gap: 12, alignItems: 'center' }}>
        <input placeholder="Tìm theo tiêu đề/slug..." value={search} onChange={e => setSearch(e.target.value)} style={{ padding: 8, minWidth: 260 }} />
        <button onClick={() => { /* trigger filter */ }} style={{ padding: '8px 10px' }}>Tìm</button>
        <button onClick={() => setSearch('')} style={{ padding: '8px 10px' }}>Xóa</button>
      </div>

      <div style={{ marginTop: 12, background: '#fff', borderRadius: 8, border: '1px solid #eee', overflow: 'hidden' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '80px 1.4fr 1fr 1fr 1fr 120px', padding: '12px 16px', background: '#fafafa', color: '#666', fontWeight: 600, fontSize: 14 }}>
          <div>STT</div>
          <div>Tiêu đề</div>
          <div>Slug</div>
          <div>Tác giả</div>
          <div>Trạng thái</div>
          <div>Thao tác</div>
        </div>

        {filtered.map((p, idx) => (
          <div key={p.id} style={{ display: 'grid', gridTemplateColumns: '80px 1.4fr 1fr 1fr 1fr 120px', alignItems: 'center', padding: '14px 16px', borderTop: '1px solid #f0f0f0' }}>
            <div style={{ color: '#555' }}>{String(idx + 1).padStart(3, '0')}</div>
            <div style={{ color: '#111', fontWeight: 500 }}>{p.pageTitle}</div>
            <div style={{ color: '#666' }}>{p.pageSlug}</div>
            <div style={{ color: '#666' }}>{p.authorName ?? '-'}</div>
            <div>{pill(p)}</div>
            <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end' }}>
              <button onClick={() => setViewing(p)} title="Xem" style={{ background: 'transparent', border: 'none', cursor: 'pointer' }}>🔍</button>
              <button onClick={() => onEdit(p)} title="Sửa" style={{ background: 'transparent', border: 'none', cursor: 'pointer' }}>✏️</button>
              <button onClick={() => onDelete(p.id)} title="Xóa" style={{ background: 'transparent', border: 'none', cursor: 'pointer' }}>🗑️</button>
            </div>
          </div>
        ))}
      </div>

      {viewing && (
        <CmsPageDetails page={viewing} onClose={() => setViewing(null)} />
      )}
    </div>
  )
}
