import React, { useEffect, useState } from 'react'
import { CmsPageDTO, CreateCmsPageRequest } from '../../types/cmspage.types'
import { cmspageService } from '../../services/cmspageService'
import { useToast } from '../../contexts/ToastContext'
import formStyles from '../../styles/manager/Form.module.css'
import styles from '../../styles/manager/CmsPageForm.module.css'

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
  const [authorId, setAuthorId] = useState<string>((page as any)?.authorId ?? '30aa82c5-9bb6-4df0-abdf-9a65892f69c8') // <-- Replace with a valid user ID from your DB
  const [saving, setSaving] = useState(false)
  const [errors, setErrors] = useState<{ pageTitle?: string, pageSlug?: string, pageContent?: string }>({})

  const validateOnBlur = (field: 'pageTitle' | 'pageSlug' | 'pageContent', value: string) => {
    if (!value.trim()) {
      let message = 'Trường này không được để trống.';
      if (field === 'pageTitle') message = 'Tiêu đề trang không được để trống.';
      if (field === 'pageSlug') message = 'Đường dẫn (Slug) không được để trống.';
      if (field === 'pageContent') message = 'Nội dung không được để trống.';
      setErrors(prev => ({ ...prev, [field]: message }));
    }
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()

    const newErrors: typeof errors = {};
    if (!title.trim()) newErrors.pageTitle = "Tiêu đề trang không được để trống.";
    if (!slug.trim()) newErrors.pageSlug = "Đường dẫn (Slug) không được để trống.";
    if (!content.trim()) newErrors.pageContent = "Nội dung không được để trống.";
    setErrors(newErrors);
    if (Object.keys(newErrors).length > 0) {
        showToast('Vui lòng điền đầy đủ các trường bắt buộc.', 'error');
        return;
    }

    setSaving(true)
    try {
      const payload: CreateCmsPageRequest = {
        pageTitle: title.trim(),
        pageSlug: slug.trim(),
        pageContent: content.trim(),
        metaTitle: metaTitle.trim(),
        metaDescription: metaDescription.trim(),
        isPublished,
        publishedAt: isPublished ? new Date().toISOString() : undefined,
        authorId
      } as any // Cast to allow undefined for optional fields
      if (page) await cmspageService.update(page.id, payload as any)
      else await cmspageService.create(payload)
      onSaved?.()
    } catch (error: any) {
      console.error('Error saving CMS page:', error);
      // Xử lý lỗi validation từ backend
      const backendErrors = { pageTitle: error.PageTitle, pageSlug: error.PageSlug };
      setErrors(prev => ({ ...prev, ...backendErrors }));
      showToast('Lưu trang thất bại, vui lòng kiểm tra lại thông tin.', 'error');
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

  return (
    <form onSubmit={submit} className={formStyles.formContainer}>
      <div className={styles.grid}>
        <div className={styles.fullWidth}>
          <label className={formStyles.label}>Tiêu đề trang</label>
          <input 
            value={title} 
            onChange={e => { setTitle(e.target.value); if (errors.pageTitle) setErrors(prev => ({ ...prev, pageTitle: undefined })); }} 
            onBlur={e => validateOnBlur('pageTitle', e.target.value)}
            required 
            className={`${formStyles.input} ${errors.pageTitle ? formStyles.inputError : ''}`}
          />
          {errors.pageTitle && <div className={formStyles.errorText}>{errors.pageTitle}</div>}
        </div>
        <div className={styles.fullWidth}>
          <label className={formStyles.label}>Đường dẫn (Slug)</label>
          <input 
            value={slug} 
            onChange={e => { setSlug(e.target.value); if (errors.pageSlug) setErrors(prev => ({ ...prev, pageSlug: undefined })); }} 
            onBlur={e => validateOnBlur('pageSlug', e.target.value)}
            required
            className={`${formStyles.input} ${errors.pageSlug ? formStyles.inputError : ''}`}
          />
          {errors.pageSlug && <div className={formStyles.errorText}>{errors.pageSlug}</div>}
        </div>
        <div className={styles.fullWidth}>
          <label className={formStyles.label}>Nội dung</label>
          <textarea 
            value={content} 
            onChange={e => { setContent(e.target.value); if (errors.pageContent) setErrors(prev => ({ ...prev, pageContent: undefined })); }} 
            onBlur={e => validateOnBlur('pageContent', e.target.value)}
            required
            className={`${formStyles.textarea} ${styles.contentTextarea} ${errors.pageContent ? formStyles.inputError : ''}`}
          />
          {errors.pageContent && <div className={formStyles.errorText}>{errors.pageContent}</div>}
        </div>
        <div>
          <label className={formStyles.label}>Meta Title (SEO)</label>
          <input value={metaTitle} onChange={e => setMetaTitle(e.target.value)} className={formStyles.input} />
        </div>
        <div>
          <label className={formStyles.label}>Meta Description (SEO)</label>
          <input value={metaDescription} onChange={e => setMetaDescription(e.target.value)} className={formStyles.input} />
        </div>
        <div>
          <label className={formStyles.label}>Trạng thái</label>
          <div className={styles.statusContainer}>
            <input type="checkbox" id="isPublished" checked={isPublished} onChange={e => setIsPublished(e.target.checked)} className={styles.statusCheckbox} />
            <label htmlFor="isPublished" className={styles.statusLabel}>Hoạt động</label>
          </div>
        </div>
      </div>

      <div className={formStyles.actionsContainer}>
        <button type="button" onClick={onCancel} className={`${formStyles.button} ${formStyles.buttonSecondary}`}>
          Hủy
        </button>
        <button type="submit" disabled={saving} className={`${formStyles.button} ${formStyles.buttonPrimary}`}>
          {saving ? 'Đang lưu...' : 'Lưu trang'}
        </button>
      </div>
    </form>
  )
}
