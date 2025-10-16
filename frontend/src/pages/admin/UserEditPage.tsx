import React, { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import UserForm from '../../components/admin/UserForm'
import { userService } from '../../services/userService'
import { UserDTO } from '../../types/user.types'
import { useToast } from '../../contexts/ToastContext'

export default function UserEditPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [user, setUser] = useState<UserDTO | undefined>(undefined)
  const [loading, setLoading] = useState(true)
  const { showToast } = useToast()

  useEffect(() => {
    if (id) {
      userService.get(id)
        .then(setUser)
        .finally(() => setLoading(false))
    } else {
      setLoading(false)
    }
  }, [id])

  const handleSave = () => {
    showToast(id ? 'Cập nhật người dùng thành công!' : 'Tạo người dùng thành công!')
    navigate('/admin/users')
  }
  const handleCancel = () => navigate('/admin/users')

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <div>Đang tải dữ liệu...</div>
      </div>
    )
  }

  const pageTitle = id ? 'Chỉnh sửa Người dùng' : 'Tạo người dùng mới'

  return (
    <div style={{ padding: 24, backgroundColor: '#f9fafb', minHeight: '100vh' }}>
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
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: 8
          }}>
            Quay lại
        </button>
      </div>

      {/* Form Container */}
      <div style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: 12, padding: 24 }}>
        <UserForm user={user} onSaved={handleSave} onCancel={handleCancel} />
      </div>
    </div>
  )
}