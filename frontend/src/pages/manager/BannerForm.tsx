import React, { useState } from 'react'
import { BannerDTO, CreateBannerRequest, UpdateBannerRequest } from '../../types/banner.types'
import { bannerService } from '../../services/bannerService'

interface Props {
  banner?: BannerDTO
  onSaved?: () => void
  onCancel?: () => void
}

export default function BannerForm({ banner, onSaved, onCancel }: Props) {
  const [title, setTitle] = useState(banner?.title ?? '')
  const [imageUrl, setImageUrl] = useState(banner?.imageUrl ?? '')
  const [link, setLink] = useState(banner?.link ?? '')
  const [isActive, setIsActive] = useState<boolean>(banner?.isActive ?? true)
  const [order, setOrder] = useState<number | undefined>(banner?.order)
  const [saving, setSaving] = useState(false)

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    try {
      // map to backend field names
      const payload: any = {
        bannerTitle: title,
        bannerImageUrl: imageUrl || undefined,
        bannerUrl: link || undefined,
        isActive,
        displayOrder: order
      }
      if (banner) {
        await bannerService.update(banner.id, payload)
      } else {
        await bannerService.create(payload)
      }
      onSaved?.()
    } finally {
      setSaving(false)
    }
  }

  return (
    <form onSubmit={submit} style={{ display: 'grid', gap: 8 }}>
      <div>
        <label>Title</label><br />
        <input value={title} onChange={e => setTitle(e.target.value)} required style={{ width: '100%' }} />
      </div>
      <div>
        <label>Image URL</label><br />
        <input value={imageUrl} onChange={e => setImageUrl(e.target.value)} style={{ width: '100%' }} />
      </div>
      <div>
        <label>Link</label><br />
        <input value={link} onChange={e => setLink(e.target.value)} style={{ width: '100%' }} />
      </div>
      <div>
        <label>
          <input type="checkbox" checked={isActive} onChange={e => setIsActive(e.target.checked)} /> Active
        </label>
      </div>
      <div>
        <label>Order</label><br />
        <input type="number" value={order ?? ''} onChange={e => setOrder(e.target.value ? Number(e.target.value) : undefined)} />
      </div>
      <div style={{ marginTop: 8 }}>
        <button type="submit" disabled={saving}>{saving ? 'Saving...' : 'Save'}</button>
        <button type="button" onClick={onCancel} style={{ marginLeft: 8 }}>Cancel</button>
      </div>
    </form>
  )
}
