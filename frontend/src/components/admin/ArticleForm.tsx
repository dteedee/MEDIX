import React, { useState, useEffect } from 'react'
import { ArticleDTO, CreateArticleRequest, UpdateArticleRequest } from '../../types/article.types'
import { CategoryDTO } from '../../types/category.types'
import { articleService } from '../../services/articleService'
<<<<<<< HEAD
import { categoryService } from '../../services/categoryService'
import './AdminForm.css'
=======
>>>>>>> NEW-Manager-User

interface Props {
  article?: ArticleDTO
  onSaved?: () => void
  onCancel?: () => void
}

export default function ArticleForm({ article, onSaved, onCancel }: Props) {
  const [formData, setFormData] = useState({
    title: '',
    slug: '',
    summary: '',
    content: '',
    thumbnailUrl: '',
    coverImageUrl: '',
    statusCode: 'DRAFT',
    categoryIds: [] as string[],
  })
  const [allCategories, setAllCategories] = useState<CategoryDTO[]>([])
  const [saving, setSaving] = useState(false)
  const [errors, setErrors] = useState<Partial<Record<keyof typeof formData, string>>>({})
  const isEditMode = Boolean(article?.id)

  useEffect(() => {
    let isMounted = true;
    async function loadData() {
      // Load categories for selection
      const categoriesResponse = await categoryService.list(1, 200);
      if (!isMounted) return;
      const loadedCategories = categoriesResponse.items;
      setAllCategories(loadedCategories);

      if (article) {
        const articleCategoryNames = article.categories?.map(c => c.name) ?? [];
        const articleCategoryIds = loadedCategories
          .filter(c => articleCategoryNames.includes(c.name))
          .map(c => c.id);

        setFormData({
          title: article.title ?? '',
          slug: article.slug ?? '',
          summary: article.summary ?? '',
          content: article.content ?? '',
          thumbnailUrl: article.thumbnailUrl ?? '',
          coverImageUrl: article.coverImageUrl ?? '',
          statusCode: article.statusCode ?? 'DRAFT',
          categoryIds: articleCategoryIds,
        });
      }
    }

    loadData();

    return () => {
      isMounted = false;
    };
  }, [article]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target

    if (type === 'select-multiple') {
      const options = (e.target as HTMLSelectElement).options
      const selectedIds: string[] = []
      for (let i = 0; i < options.length; i++) {
        if (options[i].selected) {
          selectedIds.push(options[i].value)
        }
      }
      setFormData(prev => ({ ...prev, [name]: selectedIds }))
    } else {
      setFormData(prev => ({ ...prev, [name]: value }))
    }
  }

  const validateForm = (): boolean => {
    const newErrors: Partial<Record<keyof typeof formData, string>> = {}
    if (!formData.title.trim()) newErrors.title = 'Tiêu đề là bắt buộc.'
    if (!formData.slug.trim()) newErrors.slug = 'Đường dẫn (slug) là bắt buộc.'
    if (formData.thumbnailUrl) {
      try { new URL(formData.thumbnailUrl) } catch (_) { newErrors.thumbnailUrl = 'URL ảnh thu nhỏ không hợp lệ.' }
    }
    if (formData.coverImageUrl) {
      try { new URL(formData.coverImageUrl) } catch (_) { newErrors.coverImageUrl = 'URL ảnh bìa không hợp lệ.' }
    }
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!validateForm()) return
    setSaving(true)
    try {
      const payload = { ...formData }
      if (isEditMode) {
        await articleService.update(article!.id, payload as UpdateArticleRequest)
      } else {
        // TODO: Cần lấy authorId của người dùng đang đăng nhập
        const createPayload = { ...payload, authorId: '1A2C1A65-7B00-415F-8164-4FC3C1054203' } // ID User tạm thời
        await articleService.create(createPayload as CreateArticleRequest)
      }
      onSaved?.()
    } catch (error: any) {
      const serverErrors = error?.response?.data?.errors;
      if (serverErrors) setErrors(serverErrors);
      console.error("Failed to save article:", error)
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
<<<<<<< HEAD
    <form onSubmit={submit}>
      <div className="form-grid">
        <div className="form-group">
          <label htmlFor="title" className="form-label">Tiêu đề</label>
          <input id="title" name="title" type="text" className={`form-input ${errors.title ? 'is-invalid' : ''}`} value={formData.title} onChange={handleChange} />
          {errors.title && <div className="form-error">{errors.title}</div>}
        </div>
        <div className="form-group">
          <label htmlFor="slug" className="form-label">Đường dẫn (Slug)</label>
          <input id="slug" name="slug" type="text" className={`form-input ${errors.slug ? 'is-invalid' : ''}`} value={formData.slug} onChange={handleChange} />
          {errors.slug && <div className="form-error">{errors.slug}</div>}
        </div>
        <div className="form-group" style={{ gridColumn: 'span 2' }}>
          <label htmlFor="summary" className="form-label">Tóm tắt</label>
          <textarea id="summary" name="summary" className={`form-input ${errors.summary ? 'is-invalid' : ''}`} value={formData.summary} onChange={handleChange} rows={3}></textarea>
          {errors.summary && <div className="form-error">{errors.summary}</div>}
        </div>
        <div className="form-group" style={{ gridColumn: 'span 2' }}>
          <label htmlFor="content" className="form-label">Nội dung</label>
          <textarea id="content" name="content" className={`form-input ${errors.content ? 'is-invalid' : ''}`} value={formData.content} onChange={handleChange} rows={10}></textarea>
          {errors.content && <div className="form-error">{errors.content}</div>}
        </div>
        <div className="form-group">
          <label htmlFor="thumbnailUrl" className="form-label">Ảnh thu nhỏ (Thumbnail URL)</label>
          <input id="thumbnailUrl" name="thumbnailUrl" type="url" className={`form-input ${errors.thumbnailUrl ? 'is-invalid' : ''}`} value={formData.thumbnailUrl} onChange={handleChange} />
          {errors.thumbnailUrl && <div className="form-error">{errors.thumbnailUrl}</div>}
        </div>
        <div className="form-group">
          <label htmlFor="coverImageUrl" className="form-label">Ảnh bìa (Cover URL)</label>
          <input id="coverImageUrl" name="coverImageUrl" type="url" className={`form-input ${errors.coverImageUrl ? 'is-invalid' : ''}`} value={formData.coverImageUrl} onChange={handleChange} />
          {errors.coverImageUrl && <div className="form-error">{errors.coverImageUrl}</div>}
        </div>
        <div className="form-group">
          <label htmlFor="categoryIds" className="form-label">Danh mục</label>
          <select
            id="categoryIds"
            name="categoryIds"
            multiple
            className="form-select"
            value={formData.categoryIds}
            onChange={handleChange}
            style={{ height: '150px' }}
          >
            {allCategories.map(c => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
        </div>
        <div className="form-group">
          <label htmlFor="statusCode" className="form-label">Trạng thái</label>
          <select id="statusCode" name="statusCode" className="form-select" value={formData.statusCode} onChange={handleChange}>
            <option value="DRAFT">Bản nháp</option>
            <option value="PUBLISHED">Xuất bản</option>
            <option value="ARCHIVED">Lưu trữ</option>
          </select>
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
                <option value="DRAFT">Bản nháp</option>
                <option value="PUBLISHED">Đã xuất bản</option>
              </select>
              <select value={displayType} onChange={e => setDisplayType(e.target.value)} style={inputStyle}>
                <option value="STANDARD">Chuẩn</option>
                <option value="FEATURED">Nổi bật</option>
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
>>>>>>> NEW-Manager-User
      </div>
    </form>
  )
}