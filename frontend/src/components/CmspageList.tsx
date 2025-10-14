import React, { useEffect, useState } from 'react'
import axios from 'axios'

type CmspageDto = {
  id: string
  pageTitle: string
  pageSlug: string
  pageContent: string
  metaTitle?: string
  metaDescription?: string
  isPublished: boolean
  publishedAt?: string | null
  authorName?: string
  viewCount?: number
  createdAt?: string
  updatedAt?: string
}

const API_BASE = (((import.meta as any).env?.VITE_API_BASE_URL) as string) || 'https://localhost:56798'

export function CmspageList({ onEdit }: { onEdit?: (item: CmspageDto & { id: string }) => void } = {}) {
  const [items, setItems] = useState<CmspageDto[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [query, setQuery] = useState('')

  async function fetchAll() {
    setError(null)
    setLoading(true)
    try {
      const url = `${API_BASE}/api/Cmspage`
      const res = await axios.get<CmspageDto[]>(url)
      setItems(res.data || [])
    } catch (err: any) {
      setError(err?.response?.data ?? err?.message ?? 'Unknown error')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchAll()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  async function handleDelete(id: string) {
    if (!confirm('Xác nhận xóa trang này?')) return
    try {
      const url = `${API_BASE}/api/Cmspage/${id}`
      await axios.delete(url)
      setItems(prev => prev.filter(i => i.id !== id))
    } catch (err: any) {
      setError(err?.response?.data ?? err?.message ?? 'Unknown error')
    }
  }

  const filtered = query.trim() ? items.filter(i => (i.pageTitle || '').toLowerCase().includes(query.toLowerCase()) || (i.pageSlug || '').toLowerCase().includes(query.toLowerCase())) : items

  return (
    <div style={{ marginTop: 12, padding: 12, border: '1px solid #eee', borderRadius: 8 }}>
      <h2>CMS Pages</h2>
      <div style={{ marginBottom: 8, display: 'flex', gap: 8, alignItems: 'center' }}>
        <input placeholder="Search by title or slug" value={query} onChange={e => setQuery(e.target.value)} style={{ padding: 6, flex: 1 }} />
        <button onClick={fetchAll} disabled={loading}>{loading ? 'Loading...' : 'Refresh'}</button>
      </div>

      {error && <div style={{ color: 'crimson' }}>Error: {String(error)}</div>}

      {!loading && filtered.length === 0 && <div>Không có trang nào.</div>}

      {filtered.length > 0 && (
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr>
              <th style={{ textAlign: 'left', borderBottom: '1px solid #ddd', padding: 8 }}>Title</th>
              <th style={{ textAlign: 'left', borderBottom: '1px solid #ddd', padding: 8 }}>Slug</th>
              <th style={{ textAlign: 'left', borderBottom: '1px solid #ddd', padding: 8 }}>Author</th>
              <th style={{ textAlign: 'left', borderBottom: '1px solid #ddd', padding: 8 }}>Published</th>
              <th style={{ textAlign: 'left', borderBottom: '1px solid #ddd', padding: 8 }}>Views</th>
              <th style={{ textAlign: 'left', borderBottom: '1px solid #ddd', padding: 8 }}>Created</th>
              <th style={{ textAlign: 'left', borderBottom: '1px solid #ddd', padding: 8 }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map(item => (
              <tr key={item.id}>
                <td style={{ padding: 8, borderBottom: '1px solid #f2f2f2' }}>{item.pageTitle}</td>
                <td style={{ padding: 8, borderBottom: '1px solid #f2f2f2' }}>{item.pageSlug}</td>
                <td style={{ padding: 8, borderBottom: '1px solid #f2f2f2' }}>{item.authorName}</td>
                <td style={{ padding: 8, borderBottom: '1px solid #f2f2f2' }}>{item.isPublished ? 'Yes' : 'No'}{item.publishedAt ? ` (${new Date(item.publishedAt).toLocaleString()})` : ''}</td>
                <td style={{ padding: 8, borderBottom: '1px solid #f2f2f2' }}>{item.viewCount ?? 0}</td>
                <td style={{ padding: 8, borderBottom: '1px solid #f2f2f2' }}>{item.createdAt ? new Date(item.createdAt).toLocaleString() : ''}</td>
                <td style={{ padding: 8, borderBottom: '1px solid #f2f2f2' }}>
                  <button onClick={() => navigator.clipboard?.writeText(item.pageSlug)} title="Copy slug">Copy slug</button>
                  <button onClick={() => handleDelete(item.id)} style={{ marginLeft: 8 }}>Delete</button>
                  <button onClick={() => onEdit?.(item as CmspageDto & { id: string })} style={{ marginLeft: 8 }}>Update</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  )
}

export default CmspageList
