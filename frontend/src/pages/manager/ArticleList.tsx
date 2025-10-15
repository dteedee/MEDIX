import React, { useEffect, useMemo, useState } from 'react'
import { articleService } from '../../services/articleService'
import { ArticleDTO } from '../../types/article.types'
import ArticleForm from '../../components/admin/ArticleForm'
import ArticleDetails from '../../components/admin/ArticleDetails'

export default function ArticleList() {
  const [items, setItems] = useState<ArticleDTO[]>([])
  const [total, setTotal] = useState<number | undefined>(undefined)
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)
  const [editing, setEditing] = useState<ArticleDTO | null>(null)
  const [showForm, setShowForm] = useState(false)
  const [viewing, setViewing] = useState<ArticleDTO | null>(null)

  // filter/search UI
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<'all' | 'published' | 'draft'>('all')

  const load = async () => {
    const r = await articleService.list(page, pageSize)
    setItems(r.items)
    setTotal(r.total)
  }

  useEffect(() => { load() }, [page, pageSize])

  const onCreate = () => { setEditing(null); setShowForm(true) }
  const onEdit = (a: ArticleDTO) => { setEditing(a); setShowForm(true) }
  const onDelete = async (id: string) => { if (!confirm('Delete this article?')) return; await articleService.remove(id); await load() }
  const onSaved = async () => { setShowForm(false); await load() }

  const truncate = (s?: string, n = 120) => s && s.length > n ? s.slice(0, n).trim() + '...' : (s || '')
  const fmtDate = (d?: string) => d ? new Date(d).toLocaleDateString() : '-'

  // client-side filtered view to mimic the admin mockup filters
  const filtered = useMemo(() => {
    let arr = items
    if (search.trim()) {
      const k = search.toLowerCase()
      arr = arr.filter(a => (a.title ?? '').toLowerCase().includes(k) || (a.slug ?? '').toLowerCase().includes(k))
    }
    if (statusFilter === 'published') arr = arr.filter(a => (a.statusCode ?? '').toLowerCase().includes('publ'))
    if (statusFilter === 'draft') arr = arr.filter(a => (a.statusCode ?? '').toLowerCase().includes('draft'))
    return arr
  }, [items, search, statusFilter])

  return (
    <div style={{ padding: 16 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h2 style={{ margin: 0 }}>Articles</h2>
        <button onClick={onCreate} style={{ padding: '8px 12px' }}>+ Create</button>
      </div>

      <div style={{ display: 'flex', gap: 12, marginTop: 12, alignItems: 'center' }}>
        <input
          placeholder="Search title or slug..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          style={{ padding: 8, minWidth: 240 }}
        />
        <button onClick={() => { /* triggers useMemo via state change */ }} style={{ padding: '8px 10px' }}>Search</button>
        <button onClick={() => setSearch('')} style={{ padding: '8px 10px' }}>Clear</button>

        <div style={{ marginLeft: 'auto', display: 'flex', gap: 8, alignItems: 'center' }}>
          <label style={{ fontSize: 13 }}>Status</label>
          <select value={statusFilter} onChange={e => setStatusFilter(e.target.value as any)} style={{ padding: 8 }}>
            <option value="all">All</option>
            <option value="published">Published</option>
            <option value="draft">Draft</option>
          </select>

          <label style={{ marginLeft: 12 }}>Page size:</label>
          <select value={pageSize} onChange={e => { setPageSize(Number(e.target.value)); setPage(1) }} style={{ marginLeft: 8 }}>
            <option value={5}>5</option>
            <option value={10}>10</option>
            <option value={25}>25</option>
          </select>
        </div>
      </div>

      <div style={{ marginTop: 12, borderTop: '1px solid #eee' }}>
        {typeof total === 'number' && <div style={{ padding: '12px 0', color: '#555' }}>Total: {total}</div>}

        <div>
          {filtered.map(a => (
            <div key={a.id} style={{ display: 'flex', gap: 12, padding: 12, borderBottom: '1px solid #f0f0f0', alignItems: 'flex-start' }}>
              <div style={{ width: 120, height: 80, background: '#fafafa', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', borderRadius: 4 }}>
                {a.thumbnailUrl ? <img src={a.thumbnailUrl} alt={a.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : <div style={{ color: '#999' }}>No image</div>}
              </div>

              <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <div style={{ fontSize: 16, fontWeight: 600 }}>{a.title}</div>
                    <div style={{ fontSize: 12, color: '#888' }}>{a.slug}</div>
                  </div>
                  <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                    <div style={{ fontSize: 12, color: '#666' }}>Views: {a.viewCount ?? 0}</div>
                    <div style={{ marginLeft: 8, fontSize: 12, color: '#666' }}>{fmtDate(a.publishedAt ?? a.createdAt)}</div>
                  </div>
                </div>

                <div style={{ marginTop: 8, color: '#444' }}>{truncate(a.summary, 160)}</div>

                <div style={{ marginTop: 8, display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
                  {(a.categories || []).map((c, i) => (
                    <div key={`${c.name}-${i}`} style={{ background: '#eef6ff', color: '#0275d8', padding: '4px 8px', borderRadius: 12, fontSize: 12 }}>{c.name}</div>
                  ))}
                </div>
              </div>

              <div style={{ width: 150, textAlign: 'right', display: 'flex', flexDirection: 'column', gap: 8 }}>
                <div>
                  <span style={{ padding: '4px 8px', borderRadius: 12, fontSize: 12, background: (a.statusCode ?? '').toLowerCase().includes('publ') ? '#e6ffed' : '#f5f5f5', color: (a.statusCode ?? '').toLowerCase().includes('publ') ? '#0a0' : '#666' }}>{a.statusCode ?? 'Unknown'}</span>
                </div>

                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
                  <button onClick={() => setViewing(a)} title="View">🔍</button>
                  <button onClick={() => onEdit(a)} title="Edit">✏️</button>
                  <button onClick={() => onDelete(a.id)} title="Delete">🗑️</button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div style={{ marginTop: 12, display: 'flex', gap: 8, alignItems: 'center' }}>
        <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page <= 1}>Prev</button>
        <span>Page: {page}</span>
        <button onClick={() => setPage(p => p + 1)} disabled={items.length < pageSize}>Next</button>
      </div>

      {showForm && (
        <div style={{ marginTop: 16, padding: 12, border: '1px solid #ccc' }}>
          <ArticleForm article={editing ?? undefined} onSaved={onSaved} onCancel={() => setShowForm(false)} />
        </div>
      )}
      {viewing && (
        <ArticleDetails article={viewing} onClose={() => setViewing(null)} />
      )}
    </div>
  )
}
