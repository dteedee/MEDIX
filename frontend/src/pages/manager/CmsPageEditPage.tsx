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

  if (loading) return <div>Loading...</div>

  return (
    <CmsPageForm page={page} onSaved={handleSave} onCancel={handleCancel} />
  )
}