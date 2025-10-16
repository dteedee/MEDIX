import React, { useState, useEffect } from 'react'
import { ArticleDTO, CreateArticleRequest, UpdateArticleRequest } from '../../types/article.types'
import { CategoryDTO } from '../../types/category.types'
import { articleService } from '../../services/articleService'
import { categoryService } from '../../services/categoryService'
import './AdminForm.css'

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

  return (
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
      </div>
    </form>
  )
}