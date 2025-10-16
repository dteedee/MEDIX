import React, { useState, useEffect } from 'react'
import { SiteBannerDTO, CreateSiteBannerRequest, UpdateSiteBannerRequest } from '../../types/siteBanner.types'
import { siteBannerService } from '../../services/siteBannerService'
import './AdminForm.css'

interface Props {
  banner?: SiteBannerDTO
  onSaved?: () => void
  onCancel?: () => void
}

export default function BannerForm({ banner, onSaved, onCancel }: Props) {
  const [formData, setFormData] = useState({
    bannerTitle: '',
    bannerImageUrl: '',
    bannerUrl: '',
    isActive: true,
    displayOrder: 0,
  })
  const [saving, setSaving] = useState(false)
  const [errors, setErrors] = useState<Partial<Record<keyof typeof formData, string>>>({})
  const isEditMode = Boolean(banner?.id)

  useEffect(() => {
    if (banner) {
      setFormData({
        bannerTitle: banner.bannerTitle ?? '',
        bannerImageUrl: banner.bannerImageUrl ?? '',
        bannerUrl: banner.bannerUrl ?? '',
        isActive: banner.isActive ?? true,
        displayOrder: banner.displayOrder ?? 0,
      })
    }
  }, [banner])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : (type === 'number' ? parseInt(value, 10) : value),
    }))
  }

  const validateForm = (): boolean => {
    const newErrors: Partial<Record<keyof typeof formData, string>> = {}
    if (!formData.bannerTitle.trim()) {
      newErrors.bannerTitle = 'Tiêu đề banner là bắt buộc.'
    }
    if (!formData.bannerImageUrl.trim()) {
      newErrors.bannerImageUrl = 'URL hình ảnh là bắt buộc.'
    } else {
      try {
        new URL(formData.bannerImageUrl)
      } catch (_) {
        newErrors.bannerImageUrl = 'URL hình ảnh không hợp lệ.'
      }
    }
    if (formData.bannerUrl) {
      try {
        new URL(formData.bannerUrl)
      } catch (_) {
        newErrors.bannerUrl = 'URL liên kết không hợp lệ.'
      }
    }
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!validateForm()) return
    setSaving(true)
    try {
      const payload = { ...formData }
      if (isEditMode) {
        await siteBannerService.update(banner!.id, payload as UpdateSiteBannerRequest)
      } else {
        await siteBannerService.create(payload as CreateSiteBannerRequest)
      }
      onSaved?.()
    } catch (error: any) {
      // Hiển thị lỗi từ server nếu có
      const serverErrors = error?.response?.data?.errors;
      if (serverErrors) setErrors(serverErrors);
      console.error("Failed to save banner:", error)
    } finally {
      setSaving(false)
    }
  }

  return (
    <form onSubmit={submit}>
      <div className="form-grid">
        <div className="form-group">
          <label htmlFor="bannerTitle" className="form-label">Tiêu đề Banner</label>
          <input id="bannerTitle" name="bannerTitle" type="text" className={`form-input ${errors.bannerTitle ? 'is-invalid' : ''}`} value={formData.bannerTitle} onChange={handleChange} />
          {errors.bannerTitle && <div className="form-error">{errors.bannerTitle}</div>}
        </div>
        <div className="form-group">
          <label htmlFor="bannerUrl" className="form-label">URL liên kết</label>
          <input id="bannerUrl" name="bannerUrl" type="url" className={`form-input ${errors.bannerUrl ? 'is-invalid' : ''}`} value={formData.bannerUrl} onChange={handleChange} placeholder="https://example.com/link" />
          {errors.bannerUrl && <div className="form-error">{errors.bannerUrl}</div>}
        </div>
        <div className="form-group" style={{ gridColumn: 'span 2' }}>
          <label htmlFor="bannerImageUrl" className="form-label">URL hình ảnh</label>
          <input id="bannerImageUrl" name="bannerImageUrl" type="url" className={`form-input ${errors.bannerImageUrl ? 'is-invalid' : ''}`} value={formData.bannerImageUrl} onChange={handleChange} placeholder="https://example.com/image.jpg" />
          {errors.bannerImageUrl && <div className="form-error">{errors.bannerImageUrl}</div>}
        </div>
        <div className="form-group">
          <label htmlFor="displayOrder" className="form-label">Thứ tự hiển thị</label>
          <input id="displayOrder" name="displayOrder" type="number" min="0" className={`form-input ${errors.displayOrder ? 'is-invalid' : ''}`} value={formData.displayOrder} onChange={handleChange} />
          {errors.displayOrder && <div className="form-error">{errors.displayOrder}</div>}
        </div>
        <div className="form-group" style={{ justifyContent: 'center' }}>
          <label htmlFor="isActive" className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: 0 }}>
            <input
              id="isActive"
              name="isActive"
              type="checkbox"
              checked={formData.isActive}
              onChange={handleChange}
              style={{ width: '16px', height: '16px' }}
            />
            <span>Kích hoạt</span>
          </label>
        </div>

        <div className="form-actions">
          <button type="button" className="form-button form-button-secondary" onClick={onCancel} disabled={saving}>
            Hủy
          </button>
          <button type="submit" className="form-button form-button-primary" disabled={saving}>
            {saving ? 'Đang lưu...' : 'Lưu'}
          </button>
        </div>
      </div>
    </form>
  )
}