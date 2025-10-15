import React, { useEffect, useMemo, useState } from 'react'
import { categoryService } from '../../services/categoryService'
import { CategoryDTO } from '../../types/category.types'
import CategoryForm from '../../components/admin/CategoryForm'
import CategoryDetails from '../../components/admin/CategoryDetails'

export default function CategoryList() {
  const [items, setItems] = useState<CategoryDTO[]>([])
  const [total, setTotal] = useState<number | undefined>(undefined)
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)
  const [editing, setEditing] = useState<CategoryDTO | null>(null)
  const [showForm, setShowForm] = useState(false)
  const [viewing, setViewing] = useState<CategoryDTO | null>(null)
  const [search, setSearch] = useState('')

  const load = async () => {
    const r = await categoryService.list(page, pageSize)
    setItems(r.items)
    setTotal(r.total)
  }

  useEffect(() => { load() }, [page, pageSize])

  const onCreate = () => { setEditing(null); setShowForm(true) }
  const onEdit = (c: CategoryDTO) => { setEditing(c); setShowForm(true) }
  const onDelete = async (id: string) => { if (!confirm('Delete this category?')) return; await categoryService.remove(id); await load() }
  const onSaved = async () => { setShowForm(false); await load() }

  const filtered = useMemo(() => {
    const k = search.trim().toLowerCase()
    if (!k) return items
    return items.filter(c => (c.name ?? '').toLowerCase().includes(k) || (c.slug ?? '').toLowerCase().includes(k) || (c.description ?? '').toLowerCase().includes(k))
  }, [items, search])

  const pill = (active?: boolean) => {
    const isOn = Boolean(active)
    const text = isOn ? 'Đang hoạt động' : 'Ngừng'
    const bg = isOn ? '#e7f9ec' : '#fee2e2'
    const color = isOn ? '#16a34a' : '#dc2626'
    return <span style={{ background: bg, color, padding: '6px 10px', borderRadius: 16, fontSize: 12 }}>{text}</span>
  }

  return (
    <div style={{ padding: 16 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h2 style={{ margin: 0 }}>Categories</h2>
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

      <div style={{ marginTop: 12, display: 'flex', gap: 12, alignItems: 'center' }}>
        <input placeholder="Tìm theo tên/slug/mô tả..." value={search} onChange={e => setSearch(e.target.value)} style={{ padding: 8, minWidth: 260 }} />
        <button onClick={() => { /* trigger filter */ }} style={{ padding: '8px 10px' }}>Tìm</button>
        <button onClick={() => setSearch('')} style={{ padding: '8px 10px' }}>Xóa</button>
        {typeof total === 'number' && <div style={{ marginLeft: 'auto', color: '#666' }}>Tổng: {total}</div>}
      </div>

      <div style={{ marginTop: 12, background: '#fff', borderRadius: 8, border: '1px solid #eee', overflow: 'hidden' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '80px 1.2fr 1fr 1.2fr 1fr 120px', padding: '12px 16px', background: '#fafafa', color: '#666', fontWeight: 600, fontSize: 14 }}>
          <div>STT</div>
          <div>Tên</div>
          <div>Slug</div>
          <div>Mô tả</div>
          <div>Trạng thái</div>
          <div>Thao tác</div>
        </div>

        {filtered.map((c, idx) => (
          <div key={c.id} style={{ display: 'grid', gridTemplateColumns: '80px 1.2fr 1fr 1.2fr 1fr 120px', alignItems: 'center', padding: '14px 16px', borderTop: '1px solid #f0f0f0' }}>
            <div style={{ color: '#555' }}>{String((page - 1) * pageSize + idx + 1).padStart(3, '0')}</div>
            <div style={{ color: '#111', fontWeight: 500 }}>{c.name}</div>
            <div style={{ color: '#666' }}>{c.slug}</div>
            <div style={{ color: '#666' }}>{c.description}</div>
            <div>{pill(c.isActive)}</div>
            <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end' }}>
              <button onClick={() => setViewing(c)} title="Xem" style={{ background: 'transparent', border: 'none', cursor: 'pointer' }}>🔍</button>
              <button onClick={() => onEdit(c)} title="Sửa" style={{ background: 'transparent', border: 'none', cursor: 'pointer' }}>✏️</button>
              <button onClick={() => onDelete(c.id)} title="Xóa" style={{ background: 'transparent', border: 'none', cursor: 'pointer' }}>🗑️</button>
            </div>
          </div>
        ))}
      </div>

      <div style={{ marginTop: 12, display: 'flex', alignItems: 'center', gap: 8 }}>
        <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page <= 1}>Prev</button>
        <span>Page: {page}</span>
        <button onClick={() => setPage(p => p + 1)} disabled={items.length < pageSize}>Next</button>
      </div>

      {showForm && (
        <div style={{ marginTop: 16, padding: 12, border: '1px solid #ccc' }}>
          <CategoryForm category={editing ?? undefined} onSaved={onSaved} onCancel={() => setShowForm(false)} />
        </div>
      )}

      {viewing && <CategoryDetails category={viewing} onClose={() => setViewing(null)} />}
    </div>
  )
}
