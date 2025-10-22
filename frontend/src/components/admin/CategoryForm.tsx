import React, { useState, useEffect } from 'react'
import { CategoryDTO, CreateCategoryRequest } from '../../types/category.types'
import { categoryService } from '../../services/categoryService'
import { useToast } from '../../contexts/ToastContext'

import formStyles from '../../styles/Form.module.css'
import styles from '../../styles/CategoryForm.module.css'
interface Props {
  category?: CategoryDTO
  onSaved?: () => void
  onCancel?: () => void
}

export default function CategoryForm({ category, onSaved, onCancel }: Props) { // eslint-disable-line
  const { showToast } = useToast()
  const [name, setName] = useState(category?.name ?? '')
  const [slug, setSlug] = useState(category?.slug ?? '')
  const [description, setDescription] = useState(category?.description ?? '')
  const [isActive, setIsActive] = useState<boolean>(category?.isActive ?? true)
  const [parentId, setParentId] = useState<string | null>(category?.parentId ?? null)
  const [saving, setSaving] = useState(false)
  const [allCategories, setAllCategories] = useState<CategoryDTO[]>([]) // eslint-disable-line
  const [errors, setErrors] = useState<{ slug?: string, name?: string }>({})

  useEffect(() => { // load simple list for parent selection
    let mounted = true
    categoryService.list(1, 100).then(r => { if (mounted) setAllCategories(r.items) })
    return () => { mounted = false }
  }, [])

  const validateOnBlur = (field: 'name' | 'slug', value: string) => {
    if (!value.trim()) {
      const message = field === 'name' 
        ? 'Tên danh mục không được để trống.' 
        : 'Đường dẫn (Slug) không được để trống.';
      setErrors(prev => ({ ...prev, [field]: message }));
    }
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    // Xóa các lỗi cũ trước khi submit để xác thực lại từ đầu
    setErrors({});

    if (!name.trim() || !slug.trim()) {
      showToast('Vui lòng điền đầy đủ các trường bắt buộc.', 'error');
      return;
    }

    setSaving(true)
    try {
      const payload: CreateCategoryRequest = { name, slug, description, isActive, parentId }
      if (category) await categoryService.update(category.id, payload)
      else await categoryService.create(payload)
      onSaved?.()
    } catch (err: any) {
      console.error('Error saving category:', err)
      // Kiểm tra xem lỗi có phải là đối tượng lỗi validation đã được xử lý từ service không
      if (err.Name || err.Slug || err.ParentId) {
        const newErrors: { name?: string, slug?: string } = {};
        if (err.Name) newErrors.name = err.Name[0];
        if (err.Slug) newErrors.slug = err.Slug[0];
        // Bạn có thể thêm xử lý cho ParentId ở đây nếu cần
        if (err.ParentId) {
          showToast(`Lỗi Danh mục cha: ${err.ParentId[0]}`, 'error');
        }
        setErrors(newErrors);
        showToast('Vui lòng kiểm tra lại các thông tin đã nhập.', 'error');
      } else {
        // Xử lý các lỗi chung khác
        const message = err?.response?.data?.message || 'Đã xảy ra lỗi khi lưu. Vui lòng thử lại.';
        showToast(message, 'error');
      }
    } finally { setSaving(false) } // eslint-disable-line
  }

  return (
    <form onSubmit={submit} className={formStyles.formContainer}>
      <div className={styles.grid}>
        <div>
          <label className={formStyles.label}>Tên danh mục</label>
          <input 
            value={name}
            onChange={e => { setName(e.target.value); if (errors.name) setErrors(prev => ({ ...prev, name: undefined })); }}
            required
            onBlur={e => validateOnBlur('name', e.target.value)}
            className={`${formStyles.input} ${errors.name ? formStyles.inputError : ''}`} />
            {errors.name && <div className={formStyles.errorText}>{errors.name}</div>}
        </div>
        <div>
          <label className={formStyles.label}>Đường dẫn (Slug)</label>
          <input 
            required
            value={slug}
            onChange={e => { setSlug(e.target.value); if (errors.slug) setErrors(prev => ({ ...prev, slug: undefined })); }}
            onBlur={e => validateOnBlur('slug', e.target.value)}
            className={`${formStyles.input} ${errors.slug ? formStyles.inputError : ''}`}
          />
          {errors.slug && <div className={formStyles.errorText}>{errors.slug}</div>}
        </div>
        <div className={styles.fullWidth}>
          <label className={formStyles.label}>Mô tả</label>
          <textarea value={description} onChange={e => setDescription(e.target.value)} className={`${formStyles.textarea} ${styles.descriptionTextarea}`} />
        </div>
        <div>
          <label className={formStyles.label}>Danh mục cha</label>
          <select value={parentId ?? ''} onChange={e => setParentId(e.target.value || null)} className={formStyles.select}>
            <option value="">-- Không có --</option>
            {allCategories.filter(c => c.id !== category?.id).map(c => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
        </div>
        <div>
          <label className={formStyles.label}>Trạng thái</label>
          <div className={styles.statusContainer}>
            <input type="checkbox" id="isActive" checked={isActive} onChange={e => setIsActive(e.target.checked)} className={styles.statusCheckbox} />
            <label htmlFor="isActive" className={styles.statusLabel}>Đang hoạt động</label>
          </div>
        </div>
      </div>

      <div className={formStyles.actionsContainer}>
        <button type="button" onClick={onCancel} className={`${formStyles.button} ${formStyles.buttonSecondary}`}>
          Hủy
        </button>
        <button type="submit" disabled={saving} className={`${formStyles.button} ${formStyles.buttonPrimary}`}>
          {saving ? 'Đang lưu...' : 'Lưu danh mục'}
        </button>
      </div>
    </form>
  )
}
