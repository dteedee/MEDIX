import React, { useState, useEffect } from 'react'
import { CategoryDTO, CreateCategoryRequest } from '../../types/category.types'
import { categoryService } from '../../services/categoryService'

interface Props {
  category?: CategoryDTO
  onSaved?: () => void
  onCancel?: () => void
}

export default function CategoryForm({ category, onSaved, onCancel }: Props) {
  const [name, setName] = useState(category?.name ?? '')
  const [slug, setSlug] = useState(category?.slug ?? '')
  const [description, setDescription] = useState(category?.description ?? '')
  const [isActive, setIsActive] = useState<boolean>(category?.isActive ?? true)
  const [parentId, setParentId] = useState<string | null>(category?.parentId ?? null)
  const [saving, setSaving] = useState(false)
  const [allCategories, setAllCategories] = useState<CategoryDTO[]>([])

  useEffect(() => { // load simple list for parent selection
    let mounted = true
    categoryService.list(1, 100).then(r => { if (mounted) setAllCategories(r.items) })
    return () => { mounted = false }
  }, [])

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    try {
      const payload: CreateCategoryRequest = { name, slug, description, isActive, parentId }
      if (category) await categoryService.update(category.id, payload)
      else await categoryService.create(payload)
      onSaved?.()
    } finally { setSaving(false) }
  }

  return (
    <form onSubmit={submit} style={{ display: 'grid', gap: 8 }}>
      <div>
        <label>Name</label><br />
        <input value={name} onChange={e => setName(e.target.value)} required style={{ width: '100%' }} />
      </div>
      <div>
        <label>Slug</label><br />
        <input value={slug} onChange={e => setSlug(e.target.value)} style={{ width: '100%' }} />
      </div>
      <div>
        <label>Description</label><br />
        <input value={description} onChange={e => setDescription(e.target.value)} style={{ width: '100%' }} />
      </div>
      <div>
        <label>
          <input type="checkbox" checked={isActive} onChange={e => setIsActive(e.target.checked)} /> Active
        </label>
      </div>
      <div>
        <label>Parent</label><br />
        <select value={parentId ?? ''} onChange={e => setParentId(e.target.value || null)}>
          <option value="">-- none --</option>
          {allCategories.filter(c => c.id !== category?.id).map(c => (
            <option key={c.id} value={c.id}>{c.name}</option>
          ))}
        </select>
      </div>
      <div style={{ marginTop: 8 }}>
        <button type="submit" disabled={saving}>{saving ? 'Saving...' : 'Save'}</button>
        <button type="button" onClick={onCancel} style={{ marginLeft: 8 }}>Cancel</button>
      </div>
    </form>
  )
}
