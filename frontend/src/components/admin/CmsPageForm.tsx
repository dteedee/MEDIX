import React, { useEffect, useState } from 'react'
import { CmsPageDTO, CreateCmsPageRequest } from '../../types/cmspage.types'
import { cmspageService } from '../../services/cmspageService'
import { useToast } from '../../contexts/ToastContext'

interface Props { page?: CmsPageDTO; onSaved?: () => void; onCancel?: () => void }

export default function CmsPageForm({ page, onSaved, onCancel }: Props) {
  const { showToast } = useToast();
  const [title, setTitle] = useState(page?.pageTitle ?? '')
  const [slug, setSlug] = useState(page?.pageSlug ?? '')
  const [content, setContent] = useState(page?.pageContent ?? '')
  const [metaTitle, setMetaTitle] = useState(page?.metaTitle ?? '')
  const [metaDescription, setMetaDescription] = useState(page?.metaDescription ?? '')
  const [isPublished, setIsPublished] = useState<boolean>(page?.isPublished ?? false)
  // TODO: Replace with actual logged-in user ID from AuthContext when available
  // Use a REAL user ID from your database for development until auth is ready.
  const [authorId, setAuthorId] = useState<string>('1A2C1A65-7B00-415F-8164-4FC3C1054203') // <-- Replace with a valid user ID from your DB
  const [saving, setSaving] = useState(false)

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    try {
      const payload: CreateCmsPageRequest = {
        pageTitle: title.trim(),
        pageSlug: slug.trim(),
        pageContent: content.trim(),
        metaTitle,
        metaDescription,
        isPublished,
        publishedAt: isPublished ? new Date().toISOString() : undefined,
        authorId
      } as any // Cast to allow undefined for optional fields
      if (page) await cmspageService.update(page.id, payload as any)
      else await cmspageService.create(payload)
      onSaved?.()
    } catch (error) {
      console.error('Error saving CMS page:', error);
      // Theo yêu cầu, hiển thị thông báo này cho bất kỳ lỗi lưu nào.
      // Trong một ứng dụng thực tế, bạn nên kiểm tra `error.response` để phân biệt các loại lỗi cụ thể.
      showToast('Slug không được phép trùng', 'error');
    } finally {
      setSaving(false)
    }
  }

  // Prefill with latest when editing
  useEffect(() => {
    const load = async () => {
      if (!page?.id) return
      try {
        const full = await cmspageService.get(page.id)
        setTitle(full.pageTitle ?? '')
        setSlug(full.pageSlug ?? '')
        setContent(full.pageContent ?? '')
        setMetaTitle(full.metaTitle ?? '')
        setMetaDescription(full.metaDescription ?? '')
        setIsPublished(Boolean(full.isPublished))
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
    if (!slug && title) {
      const generatedSlug = title.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/đ/g, "d").replace(/[^a-z0-9\s-]/g, '').trim().replace(/\s+/g, '-');
      setSlug(generatedSlug);
    }
  }, [title]);

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
            <label htmlFor="isPublished" style={{ fontSize: 14, color: '#4b5563', cursor: 'pointer' }}>Hoạt động</label>
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
      </div>
    </form>
  )
}
