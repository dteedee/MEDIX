import React, { useEffect, useState } from 'react'
import { ArticleDTO, CreateArticleRequest } from '../../types/article.types'
import { categoryService } from '../../services/categoryService'
import { CategoryDTO } from '../../types/category.types'
import { articleService } from '../../services/articleService'
import { useToast } from '../../contexts/ToastContext'

interface Props {
  article?: ArticleDTO
  onSaved?: () => void
  onCancel?: () => void
}

export default function ArticleForm({ article, onSaved, onCancel }: Props) {
  const { showToast } = useToast()
  const [title, setTitle] = useState(article?.title ?? '')
  const [slug, setSlug] = useState(article?.slug ?? '')
  const [summary, setSummary] = useState(article?.summary ?? '')
  const [thumbnailUrl, setThumbnailUrl] = useState(article?.thumbnailUrl ?? '')
  const [coverImageUrl, setCoverImageUrl] = useState(article?.coverImageUrl ?? '')
  const [displayType, setDisplayType] = useState(article?.displayType ?? 'STANDARD')
  const [isHomepageVisible, setIsHomepageVisible] = useState<boolean>(article?.isHomepageVisible ?? false)
  const [displayOrder, setDisplayOrder] = useState<number>(article?.displayOrder ?? 0)
  const [metaTitle, setMetaTitle] = useState(article?.metaTitle ?? '')
  const [metaDescription, setMetaDescription] = useState(article?.metaDescription ?? '')
  // TODO: Replace with actual logged-in user ID from AuthContext when available
  // Use a REAL user ID from your database for development until auth is ready.
  const [authorId, setAuthorId] = useState('1A2C1A65-7B00-415F-8164-4FC3C1054203') // <-- Replace with a valid user ID from your DB
  const [statusCode, setStatusCode] = useState(article?.statusCode ?? 'DRAFT')
  const [publishedAt, setPublishedAt] = useState<string>(article?.publishedAt ?? '')
  const [categoryIds, setCategoryIds] = useState<string[]>(article?.categoryIds ?? [])
  const [content, setContent] = useState(article?.content ?? '')
  const [saving, setSaving] = useState(false)
  const fileRef = React.createRef<HTMLInputElement>()
  const [availableCategories, setAvailableCategories] = useState<CategoryDTO[]>([])
  const [loadingCategories, setLoadingCategories] = useState(false)

  const onSelectFile = () => {
    fileRef.current?.click()
  }

  const onFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0]
    if (!f) return
    try {
      const url = await articleService.uploadImage(f)
      setThumbnailUrl(url)
    } catch (err) {
      console.error('Upload failed', err)
      alert('Upload failed')
    }
  }

  useEffect(() => {
    const loadCategories = async () => {
      setLoadingCategories(true)
      try {
        const r = await categoryService.list(1, 1000)
        setAvailableCategories(r.items ?? [])
      } finally {
        setLoadingCategories(false)
      }
    }
    loadCategories()
  }, [])

  const toggleCategory = (id: string) => {
    setCategoryIds(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id])
  }

  // When the article prop changes (e.g., data is loaded by the parent page),
  // update the form's internal state to reflect the new data.
  useEffect(() => {
    if (article) {
      setTitle(article.title ?? '')
      setSlug(article.slug ?? '')
      setSummary(article.summary ?? '')
      setThumbnailUrl(article.thumbnailUrl ?? '')
      setCoverImageUrl(article.coverImageUrl ?? '')
      setDisplayType(article.displayType ?? 'STANDARD')
      setIsHomepageVisible(Boolean(article.isHomepageVisible))
      setDisplayOrder(typeof article.displayOrder === 'number' ? article.displayOrder : 0)
      setMetaTitle(article.metaTitle ?? '')
      setMetaDescription(article.metaDescription ?? '')
      setStatusCode(article.statusCode ?? 'DRAFT')
      setPublishedAt(article.publishedAt ?? '')
      setContent(article.content ?? '')
      // This is the key part for fixing the category selection
      setCategoryIds(article.categoryIds ?? [])
    }
  }, [article])

  // Auto-generate slug from title if slug is empty
  useEffect(() => {
    if (!slug && title) {
      const generatedSlug = title.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/đ/g, "d").replace(/[^a-z0-9\s-]/g, '').trim().replace(/\s+/g, '-');
      setSlug(generatedSlug);
    }
  }, [title]);

  const submit = async (e: React.FormEvent | null, overrideStatusCode?: string) => {
    e?.preventDefault()
    setSaving(true)
    try {
      const finalStatusCode = overrideStatusCode ?? statusCode;
      // Prevent saving base64 data URLs into DB columns (causes truncation error)
      if ((thumbnailUrl && thumbnailUrl.startsWith('data:')) || (coverImageUrl && coverImageUrl.startsWith('data:'))) {
        console.warn('Attempt to save data URL into DB blocked')
        alert('Upload failed earlier so the image is a local data URL. The server likely returned 404 for the upload endpoint.\n\nDo not save data URLs into the database. Please ensure the backend upload endpoint is available so images are stored and a remote URL is returned.')
        setSaving(false)
        return
      }
      if (categoryIds.length === 0) {
        alert('Vui lòng chọn ít nhất một danh mục cho bài viết.')
        setSaving(false)
        return
      }
      const payload: CreateArticleRequest = {
        title,
        slug,
        summary,
        content,
        displayType,
        thumbnailUrl,
        coverImageUrl,
        isHomepageVisible,
        displayOrder,
        metaTitle,
        metaDescription,
        authorId,
        statusCode: finalStatusCode,
        publishedAt: publishedAt || undefined,
        categoryIds
      }
      if (article) await articleService.update(article.id, payload)
      else await articleService.create(payload)
      onSaved?.()
    } catch (error) {
      console.error('Error saving article:', error)
      // Giả định lỗi là do slug trùng lặp theo yêu cầu.
      showToast('Slug không được phép trùng', 'error')
    } finally {
      setSaving(false)
    }
  }

  // --- CSS Styles ---
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
  }
  const buttonStyle: React.CSSProperties = {
    padding: '10px 20px',
    borderRadius: 8,
    border: 'none',
    fontWeight: 600,
    cursor: 'pointer',
  }

  return (
    <form onSubmit={(e) => submit(e)} style={formContainerStyle}>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '32px' }}>
        {/* Left Column */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          <div>
            <label style={labelStyle}>Ảnh đại diện</label>
            <div style={{ width: '100%', aspectRatio: '16/9', background: '#f0f2f5', borderRadius: 8, overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative', border: '1px dashed #d1d5db' }}>
              {thumbnailUrl ? <img src={thumbnailUrl} alt="thumb" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : <span style={{ fontSize: 14, color: '#6b7280' }}>Chưa có ảnh</span>}
            </div>
            <button type="button" onClick={onSelectFile} style={{ width: '100%', marginTop: 12, padding: '10px', border: '1px solid #d1d5db', borderRadius: 8, background: '#fff', cursor: 'pointer', fontWeight: 500 }}>
              Tải ảnh lên
            </button>
          </div>
          <input ref={fileRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={onFileChange} />

          <div>
            <label style={labelStyle}>Trạng thái & Hiển thị</label>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', background: '#f9fafb', padding: '16px', borderRadius: 8 }}>
              <select value={statusCode} onChange={e => setStatusCode(e.target.value)} style={inputStyle}>
                <option value="DRAFT">DRAFT</option>
                <option value="PUBLISHED">PUBLISHED</option>
              </select>
              <select value={displayType} onChange={e => setDisplayType(e.target.value)} style={inputStyle}>
                <option value="STANDARD">STANDARD</option>
                <option value="FEATURED">FEATURED</option>
              </select>
              <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 14, cursor: 'pointer' }}>
                <input type="checkbox" checked={isHomepageVisible} onChange={e => setIsHomepageVisible(e.target.checked)} style={{ width: 16, height: 16 }} />
                Hiển thị trang chủ
              </label>
            </div>
          </div>

          <div>
            <label style={labelStyle}>Danh mục</label>
            <div style={{ maxHeight: 200, overflowY: 'auto', border: '1px solid #d1d5db', borderRadius: 8, padding: '8px 12px' }}>
              {loadingCategories && <div>Đang tải...</div>}
              {!loadingCategories && availableCategories.map(c => (
                <label key={c.id} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '6px 0', cursor: 'pointer', fontSize: 14 }}>
                  <input type="checkbox" checked={categoryIds.includes(c.id)} onChange={() => toggleCategory(c.id)} />
                  <span>{c.name}</span>
                </label>
              ))}
            </div>
          </div>

          <div>
            <label style={labelStyle}>Thứ tự hiển thị</label>
            <input type="number" value={displayOrder} onChange={e => setDisplayOrder(Number(e.target.value))} style={inputStyle} />
          </div>
        </div>

        {/* Right Column */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          <div>
            <label style={labelStyle}>Tiêu đề bài viết</label>
            <input value={title} onChange={e => setTitle(e.target.value)} required style={inputStyle} />
          </div>
          <div>
            <label style={labelStyle}>Đường dẫn (Slug)</label>
            <input value={slug} onChange={e => setSlug(e.target.value)} placeholder="Tự động tạo nếu để trống" style={inputStyle} />
          </div>
          <div>
            <label style={labelStyle}>Tóm tắt</label>
            <textarea value={summary} onChange={e => setSummary(e.target.value)} style={{ ...inputStyle, minHeight: '80px', fontFamily: 'inherit' }} />
          </div>
          <div>
            <label style={labelStyle}>Nội dung</label>
            <textarea value={content} onChange={e => setContent(e.target.value)} placeholder="Nhập nội dung bài viết..." style={{ ...inputStyle, minHeight: '300px', fontFamily: 'inherit' }} />
          </div>
          <div style={{ borderTop: '1px solid #e5e7eb', paddingTop: '24px' }}>
            <h3 style={{ marginTop: 0, marginBottom: '16px', fontSize: '1rem' }}>Cấu hình SEO</h3>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
              <div>
                <label style={labelStyle}>Meta Title</label>
                <input value={metaTitle} onChange={e => setMetaTitle(e.target.value)} style={inputStyle} />
              </div>
              <div>
                <label style={labelStyle}>Meta Description</label>
                <input value={metaDescription} onChange={e => setMetaDescription(e.target.value)} style={inputStyle} />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Actions */}
      <div style={{ marginTop: 32, display: 'flex', justifyContent: 'flex-end', gap: 12, borderTop: '1px solid #e5e7eb', paddingTop: 24 }}>
        <button type="button" onClick={onCancel} style={{ ...buttonStyle, background: '#fff', color: '#374151', border: '1px solid #d1d5db' }}>
          Hủy
        </button>
        <button type="button" onClick={() => submit(null, 'DRAFT')} disabled={saving} style={{ ...buttonStyle, background: '#f9fafb', color: '#374151', border: '1px solid #d1d5db' }}>
          {saving ? 'Đang lưu...' : 'Lưu bản nháp'}
        </button>
        <button type="submit" disabled={saving} style={{ ...buttonStyle, background: saving ? '#9ca3af' : '#2563eb', color: '#fff' }}>
          {saving ? 'Đang lưu...' : 'Lưu & Xuất bản'}
        </button>
      </div>
    </form>
  )
}
