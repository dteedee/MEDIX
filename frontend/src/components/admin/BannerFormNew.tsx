import React, { useEffect, useState } from 'react'
import { BannerDTO } from '../../types/banner.types'
import { useToast } from '../../contexts/ToastContext'
import { bannerService } from '../../services/bannerService'
import { articleService } from '../../services/articleService'

interface Props {
  banner?: BannerDTO
  onSaved?: () => void
  onCancel?: () => void
}

export default function BannerFormNew({ banner, onSaved, onCancel }: Props) {
  const { showToast } = useToast()
  const [title, setTitle] = useState(banner?.bannerTitle ?? '')
  const [imageUrl, setImageUrl] = useState(banner?.bannerImageUrl ?? '')
  const [link, setLink] = useState(banner?.bannerUrl ?? '')
  const [isActive, setIsActive] = useState<boolean>(banner?.isActive ?? true)
  const [order, setOrder] = useState<number | undefined>(banner?.displayOrder)
  // store local input-friendly datetime values (YYYY-MM-DDTHH:mm) for datetime-local
  const isoToLocalInput = (iso?: string | null) => {
    if (!iso) return '';
    const d = new Date(iso)
    // Handle invalid date strings gracefully
    if (isNaN(d.getTime())) return '';
    const pad = (n: number) => n.toString().padStart(2, '0')
    const yyyy = d.getFullYear()
    const mm = pad(d.getMonth() + 1)
    const dd = pad(d.getDate())
    const hh = pad(d.getHours())
    const mins = pad(d.getMinutes())
    return `${yyyy}-${mm}-${dd}T${hh}:${mins}`;
  }

  const [startDateLocal, setStartDateLocal] = useState<string>(isoToLocalInput(banner?.startDate))
  const [endDateLocal, setEndDateLocal] = useState<string>(isoToLocalInput(banner?.endDate))
  const [saving, setSaving] = useState(false)
  const fileRef = React.createRef<HTMLInputElement>()
  const [errors, setErrors] = useState<{ title?: string, imageUrl?: string, order?: string, link?: string }>({})

  const validateOnBlur = (field: 'title' | 'link', value: string) => {
    if (!value.trim()) {
      let message = '';
      if (field === 'title') {
        message = 'Tiêu đề không được để trống.';
      } else if (field === 'link') {
        message = 'Đường dẫn (Link) không được để trống.';
      }
      if (message) setErrors(prev => ({ ...prev, [field]: message }));
    }
  };
  
  useEffect(() => {
    if (banner) {
      setTitle(banner.bannerTitle ?? '');
      setImageUrl(banner.bannerImageUrl ?? '');
      setLink(banner.bannerUrl ?? '');
      setOrder(banner.displayOrder);
      setIsActive(banner.isActive);
      setStartDateLocal(isoToLocalInput(banner.startDate));
      setEndDateLocal(isoToLocalInput(banner.endDate));
    }
  }, [banner]);

  const onSelectFile = () => fileRef.current?.click()
  const onFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0]
    if (!f) return
    try {
      const url = await articleService.uploadImage(f)
      setImageUrl(url)
      if (errors.imageUrl) setErrors(prev => ({ ...prev, imageUrl: undefined }));
    } catch (err) {
      console.error(err)
      alert('Upload failed')
    }
  }

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()

    const newErrors: typeof errors = {};
    if (!title.trim()) newErrors.title = "Tiêu đề không được để trống.";
    if (!link.trim()) newErrors.link = "Đường dẫn (Link) không được để trống.";
    if (!imageUrl) newErrors.imageUrl = "Ảnh banner không được để trống.";
    if (errors.order) newErrors.order = errors.order; // Giữ lại lỗi order nếu có

    setErrors(newErrors);
    if (Object.keys(newErrors).length > 0) {
      showToast('Vui lòng điền đầy đủ các trường bắt buộc.', 'error');
      return;
    }
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
        console.error('Lưu banner thất bại', err)
        const message = err?.response?.data?.message || 'Đã xảy ra lỗi khi lưu banner. Vui lòng thử lại.';
        showToast(message, 'error');
      }
    } finally {
      setSaving(false)
    }
  }

  // --- CSS Styles --- (Adopted from other forms for consistency)
  const formContainerStyle: React.CSSProperties = {
    background: '#fff',
    border: '1px solid #e5e7eb',
    borderRadius: 12,
    padding: '28px',
    boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)',
  }
  const labelStyle: React.CSSProperties = {
    fontSize: 14,
    color: '#374151',
    marginBottom: 6,
    display: 'block',
    fontWeight: 600,
  }
  const inputStyle: React.CSSProperties = {
    width: '100%',
    padding: '10px 12px',
    border: '1px solid #d1d5db',
    borderRadius: 8,
    fontSize: 15,
    boxSizing: 'border-box',
    transition: 'border-color 0.2s, box-shadow 0.2s',
  }
  const gridStyle: React.CSSProperties = {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
    gap: '24px',
  }

  const errorTextStyle: React.CSSProperties = {
    color: '#ef4444',
    fontSize: 13,
    marginTop: 6,
  }

  return (
    <form onSubmit={submit} style={formContainerStyle}>
      <div style={{ display: 'grid', gridTemplateColumns: '300px 1fr', gap: '32px' }}>
        {/* Left Column for Image */}
        <div>
          <label style={labelStyle}>Ảnh banner</label>
          <div style={{ width: '100%', aspectRatio: '16/9', background: '#f0f2f5', borderRadius: 8, overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative', border: '1px dashed #d1d5db' }}>
            {imageUrl ? <img src={imageUrl} alt={title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : <span style={{ fontSize: 14, color: '#6b7280' }}>Chưa có ảnh</span>}
          </div>
          {errors.imageUrl && <div style={errorTextStyle}>{errors.imageUrl}</div>}
          <button type="button" onClick={onSelectFile} style={{ width: '100%', marginTop: 12, padding: '10px', border: '1px solid #d1d5db', borderRadius: 8, background: '#fff', cursor: 'pointer', fontWeight: 500 }}>
            Tải ảnh lên
          </button>
          <input ref={fileRef} type="file" accept="image/png, image/jpeg" style={{ display: 'none' }} onChange={onFileChange} />
        </div>

        {/* Right Column for Fields */}
        <div style={gridStyle}>
          <div style={{ gridColumn: '1 / -1' }}>
            <label style={labelStyle}>Tiêu đề</label>
            <input 
              value={title} 
              onChange={e => { setTitle(e.target.value); if (errors.title) setErrors(prev => ({ ...prev, title: undefined })); }} 
              required 
              onBlur={e => validateOnBlur('title', e.target.value)}
              style={{...inputStyle, borderColor: errors.title ? '#ef4444' : '#d1d5db'}} 
            />
            {errors.title && <div style={errorTextStyle}>{errors.title}</div>}
          </div>
          <div style={{ gridColumn: '1 / -1' }}>
            <label style={labelStyle}>Đường dẫn (Link)</label>
            <input 
              value={link ?? ''} 
              onChange={e => { setLink(e.target.value); if (errors.link) setErrors(prev => ({ ...prev, link: undefined })); }} 
              onBlur={e => validateOnBlur('link', e.target.value)}
              style={{...inputStyle, borderColor: errors.link ? '#ef4444' : '#d1d5db'}} 
              placeholder="https://example.com/promotion" />
            {errors.link && <div style={errorTextStyle}>{errors.link}</div>}
          </div>
          <div>
            <label style={labelStyle}>Ngày bắt đầu</label>
            <input type="datetime-local" value={startDateLocal} onChange={e => setStartDateLocal(e.target.value)} style={inputStyle} />
          </div>
          <div>
            <label style={labelStyle}>Ngày kết thúc</label>
            <input type="datetime-local" value={endDateLocal} onChange={e => setEndDateLocal(e.target.value)} style={inputStyle} />
          </div>
          <div>
            <label style={labelStyle}>Thứ tự hiển thị</label>
            <input 
              type="number" 
              value={order ?? ''} 
              onChange={e => {
                const value = e.target.value;
                if (value === '') {
                  setOrder(undefined);
                  setErrors(prev => ({ ...prev, order: undefined }));
                } else {
                  const num = Number(value);
                  setOrder(num);
                  if (num < 0) {
                    setErrors(prev => ({ ...prev, order: 'Thứ tự hiển thị phải lớn hơn hoặc bằng 0.' }));
                  } else {
                    setErrors(prev => ({ ...prev, order: undefined }));
                  }
                }
              }} 
              style={{...inputStyle, borderColor: errors.order ? '#ef4444' : '#d1d5db'}} 
              min="0"
              max="9999"
              onKeyDown={(e) => {
                // Chặn các ký tự không phải là số, trừ các phím điều khiển
                if (['-', '+', 'e', 'E', 'ArrowUp', 'ArrowDown'].includes(e.key)) {
                  e.preventDefault();
                }
              }}
            />
            {errors.order && <div style={errorTextStyle}>{errors.order}</div>}
          </div>
          <div>
            <label style={labelStyle}>Trạng thái</label>
            <div style={{ display: 'flex', alignItems: 'center', height: '42px' }}>
              <input type="checkbox" id="isActive" checked={isActive} onChange={e => setIsActive(e.target.checked)} style={{ marginRight: 8, width: 16, height: 16, cursor: 'pointer' }} />
              <label htmlFor="isActive" style={{ fontSize: 14, color: '#4b5563', cursor: 'pointer' }}>Đang hoạt động</label>
            </div>
          </div>
        </div>
      </div>

      <div style={{ marginTop: 32, display: 'flex', justifyContent: 'flex-end', gap: 12, borderTop: '1px solid #e5e7eb', paddingTop: 24 }}>
        <button type="button" onClick={onCancel} style={{ padding: '10px 20px', backgroundColor: '#fff', color: '#374151', borderRadius: 8, border: '1px solid #d1d5db', fontWeight: 600, cursor: 'pointer', transition: 'background-color 0.2s' }}>
          Hủy
        </button>
        <button type="submit" disabled={saving} style={{ padding: '10px 20px', backgroundColor: saving ? '#9ca3af' : '#2563eb', color: '#fff', borderRadius: 8, border: 'none', fontWeight: 600, cursor: saving ? 'not-allowed' : 'pointer', opacity: saving ? 0.7 : 1, transition: 'background-color 0.2s' }}>
          {saving ? 'Đang lưu...' : 'Lưu Banner'}
        </button>
      </div>
    </form>
  )
}
