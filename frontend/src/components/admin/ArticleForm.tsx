import React, { useEffect, useState } from 'react'
import { ArticleDTO, CreateArticleRequest } from '../../types/article.types'
import { categoryService } from '../../services/categoryService'
import { CategoryDTO } from '../../types/category.types'
import { articleService } from '../../services/articleService'
import './ArticleForm.css'

interface Props {
  article?: ArticleDTO
  onSaved?: () => void
  onCancel?: () => void
}

export default function ArticleForm({ article, onSaved, onCancel }: Props) {
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
  const [authorId, setAuthorId] = useState('')
  const [statusCode, setStatusCode] = useState(article?.statusCode ?? 'DRAFT')
  const [publishedAt, setPublishedAt] = useState<string>(article?.publishedAt ?? '')
  const [categoryIds, setCategoryIds] = useState<string[]>([])
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

  // When editing, load the latest article data and prefill fields
  useEffect(() => {
    const loadArticle = async () => {
      if (!article?.id) return
      try {
        const full = await articleService.get(article.id)
        setTitle(full.title ?? '')
        setSlug(full.slug ?? '')
        setSummary(full.summary ?? '')
        setThumbnailUrl(full.thumbnailUrl ?? '')
        setCoverImageUrl(full.coverImageUrl ?? '')
        setDisplayType(full.displayType ?? 'STANDARD')
        setIsHomepageVisible(Boolean(full.isHomepageVisible))
        setDisplayOrder(typeof full.displayOrder === 'number' ? full.displayOrder : 0)
        setMetaTitle(full.metaTitle ?? '')
        setMetaDescription(full.metaDescription ?? '')
        // best-effort: authorId may exist on API even if not in DTO
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        setAuthorId((full as any)?.authorId ?? '')
        setStatusCode(full.statusCode ?? 'DRAFT')
        setPublishedAt(full.publishedAt ?? '')
        setContent(full.content ?? '')
        // Preselect categories: prefer categoryIds from API if available, otherwise map names/slugs
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const apiCategoryIds: string[] | undefined = (full as any)?.categoryIds
        if (Array.isArray(apiCategoryIds) && apiCategoryIds.length > 0) {
          setCategoryIds(apiCategoryIds)
        } else if (Array.isArray(full.categories) && full.categories.length > 0) {
          const names = full.categories.map(c => (c.slug ?? c.name)?.toLowerCase?.() ?? '')
          const matched = availableCategories
            .filter(c => names.includes((c.slug ?? c.name)?.toLowerCase?.() ?? ''))
            .map(c => c.id)
          if (matched.length > 0) setCategoryIds(matched)
        }
      } catch {
        // ignore; keep initial values
      }
    }
    loadArticle()
    // Re-run when availableCategories changes to attempt name/slug matching
  }, [article?.id, availableCategories])

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    try {
      // Prevent saving base64 data URLs into DB columns (causes truncation error)
      if ((thumbnailUrl && thumbnailUrl.startsWith('data:')) || (coverImageUrl && coverImageUrl.startsWith('data:'))) {
        console.warn('Attempt to save data URL into DB blocked')
        alert('Upload failed earlier so the image is a local data URL. The server likely returned 404 for the upload endpoint.\n\nDo not save data URLs into the database. Please ensure the backend upload endpoint is available so images are stored and a remote URL is returned.')
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
        statusCode,
        publishedAt,
        categoryIds
      }
      if (article) await articleService.update(article.id, payload)
      else await articleService.create(payload)
      onSaved?.()
    } finally {
      setSaving(false)
    }
  }

  return (
    <form onSubmit={submit} className="af-form">
      <div className="af-left">
        <div className="af-thumb">
          {thumbnailUrl ? <img src={thumbnailUrl} alt="thumb" /> : <div className="af-thumb-placeholder">No image</div>}
          <button type="button" className="af-upload" onClick={onSelectFile}>Upload image</button>
          <input ref={fileRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={onFileChange} />
        </div>

        <div className="af-field">
          <label>Tiêu đề bài viết</label>
          <input value={title} onChange={e => setTitle(e.target.value)} required />
        </div>

        <div className="af-field">
          <label>Đường dẫn</label>
          <input value={slug} onChange={e => setSlug(e.target.value)} placeholder="Nhập đường dẫn" />
        </div>

        <div className="af-field">
          <label>Danh mục</label>
          <div style={{ maxHeight: 180, overflow: 'auto', border: '1px solid #eee', borderRadius: 6, padding: 8 }}>
            {loadingCategories && <div>Đang tải danh mục...</div>}
            {!loadingCategories && availableCategories.length === 0 && <div>Không có danh mục</div>}
            {!loadingCategories && availableCategories.map(c => (
              <label key={c.id} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '4px 0' }}>
                <input
                  type="checkbox"
                  checked={categoryIds.includes(c.id)}
                  onChange={() => toggleCategory(c.id)}
                />
                <span>{c.name}</span>
              </label>
            ))}
          </div>
          {categoryIds.length > 0 && (
            <div style={{ marginTop: 6, fontSize: 12, color: '#666' }}>Đã chọn: {categoryIds.length}</div>
          )}
        </div>

        <div className="af-field">
          <label>Mô tả</label>
          <input value={summary} onChange={e => setSummary(e.target.value)} placeholder="Nhập mô tả" />
        </div>
      </div>

      <div className="af-right">
        <div className="af-content-toolbar">
          <select value={statusCode} onChange={e => setStatusCode(e.target.value)}>
            <option value="DRAFT">Bản nháp</option>
            <option value="PUBLISHED">Đã xuất bản</option>
          </select>
          <select value={displayType} onChange={e => setDisplayType(e.target.value)}>
            <option value="STANDARD">Chuẩn</option>
            <option value="FEATURED">Nổi bật</option>
          </select>
          <div className="af-toolbar-controls">
            <button type="button" className="ctrl">B</button>
            <button type="button" className="ctrl">I</button>
            <button type="button" className="ctrl">Link</button>
          </div>
        </div>

        <textarea className="af-content" value={content} onChange={e => setContent(e.target.value)} placeholder="Nhập nội dung" />

        <div className="af-field">
          <label>Tác giả (UUID)</label>
          <input value={authorId} onChange={e => setAuthorId(e.target.value)} placeholder="Nhập authorId" />
        </div>
        <div className="af-field">
          <label>Thời điểm xuất bản</label>
          <input type="datetime-local" value={publishedAt ? new Date(publishedAt).toISOString().slice(0,16) : ''} onChange={e => setPublishedAt(e.target.value ? new Date(e.target.value).toISOString() : '')} />
        </div>
        <div className="af-field">
          <label>Meta Title</label>
          <input value={metaTitle} onChange={e => setMetaTitle(e.target.value)} placeholder="SEO meta title" />
        </div>
        <div className="af-field">
          <label>Meta Description</label>
          <input value={metaDescription} onChange={e => setMetaDescription(e.target.value)} placeholder="SEO meta description" />
        </div>
        <div className="af-field">
          <label>Hiển thị trang chủ</label>
          <input type="checkbox" checked={isHomepageVisible} onChange={e => setIsHomepageVisible(e.target.checked)} />
        </div>
        <div className="af-field">
          <label>Thứ tự hiển thị</label>
          <input type="number" value={displayOrder} onChange={e => setDisplayOrder(Number(e.target.value))} />
        </div>

        <div className="af-actions">
          <button className="btn publish" type="submit" disabled={saving}>{saving ? 'Đang...' : 'Xuất bản'}</button>
          <button className="btn schedule" type="button" onClick={() => alert('Schedule - not implemented')}>Lên lịch</button>
          <button className="btn draft" type="button" onClick={() => { setStatusCode('DRAFT'); submit(new Event('submit') as any) }}>Lưu bản nháp</button>
        </div>
      </div>
    </form>
  )
}
