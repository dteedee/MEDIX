import React, { useEffect, useState } from 'react'
import axios from 'axios'

type FormState = {
  pageTitle: string
  pageSlug: string
  pageContent: string
  metaTitle: string
  metaDescription: string
  isPublished: boolean
  publishedAt?: string | null
  authorId: string
}

type Draft = {
  id: string
  payload: Omit<FormState, 'publishedAt'> & { publishedAt?: string | null }
  createdAt: string
}

const API_BASE = (((import.meta as any).env?.VITE_API_BASE_URL) as string) || 'https://localhost:56798'

type EditProps = {
  id: string
} & Partial<FormState>

export function AddCmsPage({ editItem, onSaved }: { editItem?: EditProps | null, onSaved?: () => void }) {
  const [form, setForm] = useState<FormState>({
    pageTitle: '',
    pageSlug: '',
    pageContent: '',
    metaTitle: '',
    metaDescription: '',
    isPublished: false,
    publishedAt: null,
    // Provide an empty default; replace with your real authorId if desired
    authorId: '',
  })

  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [drafts, setDrafts] = useState<Draft[]>([])

  const DRAFT_KEY = 'cmsPageDrafts'

  useEffect(() => {
    try {
      const raw = localStorage.getItem(DRAFT_KEY)
      if (raw) setDrafts(JSON.parse(raw) as Draft[])
    } catch {
      // ignore
    }
  }, [])

  // If editItem provided, populate form for editing
  useEffect(() => {
    if (!editItem) return
    setForm(prev => ({
      ...prev,
      pageTitle: editItem.pageTitle ?? prev.pageTitle,
      pageSlug: editItem.pageSlug ?? prev.pageSlug,
      pageContent: editItem.pageContent ?? prev.pageContent,
      metaTitle: editItem.metaTitle ?? prev.metaTitle,
      metaDescription: editItem.metaDescription ?? prev.metaDescription,
      isPublished: typeof editItem.isPublished === 'boolean' ? editItem.isPublished : prev.isPublished,
      publishedAt: (editItem as any).publishedAt ?? prev.publishedAt,
      authorId: editItem.authorId ?? prev.authorId,
    }))
  }, [editItem])

  function persistDrafts(next: Draft[]) {
    try {
      localStorage.setItem(DRAFT_KEY, JSON.stringify(next))
    } catch {
      // ignore
    }
    setDrafts(next)
  }

  function update<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm(prev => ({ ...prev, [key]: value }))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setSuccess(null)

    // Basic validation
    if (!form.pageTitle.trim()) return setError('pageTitle is required')
    if (!form.pageSlug.trim()) return setError('pageSlug is required')
    if (!form.pageContent.trim()) return setError('pageContent is required')
    if (!form.authorId.trim()) return setError('authorId is required')

    const payload = {
      pageTitle: form.pageTitle,
      pageSlug: form.pageSlug,
      pageContent: form.pageContent,
      metaTitle: form.metaTitle,
      metaDescription: form.metaDescription,
      isPublished: form.isPublished,
      publishedAt: form.isPublished ? (form.publishedAt ?? new Date().toISOString()) : null,
      authorId: form.authorId,
    }

    setLoading(true)
    try {
      // If editItem exists -> update (PUT), otherwise create (POST)
      if (editItem && (editItem as any).id) {
        const url = `${API_BASE}/api/Cmspage/${(editItem as any).id}`
        const res = await axios.put(url, payload)
        setSuccess('Cập nhật thành công')
        onSaved?.()
      } else {
        const url = `${API_BASE}/api/Cmspage`
        const res = await axios.post(url, payload)
        setSuccess('Page created successfully')
        if (res?.data?.id) setSuccess(`Page created (id: ${res.data.id})`)
        // reset form except authorId
        setForm(prev => ({ ...prev, pageTitle: '', pageSlug: '', pageContent: '', metaTitle: '', metaDescription: '', isPublished: false, publishedAt: null }))
        onSaved?.()
      }
    } catch (err: any) {
      const msg = err?.response?.data?.message ?? err?.message ?? 'Unknown error'
      setError(String(msg))

      // If API is not reachable, save draft locally so user can retry later
      try {
        const id = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
        const draft: Draft = { id, payload: { ...form }, createdAt: new Date().toISOString() }
        const next = [draft, ...drafts]
        persistDrafts(next)
        setSuccess('API unavailable — saved draft locally. You can retry when API is online.')
      } catch {
        // ignore localStorage errors
      }
    } finally {
      setLoading(false)
    }
  }

  async function retryDraft(draft: Draft) {
    setError(null)
    setSuccess(null)
    try {
      const url = `${API_BASE}/api/Cmspage`
      const res = await axios.post(url, draft.payload)
      setSuccess('Draft sent successfully')
      // remove draft
      const next = drafts.filter(d => d.id !== draft.id)
      persistDrafts(next)
    } catch (err: any) {
      const msg = err?.response?.data?.message ?? err?.message ?? 'Unknown error'
      setError(String(msg))
    }
  }

  function deleteDraft(id: string) {
    const next = drafts.filter(d => d.id !== id)
    persistDrafts(next)
  }

  return (
    <div style={{ maxWidth: 820, marginTop: 24, padding: 12, border: '1px solid #eee', borderRadius: 8 }}>
      <h2>Add CMS Page</h2>
      <form onSubmit={handleSubmit}>
        <div style={{ display: 'grid', gap: 8 }}>
          <label>
            Title
            <input value={form.pageTitle} onChange={e => update('pageTitle', e.target.value)} style={{ width: '100%' }} />
          </label>

          <label>
            Slug
            <input value={form.pageSlug} onChange={e => update('pageSlug', e.target.value)} style={{ width: '100%' }} />
          </label>

          <label>
            Content
            <textarea value={form.pageContent} onChange={e => update('pageContent', e.target.value)} rows={8} style={{ width: '100%' }} />
          </label>

          <label>
            Meta title
            <input value={form.metaTitle} onChange={e => update('metaTitle', e.target.value)} style={{ width: '100%' }} />
          </label>

          <label>
            Meta description
            <textarea value={form.metaDescription} onChange={e => update('metaDescription', e.target.value)} rows={3} style={{ width: '100%' }} />
          </label>

          <label style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            <input type="checkbox" checked={form.isPublished} onChange={e => update('isPublished', e.target.checked)} />
            Published
          </label>

          <label>
            Published At (optional)
            <input value={form.publishedAt ?? ''} onChange={e => update('publishedAt', e.target.value || null)} style={{ width: '100%' }} placeholder="ISO 8601 datetime, e.g. 2025-10-13T06:49:01.323Z" />
          </label>

          <label>
            Author ID
            <input value={form.authorId} onChange={e => update('authorId', e.target.value)} style={{ width: '100%' }} placeholder="3fa85f64-5717-4562-b3fc-2c963f66afa6" />
          </label>

          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            <button type="submit" disabled={loading} style={{ padding: '8px 12px' }}>{loading ? 'Saving...' : 'Create page'}</button>
            <button type="button" onClick={() => { setForm({ pageTitle: '', pageSlug: '', pageContent: '', metaTitle: '', metaDescription: '', isPublished: false, publishedAt: null, authorId: form.authorId }) }}>Reset</button>
          </div>

          {error && <div style={{ color: 'crimson' }}>Error: {error}</div>}
          {success && <div style={{ color: 'green' }}>{success}</div>}
          {drafts.length > 0 && (
            <div style={{ marginTop: 12, padding: 8, borderTop: '1px solid #eee' }}>
              <h3>Saved drafts (offline)</h3>
              <ul style={{ paddingLeft: 16 }}>
                {drafts.map(d => (
                  <li key={d.id} style={{ marginBottom: 8 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', gap: 8, alignItems: 'center' }}>
                      <div>
                        <strong>{d.payload.pageTitle || '(no title)'}</strong>
                        <div style={{ fontSize: 12, color: '#666' }}>{new Date(d.createdAt).toLocaleString()}</div>
                      </div>
                      <div style={{ display: 'flex', gap: 8 }}>
                        <button type="button" onClick={() => retryDraft(d)}>Retry</button>
                        <button type="button" onClick={() => deleteDraft(d.id)}>Delete</button>
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </form>
    </div>
  )
}

export default AddCmsPage
