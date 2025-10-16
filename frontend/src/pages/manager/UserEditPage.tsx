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
    navigate('/manager/users')
  }
  const handleCancel = () => navigate('/manager/users')

  if (loading) return <div>Loading...</div>

  return (
    <UserForm user={user} onSaved={handleSave} onCancel={handleCancel} />
  )
}