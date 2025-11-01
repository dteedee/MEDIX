import React, { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import CategoryForm from './CategoryForm'
import { categoryService } from '../../services/categoryService'
import { CategoryDTO } from '../../types/category.types'
import { useToast } from '../../contexts/ToastContext'

export default function CategoryEditPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [category, setCategory] = useState<CategoryDTO | undefined>(undefined)
  const [loading, setLoading] = useState(true)
  const { showToast } = useToast()

  useEffect(() => {
    if (id) {
      categoryService.get(id)
        .then(setCategory)
        .finally(() => setLoading(false))
    } else {
      setLoading(false)
    }
  }, [id])

  const handleSave = () => {
    showToast(id ? 'Cập nhật danh mục thành công!' : 'Tạo danh mục thành công!')
    navigate(-1); // Quay lại trang trước đó trong lịch sử
  }
  const handleCancel = () => navigate(-1); // Quay lại trang trước đó trong lịch sử

  if (loading) return <div>Loading...</div>

  const title = id ? 'Chỉnh sửa Danh mục' : 'Tạo Danh mục mới'

  return (
    <div style={{ padding: 24, backgroundColor: '#f9fafb', minHeight: '100vh' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <h1 style={{ margin: 0, fontSize: '1.875rem', fontWeight: 'bold', color: '#111827' }}>{title}</h1>
      </div>
      <CategoryForm category={category} onSaved={handleSave} onCancel={handleCancel} />
    </div>
  )
}