import React, { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import BannerForm from '../../components/admin/BannerFormNew'
import { bannerService } from '../../services/bannerService'
import { BannerDTO } from '../../types/banner.types'
import { useToast } from '../../contexts/ToastContext'

export default function BannerEditPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [banner, setBanner] = useState<BannerDTO | undefined>(undefined)
  const [loading, setLoading] = useState(true)
  const { showToast } = useToast()

  useEffect(() => {
    if (id) {
      bannerService.get(id)
        .then(setBanner)
        .finally(() => setLoading(false))
    } else {
      setLoading(false)
    }
  }, [id])

  const handleSave = () => {
    showToast(id ? 'Cập nhật banner thành công!' : 'Tạo banner thành công!')
    navigate(-1); // Quay lại trang trước đó trong lịch sử
  }
  const handleCancel = () => navigate(-1); // Quay lại trang trước đó trong lịch sử

  if (loading) return <div>Loading...</div>

  const title = id ? 'Chỉnh sửa Banner' : 'Tạo Banner mới'

  return (
    <div style={{ padding: 24, backgroundColor: '#f9fafb', minHeight: '100vh' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <h1 style={{ margin: 0, fontSize: '1.875rem', fontWeight: 'bold', color: '#111827' }}>{title}</h1>
      </div>
      <BannerForm banner={banner} onSaved={handleSave} onCancel={handleCancel} />
    </div>
  )
}