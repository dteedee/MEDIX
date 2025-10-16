import React, { useEffect, useState } from 'react'
import { CmsPageDTO, CreateCmsPageRequest } from '../../types/cmspage.types'
import { cmspageService } from '../../services/cmspageService'
import './AdminForm.css'

interface Props { page?: CmsPageDTO; onSaved?: () => void; onCancel?: () => void }

export default function CmsPageForm({ page, onSaved, onCancel }: Props) {
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
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
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
      if (serverErrors) setErrors(serverErrors);
      console.error("Failed to save CMS page:", error)
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

  return (
    <form onSubmit={submit}>
      <div className="form-grid">
        <div className="form-group">
          <label htmlFor="pageTitle" className="form-label">Tiêu đề trang</label>
          <input id="pageTitle" name="pageTitle" type="text" className={`form-input ${errors.pageTitle ? 'is-invalid' : ''}`} value={formData.pageTitle} onChange={handleChange} />
          {errors.pageTitle && <div className="form-error">{errors.pageTitle}</div>}
        </div>
        <div className="form-group">
          <label htmlFor="pageSlug" className="form-label">Đường dẫn (Slug)</label>
          <input id="pageSlug" name="pageSlug" type="text" className={`form-input ${errors.pageSlug ? 'is-invalid' : ''}`} value={formData.pageSlug} onChange={handleChange} />
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
      </div>
    </form>
  )
}
