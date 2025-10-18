import React, { useState, useEffect } from 'react'
import { CategoryDTO, CreateCategoryRequest } from '../../types/category.types'
import { categoryService } from '../../services/categoryService'
import { useToast } from '../../contexts/ToastContext'

interface Props {
  category?: CategoryDTO
  onSaved?: () => void
  onCancel?: () => void
}

export default function CategoryForm({ category, onSaved, onCancel }: Props) {
  const { showToast } = useToast()
  const [name, setName] = useState(category?.name ?? '')
  const [slug, setSlug] = useState(category?.slug ?? '')
  const [description, setDescription] = useState(category?.description ?? '')
  const [isActive, setIsActive] = useState<boolean>(category?.isActive ?? true)
  const [parentId, setParentId] = useState<string | null>(category?.parentId ?? null)
  const [saving, setSaving] = useState(false)
  const [allCategories, setAllCategories] = useState<CategoryDTO[]>([])
  const [errors, setErrors] = useState<{ slug?: string, name?: string }>({})
  const [validating, setValidating] = useState<{ slug?: boolean, name?: boolean }>({})

  useEffect(() => { // load simple list for parent selection
    let mounted = true
    categoryService.list(1, 100).then(r => { if (mounted) setAllCategories(r.items) })
    return () => { mounted = false }
  }, [])

  const validateName = async (nameToValidate: string) => {
    // Bỏ qua nếu name không thay đổi hoặc rỗng
    if (!nameToValidate || nameToValidate === category?.name) {
      setErrors(prev => ({ ...prev, name: undefined }));
      return;
    }

    setValidating(prev => ({ ...prev, name: true }));
    setErrors(prev => ({ ...prev, name: undefined })); // Xóa lỗi cũ
    try {
      await categoryService.checkUniqueness('name', nameToValidate, category?.id);
    } catch (error: any) {
      const message = error?.response?.data?.message || `Tên danh mục này đã tồn tại. Vui lòng chọn một tên khác.`;
      setErrors(prev => ({ ...prev, name: message }));
    } finally {
      setValidating(prev => ({ ...prev, name: false }));
    }
  };

  const validateSlug = async (slugToValidate: string) => {
    // Bỏ qua nếu slug không thay đổi hoặc rỗng
    if (!slugToValidate || slugToValidate === category?.slug) {
      setErrors(prev => ({ ...prev, slug: undefined }));
      return;
    }

    setValidating(prev => ({ ...prev, slug: true }));
    setErrors(prev => ({ ...prev, slug: undefined })); // Xóa lỗi cũ
    try {
      // Giả định service có hàm checkUniqueness, bạn cần tự thêm vào
      // Hàm này sẽ throw lỗi nếu slug đã tồn tại
      await categoryService.checkUniqueness('slug', slugToValidate, category?.id);
    } catch (error: any) {
      const message = error?.response?.data?.message || `Slug này đã tồn tại. Vui lòng chọn một slug khác.`;
      setErrors(prev => ({ ...prev, slug: message }));
    } finally {
      setValidating(prev => ({ ...prev, slug: false }));
    }
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (errors.slug || errors.name) {
      // Lỗi đã được hiển thị inline, không cần toast ở đây.
      return;
    }
    setSaving(true)
    try {
      const payload: CreateCategoryRequest = { name, slug, description, isActive, parentId }
      if (category) await categoryService.update(category.id, payload)
      else await categoryService.create(payload)
      onSaved?.()
    } catch (error: any) {
      console.error('Error saving category:', error)
      const message = error?.response?.data?.message || 'Đã xảy ra lỗi khi lưu. Vui lòng thử lại.';
      showToast(message, 'error')
    } finally { setSaving(false) }
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

  const validatingTextStyle: React.CSSProperties = {
    color: '#6b7280',
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
            onBlur={(e) => validateName(e.target.value)}
            style={{...inputStyle, borderColor: errors.name ? '#ef4444' : '#d1d5db'}} />
            {validating.name && <div style={validatingTextStyle}>Đang kiểm tra...</div>}
            {errors.name && <div style={errorTextStyle}>{errors.name}</div>}
        </div>
        <div>
          <label style={labelStyle}>Đường dẫn (Slug)</label>
          <input 
            value={slug} 
            onChange={e => { setSlug(e.target.value); if (errors.slug) setErrors(prev => ({ ...prev, slug: undefined })); }} 
            onBlur={(e) => validateSlug(e.target.value)}
            style={{...inputStyle, borderColor: errors.slug ? '#ef4444' : '#d1d5db'}} 
          />
          {validating.slug && <div style={validatingTextStyle}>Đang kiểm tra...</div>}
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
