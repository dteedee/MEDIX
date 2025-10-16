import React, { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import CategoryForm from '../../components/admin/CategoryForm'
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
    navigate('/manager/categories')
  }
  const handleCancel = () => navigate('/manager/categories')

  if (loading) return <div>Loading...</div>

  return (
    <CategoryForm category={category} onSaved={handleSave} onCancel={handleCancel} />
  )
}