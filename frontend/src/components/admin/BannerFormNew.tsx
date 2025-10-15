import React, { useState } from 'react'
import { BannerDTO } from '../../types/banner.types'
import { bannerService } from '../../services/bannerService'
import { articleService } from '../../services/articleService'
import './BannerForm.css'

interface Props {
  banner?: BannerDTO
  onSaved?: () => void
  onCancel?: () => void
}

export default function BannerFormNew({ banner, onSaved, onCancel }: Props) {
  const [title, setTitle] = useState(banner?.title ?? '')
  const [imageUrl, setImageUrl] = useState(banner?.imageUrl ?? '')
  const [link, setLink] = useState(banner?.link ?? '')
  const [isActive, setIsActive] = useState<boolean>(banner?.isActive ?? true)
  const [order, setOrder] = useState<number | undefined>(banner?.order)
  // store local input-friendly datetime values (YYYY-MM-DDTHH:mm) for datetime-local
  const isoToLocalInput = (iso?: string) => {
    if (!iso) return ''
    const d = new Date(iso)
    const pad = (n: number) => n.toString().padStart(2, '0')
    const yyyy = d.getFullYear()
    const mm = pad(d.getMonth() + 1)
    const dd = pad(d.getDate())
    const hh = pad(d.getHours())
    const mins = pad(d.getMinutes())
    return `${yyyy}-${mm}-${dd}T${hh}:${mins}`
  }

  const [startDateLocal, setStartDateLocal] = useState<string>(isoToLocalInput(banner ? (banner as any).startDate : undefined))
  const [endDateLocal, setEndDateLocal] = useState<string>(isoToLocalInput(banner ? (banner as any).endDate : undefined))
  const [saving, setSaving] = useState(false)
  const fileRef = React.createRef<HTMLInputElement>()

  const onSelectFile = () => fileRef.current?.click()
  const onFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0]
    if (!f) return
    try {
      const url = await articleService.uploadImage(f)
      setImageUrl(url)
    } catch (err) {
      console.error(err)
      alert('Upload failed')
    }
  }

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    try {
      const toIso = (local?: string) => local ? new Date(local).toISOString() : undefined
      // Prevent accidental saving of base64 data URLs into DB (column too small)
      if (imageUrl && imageUrl.startsWith('data:')) {
        console.warn('Attempt to save data URL into DB blocked')
        alert('Upload failed earlier so the image is a local data URL. The server likely returned 404 for the upload endpoint.\n\nDo not save data URLs into the database. Please ensure the backend upload endpoint is available so images are stored and a remote URL is returned. Contact the backend team or configure /api/File/Upload.')
        setSaving(false)
        return
      }

      const payload: any = {
        bannerTitle: title,
        bannerImageUrl: imageUrl || undefined,
        bannerUrl: link || undefined,
        displayOrder: order,
        startDate: toIso(startDateLocal) || undefined,
        endDate: toIso(endDateLocal) || undefined,
        isActive
      }

      console.debug('Banner submit payload:', payload)

      try {
        let res
        if (banner) res = await bannerService.update(banner.id, payload)
        else res = await bannerService.create(payload)
        console.debug('Banner save response:', res)
        onSaved?.()
      } catch (err: any) {
        console.error('Banner save failed', err)
        const serverMsg = err?.response?.data ?? err?.message ?? String(err)
        alert('Save failed: ' + (typeof serverMsg === 'string' ? serverMsg : JSON.stringify(serverMsg)))
      }
    } finally {
      setSaving(false)
    }
  }

  return (
    <form onSubmit={submit} className="bf-form">
      <div className="bf-left">
        <div className="bf-thumb">
          {imageUrl ? <img src={imageUrl} alt={title} /> : <div className="bf-thumb-placeholder">No image</div>}
          <button type="button" className="bf-upload" onClick={onSelectFile}>Upload image</button>
          <input ref={fileRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={onFileChange} />
        </div>
      </div>

      <div className="bf-right">
        <div className="bf-field">
          <label>Title</label>
          <input value={title} onChange={e => setTitle(e.target.value)} required />
        </div>

        <div className="bf-field">
          <label>Image URL</label>
          <input value={imageUrl} onChange={e => setImageUrl(e.target.value)} />
        </div>

        <div className="bf-field">
          <label>Link</label>
          <input value={link} onChange={e => setLink(e.target.value)} />
        </div>

        <div className="bf-field">
          <label>Start date</label>
          <input type="datetime-local" value={startDateLocal} onChange={e => setStartDateLocal(e.target.value)} />
        </div>

        <div className="bf-field">
          <label>End date</label>
          <input type="datetime-local" value={endDateLocal} onChange={e => setEndDateLocal(e.target.value)} />
        </div>

        <div className="bf-field">
          <label>
            <input type="checkbox" checked={isActive} onChange={e => setIsActive(e.target.checked)} /> Active
          </label>
        </div>

        <div className="bf-field">
          <label>Order</label>
          <input type="number" value={order ?? ''} onChange={e => setOrder(e.target.value ? Number(e.target.value) : undefined)} />
        </div>

        <div className="bf-actions">
            <button type="submit" disabled={saving}>{saving ? 'Saving...' : 'Save'}</button>
          <button type="button" onClick={onCancel}>Cancel</button>
        </div>
      </div>
    </form>
  )
}
