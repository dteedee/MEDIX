import React, { useEffect, useState } from 'react'
import { CmsPageDTO, CreateCmsPageRequest } from '../../types/cmspage.types'
import { cmspageService } from '../../services/cmspageService'
import { useToast } from '../../contexts/ToastContext'
import './AdminForm.css'

interface Props { page?: CmsPageDTO; onSaved?: () => void; onCancel?: () => void }

export default function CmsPageForm({ page, onSaved, onCancel }: Props) {
  const { showToast } = useToast()
  const [formData, setFormData] = useState({
    pageTitle: page?.pageTitle ?? '',
    pageSlug: page?.pageSlug ?? '',
    pageContent: page?.pageContent ?? '',
    metaTitle: page?.metaTitle ?? '',
    metaDescription: page?.metaDescription ?? '',
    isPublished: page?.isPublished ?? false,
  })

  // This is a temporary solution. In a real app, you'd get the logged-in user's ID from an AuthContext.
  // I'm keeping the hardcoded ID but moving it out of the state.
  // TODO: Replace with actual logged-in user ID from AuthContext when available
  // Use a REAL user ID from your database for development until auth is ready.
  const [authorId, setAuthorId] = useState<string>('1A2C1A65-7B00-415F-8164-4FC3C1054203') // <-- Replace with a valid user ID from your DB
  const [saving, setSaving] = useState(false)
  const [errors, setErrors] = useState<Partial<Record<keyof typeof formData, string>>>({})

  const validateForm = (): boolean => {
    const newErrors: Partial<Record<keyof typeof formData, string>> = {}
    if (!formData.pageTitle.trim()) newErrors.pageTitle = 'Tiêu đề trang là bắt buộc.'
    if (!formData.pageSlug.trim()) newErrors.pageSlug = 'Đường dẫn (slug) là bắt buộc.'
    // Merge with any existing errors (e.g. duplicate-slug detected onBlur)
    const merged = { ...newErrors, ...(errors || {}) }
    setErrors(merged)
    return Object.keys(merged).length === 0
  }

  // Check slug uniqueness by querying backend search endpoint on blur
  const handleSlugBlur = async () => {
    const slug = (formData.pageSlug || '').trim()
    if (!slug) return
    try {
      // Search backend for this slug. Use pageSize > 0 to get matches.
      const r = await cmspageService.search(slug, 1, 1)
      const items = r.items || []
      // If any item has same slug and different id => conflict
      const conflict = items.find(i => (i.pageSlug ?? '').toLowerCase() === slug.toLowerCase() && i.id !== (page?.id ?? undefined))
      if (conflict) {
        setErrors(prev => ({ ...prev, pageSlug: 'Không được phép trùng slug' }))
      } else {
        setErrors(prev => {
          const copy = { ...prev }
          delete copy.pageSlug
          return copy
        })
      }
    } catch (err) {
      // silent: don't block user on transient errors; server-side validation will catch duplicates on submit
      console.error('Slug uniqueness check failed', err)
    }
  }

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!validateForm()) return

    setSaving(true)
    try {
      const payload: CreateCmsPageRequest = {
        pageTitle: formData.pageTitle.trim(),
        pageSlug: formData.pageSlug.trim(),
        pageContent: formData.pageContent.trim(),
        metaTitle: formData.metaTitle,
        metaDescription: formData.metaDescription,
        isPublished: formData.isPublished,
        publishedAt: formData.isPublished ? new Date().toISOString() : undefined,
        authorId
      } as any // Cast to allow undefined for optional fields
      if (page) await cmspageService.update(page.id, payload as any)
      else await cmspageService.create(payload)
      onSaved?.()
    } catch (error: any) {
      const serverErrors = error?.response?.data?.errors;
      const serverMessage = error?.response?.data?.message || error?.response?.data || '';
      if (serverErrors) {
        setErrors(serverErrors);
      } else if (typeof serverMessage === 'string' && /slug/i.test(serverMessage) && /duplicate|exists|đã tồn tại|trùng/i.test(serverMessage)) {
        // Handle duplicate slug message (English or Vietnamese heuristics)
  setErrors(prev => ({ ...prev, pageSlug: 'Không được phép trùng slug' }))
  // Only show inline field error for duplicate slug (no toast)
      } else if (typeof serverMessage === 'string') {
        // Avoid showing long server stack traces. If message suggests duplicate slug, show short message.
        if (/slug/i.test(serverMessage) && /duplicate|exists|đã tồn tại|trùng|ValidationException/i.test(serverMessage)) {
          try { showToast('slug không được phép trùng', 'error') } catch {}
        } else {
          try { showToast('Slug không được phép trùng', 'error') } catch {}
        }
      }
      console.error('Failed to save CMS page:', error)
    } finally { setSaving(false) }
  }

  // Prefill with latest when editing
  useEffect(() => {
    const load = async () => {
      if (!page?.id) return
      try {
        const full = await cmspageService.get(page.id)
        setFormData({
          pageTitle: full.pageTitle ?? '',
          pageSlug: full.pageSlug ?? '',
          pageContent: full.pageContent ?? '',
          metaTitle: full.metaTitle ?? '',
          metaDescription: full.metaDescription ?? '',
          isPublished: Boolean(full.isPublished),
        })
        // best-effort: authorId might be present on API
        // If not, keep the hardcoded one.
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const apiAuthorId = (full as any)?.authorId;
        if (apiAuthorId) setAuthorId(apiAuthorId);
      } catch {
        // ignore
      }
    }
    load()
  }, [page?.id])

  // Auto-generate slug from title if slug is empty
  useEffect(() => {
    if (!formData.pageSlug && formData.pageTitle) {
      const generatedSlug = formData.pageTitle.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/đ/g, "d").replace(/[^a-z0-9\s-]/g, '').trim().replace(/\s+/g, '-');
      setFormData(prev => ({ ...prev, pageSlug: generatedSlug }))
    }
  }, [formData.pageTitle]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target
    const checked = (e.target as HTMLInputElement).checked

    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }))
  }

  // --- CSS Styles --- (Adopted from UserForm for consistency)
  const formContainerStyle: React.CSSProperties = {
    background: '#fff',
    border: '1px solid #e5e7eb',
    borderRadius: 12,
    padding: '28px',
    boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)',
  }
  const labelStyle: React.CSSProperties = {
    fontSize: 14,
    color: '#374151',
    marginBottom: 6,
    display: 'block',
    fontWeight: 600,
  }
  const inputStyle: React.CSSProperties = {
    width: '100%',
    padding: '10px 12px',
    border: '1px solid #d1d5db',
    borderRadius: 8,
    fontSize: 15,
    boxSizing: 'border-box',
    transition: 'border-color 0.2s, box-shadow 0.2s',
  }
  const textareaStyle: React.CSSProperties = {
    ...inputStyle,
    minHeight: '150px',
    fontFamily: 'inherit',
  }
  const gridStyle: React.CSSProperties = {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
    gap: '24px',
  }

  return (
<<<<<<< HEAD
    <form onSubmit={submit}>
      <div className="form-grid">
        <div className="form-group">
          <label htmlFor="pageTitle" className="form-label">Tiêu đề trang</label>
          <input id="pageTitle" name="pageTitle" type="text" className={`form-input ${errors.pageTitle ? 'is-invalid' : ''}`} value={formData.pageTitle} onChange={handleChange} />
          {errors.pageTitle && <div className="form-error">{errors.pageTitle}</div>}
        </div>
        <div className="form-group">
          <label htmlFor="pageSlug" className="form-label">Đường dẫn (Slug)</label>
                <input id="pageSlug" name="pageSlug" type="text" className={`form-input ${errors.pageSlug ? 'is-invalid' : ''}`} value={formData.pageSlug} onChange={handleChange} onBlur={handleSlugBlur} />
          {errors.pageSlug && <div className="form-error">{errors.pageSlug}</div>}
        </div>
        <div className="form-group" style={{ gridColumn: 'span 2' }}>
          <label htmlFor="pageContent" className="form-label">Nội dung</label>
          <textarea id="pageContent" name="pageContent" className="form-input" value={formData.pageContent} onChange={handleChange} rows={10}></textarea>
        </div>
        <div className="form-group">
          <label htmlFor="metaTitle" className="form-label">Meta Title (SEO)</label>
          <input id="metaTitle" name="metaTitle" type="text" className="form-input" value={formData.metaTitle} onChange={handleChange} />
        </div>
        <div className="form-group">
          <label htmlFor="metaDescription" className="form-label">Meta Description (SEO)</label>
          <input id="metaDescription" name="metaDescription" type="text" className="form-input" value={formData.metaDescription} onChange={handleChange} />
        </div>
        <div className="form-group" style={{ gridColumn: 'span 2', flexDirection: 'row', alignItems: 'center', gap: '10px' }}>
          <input
            id="isPublished"
            name="isPublished"
            type="checkbox"
            checked={formData.isPublished}
            onChange={handleChange}
            style={{ width: '16px', height: '16px' }}
          />
          <label htmlFor="isPublished" className="form-label" style={{ marginBottom: 0 }}>
            Xuất bản
          </label>
        </div>

        <div className="form-actions">
          <button type="button" className="form-button form-button-secondary" onClick={onCancel} disabled={saving}>
            Hủy
          </button>
          <button type="submit" className="form-button form-button-primary" disabled={saving}>
            {saving ? 'Đang lưu...' : 'Lưu'}
          </button>
        </div>
=======
    <form onSubmit={submit} style={formContainerStyle}>
      <div style={gridStyle}>
        <div style={{ gridColumn: '1 / -1' }}>
          <label style={labelStyle}>Tiêu đề trang</label>
          <input value={title} onChange={e => setTitle(e.target.value)} required style={inputStyle} />
        </div>
        <div style={{ gridColumn: '1 / -1' }}>
          <label style={labelStyle}>Đường dẫn (Slug)</label>
          <input value={slug} onChange={e => setSlug(e.target.value)} style={inputStyle} />
        </div>
        <div style={{ gridColumn: '1 / -1' }}>
          <label style={labelStyle}>Nội dung</label>
          <textarea value={content} onChange={e => setContent(e.target.value)} style={textareaStyle} />
        </div>
        <div>
          <label style={labelStyle}>Meta Title (SEO)</label>
          <input value={metaTitle} onChange={e => setMetaTitle(e.target.value)} style={inputStyle} />
        </div>
        <div>
          <label style={labelStyle}>Meta Description (SEO)</label>
          <input value={metaDescription} onChange={e => setMetaDescription(e.target.value)} style={inputStyle} />
        </div>
        <div>
          <label style={labelStyle}>Trạng thái</label>
          <div style={{ display: 'flex', alignItems: 'center', height: '42px' }}>
            <input type="checkbox" id="isPublished" checked={isPublished} onChange={e => setIsPublished(e.target.checked)} style={{ marginRight: 8, width: 16, height: 16, cursor: 'pointer' }} />
            <label htmlFor="isPublished" style={{ fontSize: 14, color: '#4b5563', cursor: 'pointer' }}>Xuất bản</label>
          </div>
        </div>
      </div>

      <div style={{ marginTop: 32, display: 'flex', justifyContent: 'flex-end', gap: 12 }}>
        <button type="button" onClick={onCancel} style={{ padding: '10px 20px', backgroundColor: '#fff', color: '#374151', borderRadius: 8, border: '1px solid #d1d5db', fontWeight: 600, cursor: 'pointer', transition: 'background-color 0.2s' }}>
          Hủy
        </button>
        <button type="submit" disabled={saving} style={{ padding: '10px 20px', backgroundColor: saving ? '#9ca3af' : '#2563eb', color: '#fff', borderRadius: 8, border: 'none', fontWeight: 600, cursor: saving ? 'not-allowed' : 'pointer', opacity: saving ? 0.7 : 1, transition: 'background-color 0.2s' }}>
          {saving ? 'Đang lưu...' : 'Lưu trang'}
        </button>
>>>>>>> NEW-Manager-User
      </div>
    </form>
  )
}
