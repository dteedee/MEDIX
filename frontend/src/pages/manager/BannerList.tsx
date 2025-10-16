import React, { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { bannerService } from '../../services/bannerService'
import { BannerDTO } from '../../types/banner.types'
import { useToast } from '../../contexts/ToastContext'

export default function BannerList() {
  const [banners, setBanners] = useState<BannerDTO[]>([])
  const [total, setTotal] = useState<number | undefined>(undefined)
  const [error, setError] = useState<string | null>(null)
  const [errorDetailsVisible, setErrorDetailsVisible] = useState(false)
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)
const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>('all')
  const { showToast } = useToast()

  const load = async () => {
    try {
      setError(null)
      const r = await bannerService.list(page, pageSize)
      setBanners(r.items)
      setTotal(r.total)
      if (!r.items || r.items.length === 0) {
        console.debug('BannerList: API returned no items', { page, pageSize, raw: r })
      }
    } catch (err) {
      console.error('BannerList: failed to load banners', err)
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const anyErr: any = err
      let msg = 'Failed to load banners'
      if (anyErr?.response) {
        const status = anyErr.response.status
        const statusText = anyErr.response.statusText
        msg += `: ${status} ${statusText}`
        setError(JSON.stringify(anyErr.response.data ?? anyErr.response, null, 2))
      } else {
        msg += `: ${anyErr?.message ?? String(anyErr)}`
        setError(String(anyErr))
      }
      // also keep a short message for display/title
      setError(msg)
    }
  }
  const navigate = useNavigate()
   useEffect(() => { load() }, [page, pageSize])

  const onCreate = () => navigate('/manager/banners/new')
  const onEdit = (b: BannerDTO) => navigate(`/manager/banners/edit/${b.id}`)
  const onDelete = async (id: string) => {
    if (!confirm('Delete this banner?')) return;
    await bannerService.remove(id);
    showToast('Xóa banner thành công!')
    await load() }

  const truncate = (s?: string, n = 120) => s && s.length > n ? s.slice(0, n).trim() + '...' : (s || '')

  const filtered = useMemo(() => {
    let arr = banners
    if (search.trim()) {
      const k = search.toLowerCase()
      arr = arr.filter(b => (b.title ?? '').toLowerCase().includes(k) || (b.link ?? '').toLowerCase().includes(k))
    }
    if (statusFilter === 'active') arr = arr.filter(b => b.isActive)
    if (statusFilter === 'inactive') arr = arr.filter(b => !b.isActive)
    return arr
  }, [banners, search, statusFilter])

  return (
    <div style={{ padding: 16 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h2 style={{ margin: 0 }}>Banner CMS</h2>
        <button onClick={onCreate} style={{ padding: '8px 12px' }}>+ Create</button>
      </div>

      <div style={{ display: 'flex', gap: 12, marginTop: 12, alignItems: 'center' }}>
        <input placeholder="Search title or link..." value={search} onChange={e => setSearch(e.target.value)} style={{ padding: 8, minWidth: 240 }} />
        <button onClick={() => {}} style={{ padding: '8px 10px' }}>Search</button>
        <button onClick={() => setSearch('')} style={{ padding: '8px 10px' }}>Clear</button>

        <div style={{ marginLeft: 'auto', display: 'flex', gap: 8, alignItems: 'center' }}>
          <label style={{ fontSize: 13 }}>Status</label>
          <select value={statusFilter} onChange={e => setStatusFilter(e.target.value as any)} style={{ padding: 8 }}>
            <option value="all">All</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
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
          {filtered.map(b => (
            <div key={b.id} style={{ display: 'flex', gap: 12, padding: 12, borderBottom: '1px solid #f0f0f0', alignItems: 'center' }}>
              <div style={{ width: 120, height: 80, background: '#fafafa', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', borderRadius: 4 }}>
                {b.imageUrl ? <img src={b.imageUrl} alt={b.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : <div style={{ color: '#999' }}>No image</div>}
              </div>

              <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <div style={{ fontSize: 16, fontWeight: 600 }}>{b.title}</div>
                    <div style={{ fontSize: 12, color: '#888' }}>{b.link}</div>
                  </div>
                </div>

                <div style={{ marginTop: 8, color: '#444' }}>{truncate(b.title, 160)}</div>
              </div>

              <div style={{ width: 160, textAlign: 'right', display: 'flex', flexDirection: 'column', gap: 8 }}>
                <div>
                  <span style={{ padding: '4px 8px', borderRadius: 12, fontSize: 12, background: b.isActive ? '#e6ffed' : '#f5f5f5', color: b.isActive ? '#0a0' : '#666' }}>{b.isActive ? 'Active' : 'Inactive'}</span>
                </div>

                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
                  <button onClick={() => onEdit(b)} title="Edit">✏️</button>
                  <button onClick={() => onDelete(b.id)} title="Delete">🗑️</button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div style={{ marginTop: 12, display: 'flex', gap: 8, alignItems: 'center' }}>
        <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page <= 1}>Prev</button>
        <span>Page: {page}</span>
        <button onClick={() => setPage(p => p + 1)} disabled={typeof total === 'number' ? page >= Math.ceil(total / pageSize) : banners.length < pageSize}>Next</button>
      </div>

    </div>
  )

}