import React, { useState, useEffect } from 'react'
import { CategoryDTO, CreateCategoryRequest } from '../../types/category.types'
import { categoryService } from '../../services/categoryService'
import { useToast } from '../../contexts/ToastContext'

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
  const gridStyle: React.CSSProperties = {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
    gap: '24px',
  }

  const errorTextStyle: React.CSSProperties = {
    color: '#ef4444',
    fontSize: 13,
    marginTop: 6,
  }

  return (
    <form onSubmit={submit} style={formContainerStyle}>
      <div style={gridStyle}>
        <div>
          <label style={labelStyle}>Tên danh mục</label>
          <input 
            value={name}
            onChange={e => { setName(e.target.value); if (errors.name) setErrors(prev => ({ ...prev, name: undefined })); }}
            required
            onBlur={e => validateOnBlur('name', e.target.value)}
            style={{...inputStyle, borderColor: errors.name ? '#ef4444' : '#d1d5db'}} />
            {errors.name && <div style={errorTextStyle}>{errors.name}</div>}
        </div>
        <div>
          <label style={labelStyle}>Đường dẫn (Slug)</label>
          <input 
            required
            value={slug}
            onChange={e => { setSlug(e.target.value); if (errors.slug) setErrors(prev => ({ ...prev, slug: undefined })); }}
            onBlur={e => validateOnBlur('slug', e.target.value)}
            style={{...inputStyle, borderColor: errors.slug ? '#ef4444' : '#d1d5db'}} 
          />
          {errors.slug && <div style={errorTextStyle}>{errors.slug}</div>}
        </div>
        <div style={{ gridColumn: '1 / -1' }}>
          <label style={labelStyle}>Mô tả</label>
          <textarea value={description} onChange={e => setDescription(e.target.value)} style={{...inputStyle, minHeight: '100px', fontFamily: 'inherit'}} />
        </div>
        <div>
          <label style={labelStyle}>Danh mục cha</label>
          <select value={parentId ?? ''} onChange={e => setParentId(e.target.value || null)} style={inputStyle}>
            <option value="">-- Không có --</option>
            {allCategories.filter(c => c.id !== category?.id).map(c => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
        </div>
        <div>
          <label style={labelStyle}>Trạng thái</label>
          <div style={{ display: 'flex', alignItems: 'center', height: '42px' }}>
            <input type="checkbox" id="isActive" checked={isActive} onChange={e => setIsActive(e.target.checked)} style={{ marginRight: 8, width: 16, height: 16, cursor: 'pointer' }} />
            <label htmlFor="isActive" style={{ fontSize: 14, color: '#4b5563', cursor: 'pointer' }}>Đang hoạt động</label>
          </div>
        </div>
      </div>

      <div style={{ marginTop: 32, display: 'flex', justifyContent: 'flex-end', gap: 12 }}>
        <button type="button" onClick={onCancel} style={{
          padding: '10px 20px',
          backgroundColor: '#fff',
          color: '#374151',
          borderRadius: 8,
          border: '1px solid #d1d5db',
          fontWeight: 600,
          cursor: 'pointer',
          transition: 'background-color 0.2s',
        }}>
          Hủy
        </button>
        <button type="submit" disabled={saving} style={{
          padding: '10px 20px',
          backgroundColor: saving ? '#9ca3af' : '#2563eb',
          color: '#fff',
          borderRadius: 8,
          border: 'none',
          fontWeight: 600,
          cursor: saving ? 'not-allowed' : 'pointer',
          opacity: saving ? 0.7 : 1,
          transition: 'background-color 0.2s',
        }}>
          {saving ? 'Đang lưu...' : 'Lưu danh mục'}
        </button>
      </div>
    </form>
  )
}
