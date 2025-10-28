import React, { useEffect, useState } from 'react'
import { BannerDTO, CreateBannerRequest, UpdateBannerRequest } from '../../types/banner.types'
import { useToast } from '../../contexts/ToastContext'
import { bannerService } from '../../services/bannerService'
import formStyles from '../../styles/manager/Form.module.css'
import styles from '../../styles/manager/BannerFormNew.module.css'

interface Props {
  banner?: BannerDTO
  onSaved?: () => void
  onCancel?: () => void
}

export default function BannerFormNew({ banner, onSaved, onCancel }: Props) {
  const { showToast } = useToast()
  const [title, setTitle] = useState(banner?.bannerTitle ?? '')
  const [imagePreviewUrl, setImagePreviewUrl] = useState(banner?.bannerImageUrl ?? '') // For preview
  const [selectedFile, setSelectedFile] = useState<File | null>(null) // For upload
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
  const [errors, setErrors] = useState<{ title?: string, imageUrl?: string, order?: string, link?: string, startDate?: string, endDate?: string }>({})

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
  
  const validateDateRange = (start: string, end: string) => {
    if (start && end && new Date(start) > new Date(end)) {
      setErrors(prev => ({
        ...prev,
        startDate: 'Ngày bắt đầu không được muộn hơn ngày kết thúc.',
        endDate: 'Ngày kết thúc không được sớm hơn ngày bắt đầu.'
      }));
    } else {
      // Xóa lỗi nếu ngày hợp lệ
      if (errors.startDate || errors.endDate) {
        setErrors(prev => ({ ...prev, startDate: undefined, endDate: undefined }));
      }
    }
  };

  useEffect(() => {
    if (banner) {
      setTitle(banner.bannerTitle ?? '');
      setImagePreviewUrl(banner.bannerImageUrl ?? '');
      setLink(banner.bannerUrl ?? '');
      setOrder(banner.displayOrder);
      setIsActive(banner.isActive);
      setStartDateLocal(isoToLocalInput(banner.startDate));
      setEndDateLocal(isoToLocalInput(banner.endDate));
    }
  }, [banner]);

  // Validate date range whenever they change
  useEffect(() => {
    validateDateRange(startDateLocal, endDateLocal);
  }, [startDateLocal, endDateLocal]);

  // Cleanup object URLs to prevent memory leaks
  useEffect(() => {
    return () => {
      if (imagePreviewUrl && imagePreviewUrl.startsWith('blob:')) URL.revokeObjectURL(imagePreviewUrl);
    };
  }, [imagePreviewUrl]);

  const onSelectFile = () => fileRef.current?.click()
  const onFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0]
    if (!f) return

    const allowedTypes = ['image/png', 'image/jpeg'];
    if (!allowedTypes.includes(f.type)) {
      // Xóa tệp đã chọn để người dùng có thể chọn lại
      setErrors(prev => ({ ...prev, imageUrl: 'Chỉ chấp nhận tệp ảnh có định dạng PNG hoặc JPG.' }));
      if (fileRef.current) {
        fileRef.current.value = '';
      }
      return;
    }

    try {
      setSelectedFile(f);
      setImagePreviewUrl(URL.createObjectURL(f));
      if (errors.imageUrl) setErrors(prev => ({ ...prev, imageUrl: undefined }));
    } catch (err) {
      console.error(err)
      showToast('Không thể xem trước ảnh.', 'error')
      setSelectedFile(null);
    }
  }

  const handleBackendErrors = (err: any) => {
    const newErrors: typeof errors = {};
    let hasSpecificError = false;

    // Ánh xạ lỗi từ backend (ví dụ: "BannerTitle") sang state của form (ví dụ: "title")
    if (err.BannerTitle) { newErrors.title = err.BannerTitle[0]; hasSpecificError = true; }
    if (err.BannerImageUrl) { newErrors.imageUrl = err.BannerImageUrl[0]; hasSpecificError = true; }
    if (err.BannerUrl) { newErrors.link = err.BannerUrl[0]; hasSpecificError = true; }
    if (err.DisplayOrder) { newErrors.order = err.DisplayOrder[0]; hasSpecificError = true; }

    // Xử lý lỗi cross-validation cho khoảng ngày
    if (err.DateRange && err.DateRange[0]) {
      // Hiển thị lỗi inline cho cả hai trường ngày
      newErrors.startDate = err.DateRange[0];
      newErrors.endDate = err.DateRange[0];
      hasSpecificError = true; // Đánh dấu là đã xử lý lỗi cụ thể
    }

    if (hasSpecificError) {
      setErrors(prev => ({ ...prev, ...newErrors }));
      // Không hiển thị toast chung, chỉ hiển thị lỗi inline
      // showToast('Vui lòng kiểm tra lại các thông tin đã nhập.', 'error');
    } else {
      // Xử lý các lỗi chung khác không thuộc về trường cụ thể
      const message = err?.response?.data?.message || err?.message || 'Đã xảy ra lỗi không mong muốn. Vui lòng thử lại.';
      showToast(message, 'error');
    }
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()

    const newErrors: typeof errors = {};
    if (!title.trim()) newErrors.title = "Tiêu đề không được để trống.";
    // Link is optional in some cases, so we might not want to enforce it here.
    if (!imagePreviewUrl && !selectedFile) newErrors.imageUrl = "Ảnh banner không được để trống.";
    // Giữ lại các lỗi đã có từ trước (ví dụ: lỗi ngày tháng)
    const currentErrors = { ...errors, ...newErrors };

    setErrors(currentErrors);
    // Nếu có bất kỳ lỗi nào, không submit
    if (Object.values(currentErrors).some(e => e !== undefined)) {
      return;
    }
    setSaving(true)
    try {
      const toIso = (local?: string) => (local ? new Date(local).toISOString() : undefined);

      if (banner) {
        // UPDATE mode
        const payload: UpdateBannerRequest = {
          bannerTitle: title,
          // When editing without a new file, send the existing URL back.
          // If a new file is selected, backend will generate a new URL from bannerFile.
          bannerImageUrl: !selectedFile ? banner.bannerImageUrl : undefined,
          bannerUrl: link || undefined,
          displayOrder: order,
          startDate: toIso(startDateLocal) || undefined,
          endDate: toIso(endDateLocal) || undefined,
          isActive,
          bannerFile: selectedFile || undefined,
        };
        Object.keys(payload).forEach(key => (payload as any)[key] === undefined && delete (payload as any)[key]);
        console.debug('Banner update payload:', payload);
        await bannerService.update(banner.id, payload);
      } else {
        // CREATE mode
        const payload: CreateBannerRequest = {
          bannerTitle: title,
          bannerUrl: link || undefined,
          displayOrder: order,
          startDate: toIso(startDateLocal) || undefined,
          endDate: toIso(endDateLocal) || undefined,
          isActive,
          bannerFile: selectedFile || undefined,
        };
        Object.keys(payload).forEach(key => (payload as any)[key] === undefined && delete (payload as any)[key]);
        console.debug('Banner create payload:', payload);
        await bannerService.create(payload);
      }
      onSaved?.();
    } catch (err: any) {
      handleBackendErrors(err);
    } finally {
      setSaving(false)
    }
  }

  return (
    <form onSubmit={submit} className={formStyles.formContainer}>
      <div className={styles.mainGrid}>
        {/* Left Column for Image */}
        <div className={styles.imageColumn}>
          <label className={formStyles.label}>Ảnh banner</label>
          <div className={`${styles.imagePreviewContainer} ${errors.imageUrl ? styles.error : ''}`}>
            {imagePreviewUrl ? <img src={imagePreviewUrl} alt={title} className={styles.imagePreview} /> : <span className={styles.noImageText}>Chưa có ảnh</span>}
          </div>
          {errors.imageUrl && <div className={formStyles.errorText}>{errors.imageUrl}</div>}
          <button type="button" onClick={onSelectFile} className={styles.uploadButton}>
            Tải ảnh lên
          </button>
          <input ref={fileRef} type="file" accept="image/png, image/jpeg" style={{ display: 'none' }} onChange={onFileChange} />
        </div>

        {/* Right Column for Fields */}
        <div className={styles.fieldsGrid}>
          <div className={styles.fullWidth}>
            <label className={formStyles.label}>Tiêu đề</label>
            <input 
              value={title} 
              onChange={e => { setTitle(e.target.value); if (errors.title) setErrors(prev => ({ ...prev, title: undefined })); }} 
              required 
              onBlur={e => validateOnBlur('title', e.target.value)}
              className={`${formStyles.input} ${errors.title ? formStyles.inputError : ''}`}
            />
            {errors.title && <div className={formStyles.errorText}>{errors.title}</div>}
          </div>
          <div className={styles.fullWidth}>
            <label className={formStyles.label}>Đường dẫn (Link)</label>
            <input 
              value={link ?? ''} 
              onChange={e => { setLink(e.target.value); if (errors.link) setErrors(prev => ({ ...prev, link: undefined })); }} 
              onBlur={e => validateOnBlur('link', e.target.value)}
              className={`${formStyles.input} ${errors.link ? formStyles.inputError : ''}`}
              placeholder="https://vi dụ.com/khuyen-mai" />
            {errors.link && <div className={formStyles.errorText}>{errors.link}</div>}
          </div>
          <div>
            <label className={formStyles.label}>Ngày bắt đầu</label>
            <input type="datetime-local" value={startDateLocal} onChange={e => setStartDateLocal(e.target.value)} className={`${formStyles.input} ${errors.startDate ? formStyles.inputError : ''}`} />
            {errors.startDate && <div className={formStyles.errorText}>{errors.startDate}</div>}
          </div>
          <div>
            <label className={formStyles.label}>Ngày kết thúc</label>
            <input type="datetime-local" value={endDateLocal} onChange={e => setEndDateLocal(e.target.value)} className={`${formStyles.input} ${errors.endDate ? formStyles.inputError : ''}`} />
            {errors.endDate && <div className={formStyles.errorText}>{errors.endDate}</div>}
          </div>
          <div>
            <label className={formStyles.label}>Thứ tự hiển thị</label>
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
              className={`${formStyles.input} ${errors.order ? formStyles.inputError : ''}`}
              min="0"
              max="9999"
              onKeyDown={(e) => {
                // Chặn các ký tự không phải là số, trừ các phím điều khiển
                if (['-', '+', 'e', 'E', 'ArrowUp', 'ArrowDown'].includes(e.key)) {
                  e.preventDefault();
                }
              }}
            />
            {errors.order && <div className={formStyles.errorText}>{errors.order}</div>}
          </div>
          <div>
            <label className={formStyles.label}>Trạng thái</label>
            <div className={styles.statusContainer}>
              <input type="checkbox" id="isActive" checked={isActive} onChange={e => setIsActive(e.target.checked)} className={styles.statusCheckbox} />
              <label htmlFor="isActive" className={styles.statusLabel}>Đang hoạt động</label>
            </div>
          </div>
        </div>
      </div>

      <div className={formStyles.actionsContainer}>
        <button type="button" onClick={onCancel} className={`${formStyles.button} ${formStyles.buttonSecondary}`}>
          Hủy
        </button>
        <button type="submit" disabled={saving} className={`${formStyles.button} ${formStyles.buttonPrimary}`}>
          {saving ? 'Đang lưu...' : 'Lưu Banner'}
        </button>
      </div>
    </form>
  )
}
