import React, { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import CmsPageForm from '../../components/admin/CmsPageForm'
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
    navigate('/manager/cms-pages')
  }
  const handleCancel = () => navigate('/manager/cms-pages')

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <div>Đang tải dữ liệu...</div>
      </div>
    )
  }

  const pageTitle = id ? 'Chỉnh sửa Trang' : 'Tạo trang mới'

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
            cursor: 'pointer'
          }}>
            Quay lại
        </button>
      </div>

      {/* Form Container */}
      <div style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: 12, padding: 24 }}>
        <CmsPageForm page={page} onSaved={handleSave} onCancel={handleCancel} />
      </div>
    </div>
  )
}