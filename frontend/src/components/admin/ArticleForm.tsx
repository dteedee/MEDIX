import React, { useEffect, useState } from 'react'
import { ArticleDTO } from '../../types/article.types'
import { categoryService } from '../../services/categoryService'
import { CategoryDTO } from '../../types/category.types'
import { articleService, ArticleFormPayload } from '../../services/articleService'
import { useToast } from '../../contexts/ToastContext'
import { CKEditor } from '@ckeditor/ckeditor5-react'
import ClassicEditor from '@ckeditor/ckeditor5-build-classic'

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
  const [thumbnailPreviewUrl, setThumbnailPreviewUrl] = useState(article?.thumbnailUrl ?? '') // For displaying preview
  const [selectedThumbnailFile, setSelectedThumbnailFile] = useState<File | null>(null) // Actual file object
  const [coverImagePreviewUrl, setCoverImagePreviewUrl] = useState(article?.coverImageUrl ?? '') // For displaying preview
  const [selectedCoverFile, setSelectedCoverFile] = useState<File | null>(null) // Actual file object
  const [displayType, setDisplayType] = useState(article?.displayType ?? 'STANDARD')
  const [isHomepageVisible, setIsHomepageVisible] = useState<boolean>(article?.isHomepageVisible ?? false)
  const [displayOrder, setDisplayOrder] = useState<number>(article?.displayOrder ?? 0)
  const [metaTitle, setMetaTitle] = useState(article?.metaTitle ?? '')
  const [metaDescription, setMetaDescription] = useState(article?.metaDescription ?? '')
  // TODO: Replace with actual logged-in user ID from AuthContext when available
  // Use a REAL user ID from your database for development until auth is ready.
  const [authorId, setAuthorId] = useState((article as any)?.authorId ?? '30AA82C5-9BB6-4DF0-ABDF-9A65892F69C8') // <-- Replace with a valid user ID from your DB
  const [statusCode, setStatusCode] = useState(article?.statusCode ?? 'DRAFT')
  const [categoryIds, setCategoryIds] = useState<string[]>(article?.categoryIds ?? [])
  const [content, setContent] = useState(article?.content ?? '')
  const [saving, setSaving] = useState(false)
  const [errors, setErrors] = useState<{ title?: string; slug?: string; summary?: string; content?: string; thumbnailUrl?: string; categoryIds?: string; displayOrder?: string }>({})
  const [validating, setValidating] = useState<{ title?: boolean; slug?: boolean }>({})
  const fileRef = React.createRef<HTMLInputElement>()

  // Helper to convert ISO string to a format suitable for datetime-local input
  const isoToLocalInput = (iso?: string | null) => {
    if (!iso) return ''
    try {
      const d = new Date(iso)
      // Check for invalid date
      if (isNaN(d.getTime())) return ''
      const pad = (n: number) => n.toString().padStart(2, '0')
      return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`
    } catch (e) {
      return ''
    }
  }

  const [publishedAt, setPublishedAt] = useState<string>(isoToLocalInput(article?.publishedAt))

  const coverFileRef = React.createRef<HTMLInputElement>()
  const [availableCategories, setAvailableCategories] = useState<CategoryDTO[]>([])
  const [loadingCategories, setLoadingCategories] = useState(false)

  const onSelectFile = () => {
    fileRef.current?.click()
  }
  const onSelectCoverFile = () => coverFileRef.current?.click()

  const onFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    const allowedTypes = ['image/png', 'image/jpeg', 'image/jpg'];
    if (!allowedTypes.includes(file.type)) {
        alert('Chỉ chấp nhận tệp PNG hoặc JPG.');
        return;
    }
    try {
      setSelectedThumbnailFile(file);
      setThumbnailPreviewUrl(URL.createObjectURL(file)); // Create a local URL for preview
      if (errors.thumbnailUrl) setErrors(prev => ({ ...prev, thumbnailUrl: undefined }));
    } catch (err) {
      console.error('Error setting thumbnail file:', err);
      showToast('Không thể chọn ảnh đại diện.', 'error');
      setSelectedThumbnailFile(null);
      setThumbnailPreviewUrl('');
    }
  }

  const onCoverFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    const allowedTypes = ['image/png', 'image/jpeg', 'image/jpg'];
    if (!allowedTypes.includes(file.type)) {
        alert('Chỉ chấp nhận tệp PNG hoặc JPG.');
        return;
    }
    try {
      setSelectedCoverFile(file);
      setCoverImagePreviewUrl(URL.createObjectURL(file)); // Create a local URL for preview
    } catch (err) {
      console.error('Error setting cover image file:', err);
      showToast('Không thể chọn ảnh bìa.', 'error');
      setSelectedCoverFile(null);
      setCoverImagePreviewUrl('');
    }
  }

  // Cleanup object URLs when component unmounts or files change
  useEffect(() => {
    return () => {
      if (thumbnailPreviewUrl && thumbnailPreviewUrl.startsWith('blob:')) URL.revokeObjectURL(thumbnailPreviewUrl);
      if (coverImagePreviewUrl && coverImagePreviewUrl.startsWith('blob:')) URL.revokeObjectURL(coverImagePreviewUrl);
    };
  }, [thumbnailPreviewUrl, coverImagePreviewUrl]);

  useEffect(() => {
    const loadCategories = async () => {
      setLoadingCategories(true)
      try {
        const r = await categoryService.list(1, 1000)
        // Chỉ hiển thị các danh mục đang hoạt động
        setAvailableCategories(r.items?.filter(c => c.isActive) ?? [])
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
      setThumbnailPreviewUrl(article.thumbnailUrl ?? '') // Set existing URL for preview
      setSelectedThumbnailFile(null); // No new file selected initially
      setCoverImagePreviewUrl(article.coverImageUrl ?? '') // Set existing URL for preview
      setSelectedCoverFile(null); // No new file selected initially
      setDisplayType(article.displayType ?? 'STANDARD')
      setIsHomepageVisible(Boolean(article.isHomepageVisible))
      setDisplayOrder(typeof article.displayOrder === 'number' ? article.displayOrder : 0)
      setMetaTitle(article.metaTitle ?? '')
      setMetaDescription(article.metaDescription ?? '')
      setStatusCode(article.statusCode ?? 'DRAFT')
      setPublishedAt(isoToLocalInput(article.publishedAt))
      setContent(article.content ?? '')
      // Handle category IDs. Prefer `categoryIds` if available.
      if (article.categoryIds && article.categoryIds.length > 0) {
        setCategoryIds(article.categoryIds);
      } else if (article.categories && article.categories.length > 0) {
        // If categories have IDs, use them directly.
        if (article.categories[0].id) {
          setCategoryIds(article.categories.map(c => c.id));
        } else {
          // Fallback: if categories only have names (no IDs), find their IDs from the available list.
          const namesToMatch = article.categories.map(c => c.name);
          const matchingIds = availableCategories
            .filter(ac => namesToMatch.includes(ac.name))
            .map(ac => ac.id);
          setCategoryIds(matchingIds);
        }
      }
    }
  }, [article, availableCategories])

  // Auto-generate slug from title if slug is empty
  useEffect(() => {
    if (!slug && title) {
      const generatedSlug = title.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/đ/g, "d").replace(/[^a-z0-9\s-]/g, '').trim().replace(/\s+/g, '-');
      setSlug(generatedSlug);
    }
  }, [title]);

  // const validateField = async (field: 'title' | 'slug', value: string) => {
  //   // Don't validate if the value hasn't changed from the initial value, or if it's empty
  //   if (value === (article?.[field] ?? '') || !value) {
  //     return
  //   }

  //   setValidating(prev => ({ ...prev, [field]: true }))
  //   setErrors(prev => ({ ...prev, [field]: undefined })) // Clear previous error

  //   try {
  //     // We assume articleService has a new method for this.
  //     // You will need to implement this in your service and the corresponding backend endpoint.
  //     await articleService.checkUniqueness(field, value, article?.id)
  //   } catch (error: any) {
  //     const message = error?.response?.data?.message || `Trường này không được phép trùng.`
  //     setErrors(prev => ({ ...prev, [field]: message }))
  //   } finally {
  //     setValidating(prev => ({ ...prev, [field]: false }))
  //   }
  // }

  // Store initial values to compare on blur
  const initialTitle = React.useRef(article?.title ?? '').current;
  const initialSlug = React.useRef(article?.slug ?? '').current;

  const validateOnBlur = (field: 'title' | 'slug' | 'summary' | 'content', value: string) => {
    // Only validate for emptiness on blur
    if (!value.trim()) {
      let message = 'Trường này không được để trống.';
      if (field === 'title') message = 'Tiêu đề không được để trống.';
      if (field === 'slug') message = 'Đường dẫn (slug) không được để trống.';
      if (field === 'summary') message = 'Tóm tắt không được để trống.';
      if (field === 'content') message = 'Nội dung không được để trống.';
      setErrors(prev => ({ ...prev, [field]: message }));
    }
    // The onChange handler already clears the error, so no need for an else clause here.
  };

  const submit = async (e: React.FormEvent | null, overrideStatusCode?: string) => {
    e?.preventDefault()

    // --- Validation ---
    const newErrors: typeof errors = {};
    if (!title.trim()) newErrors.title = "Tiêu đề không được để trống.";
    if (!slug.trim()) newErrors.slug = "Đường dẫn (slug) không được để trống.";
    if (!summary.trim()) newErrors.summary = "Tóm tắt không được để trống.";
    if (!content.trim()) newErrors.content = "Nội dung không được để trống.";
    if (!thumbnailPreviewUrl && !selectedThumbnailFile) newErrors.thumbnailUrl = "Ảnh đại diện không được để trống.";
    if (categoryIds.length === 0) newErrors.categoryIds = "Vui lòng chọn ít nhất một danh mục.";
    
    // Check for existing async validation errors
    if (errors.displayOrder) {
      alert('Vui lòng sửa các lỗi đã báo trước khi lưu.');
      return;
    }

    setErrors(newErrors);
    if (Object.keys(newErrors).length > 0) {
        alert('Vui lòng điền đầy đủ các trường bắt buộc.');
        return;
    }
    setSaving(true)
    try {
      const finalStatusCode = overrideStatusCode ?? statusCode;
      // Re-validate thumbnail on submit
      if (!selectedThumbnailFile && !thumbnailPreviewUrl) {
        setErrors(prev => ({ ...prev, thumbnailUrl: "Ảnh đại diện không được để trống." }));
        alert('Vui lòng điền đầy đủ các trường bắt buộc.');
        setSaving(false);
        return;
      }

      const payload: ArticleFormPayload = {
        title,
        slug,
        summary,
        content,
        displayType,
        thumbnailUrl: selectedThumbnailFile ? undefined : (thumbnailPreviewUrl || undefined), // Send existing URL if no new file
        coverImageUrl: selectedCoverFile ? undefined : (coverImagePreviewUrl || undefined), // Send existing URL if no new file
        isHomepageVisible,
        displayOrder,
        metaTitle,
        metaDescription,
        authorId,
        statusCode: finalStatusCode,
        // If status is PUBLISHED and no date is set, publish now.
        // Otherwise, use the selected date.
        publishedAt: finalStatusCode === 'PUBLISHED' && !publishedAt 
          ? new Date().toISOString() 
          : (publishedAt ? new Date(publishedAt).toISOString() : undefined),
        categoryIds: categoryIds,
        thumbnailFile: selectedThumbnailFile || undefined, // Pass the File object
        coverFile: selectedCoverFile || undefined, // Pass the File object
      }
      if (article) await articleService.update(article.id, payload)
      else await articleService.create(payload)
      showToast(article ? 'Cập nhật bài viết thành công!' : 'Tạo bài viết thành công!', 'success')
      onSaved?.()
    } catch (error: any) {
      console.error('Error saving article:', error)
      // Xử lý lỗi từ server và hiển thị inline
      const serverErrors = error?.response?.data?.errors
      if (serverErrors) {
        const newErrors: { title?: string; slug?: string } = {}
        if (serverErrors.Title) newErrors.title = serverErrors.Title[0]
        if (serverErrors.Slug) newErrors.slug = serverErrors.Slug[0]
        setErrors(newErrors)
      } else {
        // Fallback cho các lỗi không xác định
        showToast('Đã xảy ra lỗi không mong muốn. Vui lòng thử lại.', 'error')
      }
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
  const errorTextStyle: React.CSSProperties = {
    color: '#ef4444',
    fontSize: 13,
    marginTop: 6,
  }

  const validatingTextStyle: React.CSSProperties = {
    color: '#6b7280',
    fontSize: 13,
    marginTop: 6,
  }


  return (
    <form onSubmit={(e) => submit(e)} style={formContainerStyle}>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '32px' }}>
        {/* Left Column */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          <div>
            <label style={labelStyle}>Ảnh đại diện</label>
            <div style={{ width: '100%', aspectRatio: '16/9', background: '#f0f2f5', borderRadius: 8, overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative', border: `1px dashed ${errors.thumbnailUrl ? '#ef4444' : '#d1d5db'}` }}>
              {thumbnailPreviewUrl ? <img src={thumbnailPreviewUrl} alt="thumb" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : <span style={{ fontSize: 14, color: '#6b7280' }}>Chưa có ảnh</span>}
            </div>
            <button type="button" onClick={onSelectFile} style={{ width: '100%', marginTop: 12, padding: '10px', border: '1px solid #d1d5db', borderRadius: 8, background: '#fff', cursor: 'pointer', fontWeight: 500 }}>
              Tải ảnh lên
            </button>
            <input ref={fileRef} type="file" accept="image/png, image/jpeg" style={{ display: 'none' }} onChange={(e) => {
                onFileChange(e);
                if (errors.thumbnailUrl) setErrors(prev => ({ ...prev, thumbnailUrl: undefined }));
            }} />
            {errors.thumbnailUrl && <div style={errorTextStyle}>{errors.thumbnailUrl}</div>}
          </div>

          <div>
            <label style={labelStyle}>Ảnh bìa (Cover Image)</label>
            <div style={{ width: '100%', aspectRatio: '16/9', background: '#f0f2f5', borderRadius: 8, overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative', border: '1px dashed #d1d5db' }}>
              {coverImagePreviewUrl ? <img src={coverImagePreviewUrl} alt="cover" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : <span style={{ fontSize: 14, color: '#6b7280' }}>Chưa có ảnh</span>}
            </div>
            <button type="button" onClick={onSelectCoverFile} style={{ width: '100%', marginTop: 12, padding: '10px', border: '1px solid #d1d5db', borderRadius: 8, background: '#fff', cursor: 'pointer', fontWeight: 500 }}>
              Tải ảnh bìa
            </button>
          </div>
          <input ref={coverFileRef} type="file" accept="image/png, image/jpeg, image/jpg" style={{ display: 'none' }} onChange={onCoverFileChange} />

          <div>
            <label style={labelStyle}>Danh mục</label>
            
            <div style={{ maxHeight: 200, overflowY: 'auto', border: '1px solid', borderColor: errors.categoryIds ? '#ef4444' : '#d1d5db', borderRadius: 8, padding: '8px 12px' }}>
              {loadingCategories && <div>Đang tải...</div>}
              {!loadingCategories && availableCategories.map(c => (
                <label key={c.id} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '6px 0', cursor: 'pointer', fontSize: 14 }}>
                  <input type="checkbox" checked={categoryIds.includes(c.id)} onChange={() => {
                      toggleCategory(c.id);
                      if (errors.categoryIds) setErrors(prev => ({ ...prev, categoryIds: undefined }));
                  }} />
                  <span>{c.name}</span>
                </label>
              ))}
              
            </div>
          </div>

          <div>
            <label style={labelStyle}>Thứ tự hiển thị</label>
            <input 
              type="number" 
              value={displayOrder} 
              onChange={e => {
                const num = Number(e.target.value);
                setDisplayOrder(num);
                if (num < 0) {
                  setErrors(prev => ({ ...prev, displayOrder: 'Thứ tự hiển thị phải lớn hơn hoặc bằng 0.' }));
                } else {
                  setErrors(prev => ({ ...prev, displayOrder: undefined }));
                }
              }} 
              style={{...inputStyle, borderColor: errors.displayOrder ? '#ef4444' : '#d1d5db'}}
              min="0"
            />
            {errors.displayOrder && <div style={errorTextStyle}>{errors.displayOrder}</div>}
          </div>
        </div>

        {/* Right Column */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          <div>
            <label style={labelStyle}>Tiêu đề bài viết</label>
            <input
              value={title}
              onChange={e => {
                setTitle(e.target.value)
                if (errors.title) setErrors(prev => ({ ...prev, title: undefined }))
              }}
              required
              onBlur={(e) => validateOnBlur('title', e.target.value)}
              style={{ ...inputStyle, borderColor: errors.title ? '#ef4444' : '#d1d5db' }}
            />
            {errors.title && <div style={errorTextStyle}>{errors.title}</div>}
            {validating.title && <div style={validatingTextStyle}>Đang kiểm tra...</div>}
          </div>
          <div>
            <label style={labelStyle}>Đường dẫn (Slug)</label>
            <input value={slug} onChange={e => {
              setSlug(e.target.value)
              if (errors.slug) setErrors(prev => ({ ...prev, slug: undefined }))
            }}
            onBlur={(e) => validateOnBlur('slug', e.target.value)}
            placeholder="Tự động tạo nếu để trống"
            style={{ ...inputStyle, borderColor: errors.slug ? '#ef4444' : '#d1d5db' }} />
            {errors.slug && <div style={errorTextStyle}>{errors.slug}</div>}
            {validating.slug && <div style={validatingTextStyle}>Đang kiểm tra...</div>}
          </div>
          <div>
            <label style={labelStyle}>Tóm tắt</label>
            <textarea value={summary} onChange={e => {
              setSummary(e.target.value);
              if (errors.summary) setErrors(prev => ({ ...prev, summary: undefined }));
            }} onBlur={(e) => validateOnBlur('summary', e.target.value)} style={{ ...inputStyle, minHeight: '80px', fontFamily: 'inherit', borderColor: errors.summary ? '#ef4444' : '#d1d5db' }} />
            {errors.summary && <div style={errorTextStyle}>{errors.summary}</div>}
          </div>
          <div>
            <label style={labelStyle}>Nội dung</label>
            <div style={{ border: `1px solid ${errors.content ? '#ef4444' : '#d1d5db'}`, borderRadius: 8, overflow: 'hidden', minHeight: 300 }}>
              <CKEditor
                editor={ClassicEditor}
                data={content}
                onChange={(event, editor) => {
                  const data = editor.getData()
                  setContent(data)
                  if (errors.content) setErrors(prev => ({ ...prev, content: undefined }))
                }}
                onBlur={(event, editor) => {
                  validateOnBlur('content', editor.getData())
                }}
              />
            </div>
            {errors.content && <div style={errorTextStyle}>{errors.content}</div>}
          </div>
          

          {/* Status & Display Section - MOVED HERE */}
          <div style={{ borderTop: '1px solid #e5e7eb', paddingTop: '24px' }}>
            <h3 style={{ marginTop: 0, marginBottom: '16px', fontSize: '1rem' }}>Trạng thái & Hiển thị</h3>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
                <select value={statusCode} onChange={e => setStatusCode(e.target.value)} style={inputStyle}>
                  <option value="DRAFT">Bản nháp</option>
                  
                  <option value="PUBLISHED">Xuất bản</option>
                  <option value="ARCHIVE">Khóa</option>
                </select>
                <select value={displayType} onChange={e => setDisplayType(e.target.value)} style={inputStyle}>
                  <option value="STANDARD">Tiêu chuẩn</option>
                  <option value="FEATURED">Nổi bật</option>
                </select>
                <div style={{ gridColumn: '1 / -1', display: 'flex', alignItems: 'center', gap: '16px' }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 14, cursor: 'pointer' }}>
                    <input type="checkbox" checked={isHomepageVisible} onChange={e => setIsHomepageVisible(e.target.checked)} style={{ width: 16, height: 16 }} />
                    Hiển thị trang chủ
                  </label>
                </div>
               
            </div>
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
        
        <button type="submit" disabled={saving} style={{ ...buttonStyle, background: saving ? '#9ca3af' : '#2563eb', color: '#fff' }}>
          {saving ? 'Đang lưu...' : 'Lưu'}
        </button>
      </div>
    </form>
  )
}
