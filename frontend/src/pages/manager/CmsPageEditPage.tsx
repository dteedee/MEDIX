import React, { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import CmsPageForm from './CmsPageForm'
import { cmspageService } from '../../services/cmspageService'
import { CmsPageDTO } from '../../types/cmspage.types'
import { useToast } from '../../contexts/ToastContext'

export default function CmsPageEditPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [page, setPage] = useState<CmsPageDTO | undefined>(undefined)
  const [loading, setLoading] = useState(true)
  const { showToast } = useToast()

  useEffect(() => {
    if (id) {
      cmspageService.get(id)
        .then(setPage)
        .finally(() => setLoading(false))
    } else {
      setLoading(false)
    }
  }, [id])

  const handleSave = () => {
    showToast(id ? 'Cập nhật trang thành công!' : 'Tạo trang thành công!')
    navigate(-1); // Quay lại trang trước đó trong lịch sử
  }
  const handleCancel = () => navigate(-1); // Quay lại trang trước đó trong lịch sử

  if (loading) return <div>Loading...</div>

  const title = id ? 'Chỉnh sửa Trang (CMS)' : 'Tạo Trang (CMS) mới';

  return (
    <div style={{ padding: 24, backgroundColor: '#f9fafb', minHeight: '100vh' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <h1 style={{ margin: 0, fontSize: '1.875rem', fontWeight: 'bold', color: '#111827' }}>{title}</h1>
      </div>
      <CmsPageForm page={page} onSaved={handleSave} onCancel={handleCancel} />
    </div>
  )
}