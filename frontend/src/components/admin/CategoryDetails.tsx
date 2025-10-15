import React from 'react'
import { CategoryDTO } from '../../types/category.types'

interface Props { category?: CategoryDTO; onClose?: () => void }

export default function CategoryDetails({ category, onClose }: Props) {
  if (!category) return null
  return (
    <div style={{ position: 'fixed', left: 0, top: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ background: '#fff', padding: 20, maxWidth: 600, width: '90%' }}>
        <h2>{category.name}</h2>
        <div><strong>Slug:</strong> {category.slug}</div>
        <div><strong>Description:</strong> {category.description}</div>
        <div><strong>Active:</strong> {category.isActive ? 'Yes' : 'No'}</div>
        <div><strong>Parent:</strong> {category.parentName ?? '-'}</div>
        <div style={{ marginTop: 12 }}><button onClick={onClose}>Close</button></div>
      </div>
    </div>
  )
}
