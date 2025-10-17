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

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <div>Đang tải dữ liệu...</div>
      </div>
    )
  }

  const pageTitle = id ? 'Chỉnh sửa Danh mục' : 'Tạo danh mục mới'

  const title = id ? 'Chỉnh sửa Danh mục' : 'Tạo Danh mục mới'

  return (
    <div style={{ padding: 24, backgroundColor: '#f9fafb', minHeight: '100vh' }}>
<<<<<<< HEAD
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <h1 style={{ margin: 0, fontSize: '1.875rem', fontWeight: 'bold', color: '#111827' }}>
          {pageTitle}
        </h1>
        <button 
          onClick={handleCancel} 
          style={{ 
            padding: '10px 20px', 
            background: '#fff', 
            color: '#374151', 
            borderRadius: 8, 
            border: '1px solid #d1d5db', 
            fontWeight: 600,
            cursor: 'pointer'
          }}>
            Quay lại
        </button>
      </div>

      {/* Form Container */}
      <div style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: 12, padding: 24 }}>
        <CategoryForm category={category} onSaved={handleSave} onCancel={handleCancel} />
      </div>
=======
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <h1 style={{ margin: 0, fontSize: '1.875rem', fontWeight: 'bold', color: '#111827' }}>{title}</h1>
      </div>
      <CategoryForm category={category} onSaved={handleSave} onCancel={handleCancel} />
>>>>>>> NEW-Manager-User
    </div>
  )
}