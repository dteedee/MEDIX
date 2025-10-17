import React, { useState, useEffect } from 'react'
import { CategoryDTO, CreateCategoryRequest } from '../../types/category.types'
import { categoryService } from '../../services/categoryService'
import './AdminForm.css'

interface Props {
  category?: CategoryDTO
  onSaved?: () => void
  onCancel?: () => void
}

export default function CategoryForm({ category, onSaved, onCancel }: Props) {
  const [formData, setFormData] = useState({
    name: '',
    slug: '',
    description: '',
    isActive: true,
    parentId: '' as string | null,
  })
  const [saving, setSaving] = useState(false)
  const [allCategories, setAllCategories] = useState<CategoryDTO[]>([])

  useEffect(() => {
    // Load simple list for parent selection
    let mounted = true
    categoryService.list(1, 100).then(r => {
      if (mounted) setAllCategories(r.items)
    })
    return () => {
      mounted = false
    }
  }, [])

  useEffect(() => {
    if (category) {
      setFormData({
        name: category.name ?? '',
        slug: category.slug ?? '',
        description: category.description ?? '',
        isActive: category.isActive ?? true,
        parentId: category.parentId ?? null,
      })
    }
  }, [category])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target
    const checked = (e.target as HTMLInputElement).checked

    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }))
  }

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    try {
      const payload: CreateCategoryRequest = {
        name: formData.name,
        slug: formData.slug,
        description: formData.description,
        isActive: formData.isActive,
        parentId: formData.parentId || null,
      }
      if (category) await categoryService.update(category.id, payload)
      else await categoryService.create(payload)
      onSaved?.()
    } catch (error) {
      console.error("Failed to save category:", error)
    } finally {
      setSaving(false)
    }
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

  return (
<<<<<<< HEAD
    <form onSubmit={submit}>
      <div className="form-grid">
        <div className="form-group">
          <label htmlFor="name" className="form-label">Tên danh mục</label>
          <input id="name" name="name" type="text" className="form-input" value={formData.name} onChange={handleChange} required />
        </div>
        <div className="form-group">
          <label htmlFor="slug" className="form-label">Đường dẫn (Slug)</label>
          <input id="slug" name="slug" type="text" className="form-input" value={formData.slug} onChange={handleChange} />
        </div>
        <div className="form-group" style={{ gridColumn: 'span 2' }}>
          <label htmlFor="description" className="form-label">Mô tả</label>
          <textarea id="description" name="description" className="form-input" value={formData.description} onChange={handleChange} rows={3}></textarea>
        </div>
        <div className="form-group">
          <label htmlFor="parentId" className="form-label">Danh mục cha</label>
          <select id="parentId" name="parentId" className="form-select" value={formData.parentId ?? ''} onChange={handleChange}>
            <option value="">-- Không có --</option>
            {allCategories
              .filter(c => c.id !== category?.id) // Không cho chọn chính nó làm cha
              .map(c => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
          </select>
        </div>
        <div className="form-group" style={{ justifyContent: 'center' }}>
          <label htmlFor="isActive" className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: 0 }}>
            <input id="isActive" name="isActive" type="checkbox" checked={formData.isActive} onChange={handleChange} style={{ width: '16px', height: '16px' }} />
            <span>Kích hoạt</span>
          </label>
        </div>
        <div className="form-actions">
          <button type="button" className="form-button form-button-secondary" onClick={onCancel} disabled={saving}>Hủy</button>
          <button type="submit" className="form-button form-button-primary" disabled={saving}>{saving ? 'Đang lưu...' : 'Lưu'}</button>
        </div>
=======
    <form onSubmit={submit} style={formContainerStyle}>
      <div style={gridStyle}>
        <div>
          <label style={labelStyle}>Tên danh mục</label>
          <input value={name} onChange={e => setName(e.target.value)} required style={inputStyle} />
        </div>
        <div>
          <label style={labelStyle}>Đường dẫn (Slug)</label>
          <input value={slug} onChange={e => setSlug(e.target.value)} style={inputStyle} />
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
>>>>>>> NEW-Manager-User
      </div>
    </form>
  )
}
