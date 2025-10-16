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

  return (
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
      </div>
    </form>
  )
}
