import React, { useState, useEffect } from 'react';
import { BannerDTO, CreateBannerRequest, UpdateBannerRequest } from '../../types/banner.types';
import { useToast } from '../../contexts/ToastContext';
import { bannerService } from '../../services/bannerService';
import styles from '../../styles/admin/ArticleForm.module.css';

interface Props {
  banner?: BannerDTO | null;
  mode: 'view' | 'edit' | 'create';
  onSaved: () => void;
  onCancel: () => void;
  onSaveRequest?: (formData: any) => void;
}

export default function BannerForm({ banner, mode, onSaved, onCancel, onSaveRequest }: Props) {
  const { showToast } = useToast();
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [formData, setFormData] = useState({
    bannerTitle: banner?.bannerTitle || '',
    bannerImageUrl: banner?.bannerImageUrl || '',
    bannerUrl: banner?.bannerUrl || '',
    displayOrder: banner?.displayOrder || 0,
    isActive: banner?.isActive ?? true,
  });

  const [imagePreview, setImagePreview] = useState<string>(banner?.bannerImageUrl || '');
  const [imageFile, setImageFile] = useState<File | null>(null);

  // Helper to convert ISO string to a YYYY-MM-DD format for date input
  const toInputDateString = (isoString?: string | null) => {
    if (!isoString) return '';
    const date = new Date(isoString);
    return isNaN(date.getTime()) ? '' : date.toISOString().split('T')[0];
  };

  const [startDateLocal, setStartDateLocal] = useState<string>(toInputDateString(banner?.startDate));
  const [endDateLocal, setEndDateLocal] = useState<string>(toInputDateString(banner?.endDate));

  useEffect(() => {
    if (banner) {
      setFormData({
        bannerTitle: banner.bannerTitle || '',
        bannerImageUrl: banner.bannerImageUrl || '',
        bannerUrl: banner.bannerUrl || '',
        displayOrder: banner.displayOrder || 0,
        isActive: banner.isActive ?? true,
      });
      setImagePreview(banner.bannerImageUrl || '');
      setStartDateLocal(toInputDateString(banner.startDate));
      setEndDateLocal(toInputDateString(banner.endDate));
    }
  }, [banner]);

  const handleBlur = (e: React.FocusEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    if (name === 'bannerTitle' && !value.trim()) {
      setErrors(prev => ({ ...prev, bannerTitle: 'Tiêu đề không được để trống' }));
    }
    if (name === 'bannerUrl' && value.trim() && !isValidUrl(value)) { // Validate URL on blur
      setErrors(prev => ({ ...prev, bannerUrl: 'Đường dẫn không hợp lệ' }));
    } else if (name === 'bannerUrl') { // Clear URL error if it becomes valid or empty
      const newErrors = { ...errors };
      delete newErrors.bannerUrl;
      setErrors(newErrors);
    }
  };

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.bannerTitle.trim()) {
      newErrors.bannerTitle = 'Tiêu đề banner không được để trống';
    } else if (formData.bannerTitle.length > 200) {
      newErrors.bannerTitle = 'Tiêu đề không được vượt quá 200 ký tự';
    }

    if (!imagePreview && mode === 'create') {
      newErrors.bannerImageUrl = 'Ảnh banner không được để trống';
    }

    if (formData.bannerUrl && !isValidUrl(formData.bannerUrl)) {
      newErrors.bannerUrl = 'Đường dẫn không hợp lệ';
    }

    if (formData.displayOrder < 0) {
      newErrors.displayOrder = 'Thứ tự hiển thị phải lớn hơn hoặc bằng 0';
    }

    if (!startDateLocal) {
      newErrors.startDate = 'Ngày bắt đầu là bắt buộc.';
    }

    if (!endDateLocal) {
      newErrors.endDate = 'Ngày kết thúc là bắt buộc.';
    }

    if (startDateLocal && endDateLocal) {
      const start = new Date(startDateLocal);
      const end = new Date(endDateLocal);
      if (start > end) {
        newErrors.dateRange = 'Ngày bắt đầu phải trước ngày kết thúc';
      }
    }

    if (endDateLocal) {
      const end = new Date(endDateLocal);
      const today = new Date();
      today.setHours(0, 0, 0, 0); // Chuẩn hóa về đầu ngày để so sánh
      if (mode !== 'edit' && end < today) { // Chỉ kiểm tra cho mode create
        newErrors.dateRange = 'Ngày kết thúc không được là một ngày trong quá khứ.';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const isValidUrl = (url: string): boolean => {
    try {
      new URL(url);
      return true;
    } catch {
      return false;
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validate()) {
      showToast('Vui lòng kiểm tra lại các trường dữ liệu', 'error');
      return;
    }

    // For edit mode, use imagePreview if it's a URL (existing image), otherwise use formData.bannerImageUrl
    let finalBannerImageUrl = formData.bannerImageUrl;
    
    // If preview is a data URL (base64) and we have imageFile, it's a new upload
    // If preview is a URL (http/https), it's the existing image
    if (imagePreview && imagePreview.startsWith('http')) {
      finalBannerImageUrl = imagePreview;
    } else if (imagePreview && imageFile) {
      // New upload - no URL yet
      finalBannerImageUrl = '';
    } else if (!finalBannerImageUrl && imagePreview) {
      finalBannerImageUrl = imagePreview;
    }
    
    // Helper to convert YYYY-MM-DD string to full ISO string for the backend
    const toISOString = (localDate?: string, isEndDate = false) => {
      if (!localDate) return undefined;
      const date = new Date(localDate);
      if (isEndDate) {
        // Set to the end of the day
        date.setUTCHours(23, 59, 59, 999);
      } else {
        // Set to the start of the day
        date.setUTCHours(0, 0, 0, 0);
      }
      return date.toISOString();
    };

    const payload: CreateBannerRequest | UpdateBannerRequest = {
      bannerTitle: formData.bannerTitle,
      bannerImageUrl: finalBannerImageUrl || '',
      bannerUrl: formData.bannerUrl || undefined,
      displayOrder: formData.displayOrder || undefined,
      isActive: formData.isActive,
      startDate: toISOString(startDateLocal, false),
      endDate: toISOString(endDateLocal, true),
      bannerFile: imageFile || undefined,
    };
    
    console.log('Form submission - Mode:', mode);
    console.log('Form submission - FormData:', formData);
    console.log('Form submission - Image preview:', imagePreview);
    console.log('Form submission - Image file:', imageFile);
    console.log('Form submission - Final banner image URL:', finalBannerImageUrl);
    console.log('Form submission - Payload:', payload);

    if (onSaveRequest) {
      onSaveRequest(payload);
    } else {
      // Direct save (no confirmation)
      await saveBanner(payload);
    }
  };

  const saveBanner = async (payload: CreateBannerRequest | UpdateBannerRequest) => {
    setLoading(true);
    try {
      if (mode === 'create') {
        console.log('Creating new banner with payload:', payload);
        await bannerService.create(payload as CreateBannerRequest);
        showToast('Tạo banner thành công!', 'success');
      } else if (banner) {
        console.log('Updating banner with ID:', banner.id);
        console.log('Update payload:', payload);
        await bannerService.update(banner.id, payload);
        console.log('Update successful');
        showToast('Cập nhật banner thành công!', 'success');
      }
      onSaved();
    } catch (error: any) {
      console.error('Error saving banner:', error);
      console.error('Error details:', {
        status: error?.response?.status,
        statusText: error?.response?.statusText,
        data: error?.response?.data,
        message: error?.message
      });
      const message = error?.response?.data?.message || error?.message || 'Không thể lưu banner';
      showToast(message, 'error');
    } finally {
      setLoading(false);
    }
  };

  const isValidImageFile = (file: File): boolean => {
    const allowedExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.webp'];
    const allowedMimeTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
    const fileExtension = file.name.substring(file.name.lastIndexOf('.')).toLowerCase();

    return allowedExtensions.includes(fileExtension) && allowedMimeTypes.includes(file.type);
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (!isValidImageFile(file)) {
        setErrors(prev => ({ ...prev, bannerImageUrl: 'Chỉ chấp nhận các tệp ảnh (.jpg, .png, .gif, .webp).' }));
        e.target.value = ''; // Reset input
        return;
      }

      // Clear error if file is valid
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors.bannerImageUrl;
        return newErrors;
      });

      setImageFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        const result = reader.result as string;
        setImagePreview(result);
      };
      reader.readAsDataURL(file);
    } else {
      // Clear file and preview if user cancels file selection
      setImageFile(null);
      setImagePreview(banner?.bannerImageUrl || '');
    }
  };

  const formatDateForDisplay = (dateString?: string | null) => {
    if (!dateString) return 'Chưa có';
    return new Date(dateString).toLocaleDateString('vi-VN');
  };

  const today = new Date().toISOString().split('T')[0];

  return (
    <form onSubmit={handleSubmit} className={styles.form}>
      <div className={styles.formContent}>
        {/* Banner Title */}
        <div className={styles.formGroup}>
          <label className={styles.label}>
            <i className="bi bi-pencil"></i>
            Tiêu đề banner <span className={styles.required}>*</span>
          </label>
          <input
            type="text"
            value={formData.bannerTitle}
            name="bannerTitle"
            onChange={e => {
              setFormData(prev => ({ ...prev, bannerTitle: e.target.value }));
              if (errors.bannerTitle) {
                const newErrors = { ...errors };
                delete newErrors.bannerTitle;
                setErrors(newErrors);
              }
            }}
            onBlur={handleBlur}
            className={`${styles.input} ${errors.bannerTitle ? styles.inputError : ''}`}
            disabled={mode === 'view'}
            placeholder="Nhập tiêu đề banner"
            maxLength={200}
          />
          {errors.bannerTitle && <span className={styles.errorText}>{errors.bannerTitle}</span>}
          {mode !== 'view' && (
            <span className={styles.helpText}>{formData.bannerTitle.length}/200 ký tự</span>
          )}
        </div>

        {/* Banner Image */}
        <div className={styles.formGroup}>
          <label className={styles.label}>
            <i className="bi bi-image"></i>
            Ảnh banner <span className={styles.required}>*</span>
          </label>
          {mode === 'view' ? (
            <div className={styles.imageViewContainer}>
              {imagePreview ? (
                <img src={imagePreview} alt="Preview" className={styles.imagePreview} />
              ) : (
                <div className={styles.noImage}>Không có ảnh</div>
              )}
            </div>
          ) : (
            <>
              <input
                type="file"
                accept="image/*"
                onChange={handleImageChange}
                className={styles.fileInput}
                id="bannerImage"
              />
              <label htmlFor="bannerImage" className={styles.fileInputLabel}>
                <i className="bi bi-cloud-upload"></i>
                <span>{imageFile ? imageFile.name : imagePreview ? 'Chọn ảnh khác' : 'Chọn ảnh banner'}</span>
              </label>
              {imagePreview && (
                <div className={styles.imagePreviewContainer}>
                  <img src={imagePreview} alt="Preview" className={styles.imagePreview} />
                  {mode === 'edit' && (
                    <button
                      type="button"
                      onClick={() => {
                        setImagePreview('');
                        setImageFile(null);
                      }}
                      className={styles.removeImageBtn}
                    >
                      <i className="bi bi-x"></i>
                    </button>
                  )}
                </div>
              )}
              {errors.bannerImageUrl && <span className={styles.errorText}>{errors.bannerImageUrl}</span>}
            </>
          )}
        </div>

        {/* Display in 2 columns */}
        <div className={styles.gridTwoCols}>
          {/* Banner URL */}
          

          {/* Display Order */}
          <div className={styles.formGroup}>
            <label className={styles.label}>
              <i className="bi bi-list-ol"></i>
              Thứ tự hiển thị
            </label>
            <input
              type="number"
              value={formData.displayOrder}
              onChange={e => {
                setFormData(prev => ({ ...prev, displayOrder: parseInt(e.target.value) || 0 }));
                if (errors.displayOrder) {
                  const newErrors = { ...errors };
                  delete newErrors.displayOrder;
                  setErrors(newErrors);
                }
              }}
              className={`${styles.input} ${errors.displayOrder ? styles.inputError : ''}`}
              disabled={mode === 'view'}
              placeholder="0"
              min="0"
            />
            {errors.displayOrder && <span className={styles.errorText}>{errors.displayOrder}</span>}
            {mode !== 'view' && (
              <span className={styles.helpText}>Số càng nhỏ, banner hiển thị trước</span>
            )}
          </div>
        </div>

        
        {/* Date Range */}
        <div className={styles.formGroup}>
          <label className={styles.label}>
            <i className="bi bi-calendar-range"></i> Thời gian hiển thị <span className={styles.required}>*</span>
          </label>
          <div className={styles.gridTwoCols}>
            <div className={styles.formGroup}>
              <label className={styles.label}>
                <i className="bi bi-calendar-event"></i>
                Từ ngày
              </label>
              <input
                type="date"
                value={startDateLocal}
                onChange={e => {
                  setStartDateLocal(e.target.value);
                  if (errors.dateRange || errors.startDate) {
                    const newErrors = { ...errors };
                    delete newErrors.dateRange;
                    delete newErrors.startDate;
                    setErrors(newErrors);
                  }
                }}
                max="9999-12-31"
                className={`${styles.input} ${errors.dateRange || errors.startDate ? styles.inputError : ''}`}
                disabled={mode === 'view'}
              />
            </div>
            <div className={styles.formGroup}>
              <label className={styles.label}>
                <i className="bi bi-calendar-check"></i>
                Đến ngày
              </label>
              <input
                type="date"
                value={endDateLocal}
                onChange={e => {
                  setEndDateLocal(e.target.value);
                  if (errors.dateRange || errors.endDate) {
                    const newErrors = { ...errors };
                    delete newErrors.dateRange;
                    delete newErrors.endDate;
                    setErrors(newErrors);
                  }
                }}
                min={startDateLocal || today}
                max="9999-12-31"
                className={`${styles.input} ${errors.dateRange || errors.endDate ? styles.inputError : ''}`}
                disabled={mode === 'view'}
              />
            </div>
          </div>
          {errors.dateRange && <p className={styles.errorText}>{errors.dateRange}</p>}
          {mode !== 'view' && (
            <span className={styles.helpText}>Banner sẽ tự động ẩn khi hết hạn</span>
          )}
          {errors.startDate && <p className={styles.errorText}>{errors.startDate}</p>}
          {errors.endDate && <p className={styles.errorText}>{errors.endDate}</p>}
        </div>
{/* Status */}
        <div className={styles.formGroup}>
          <label className={styles.label}>
            <i className="bi bi-power"></i>
            Trạng thái hoạt động
          </label>
          <div className={styles.toggleContainer}>
            <label className={styles.toggleLabel}>
              <input
                type="checkbox"
                checked={formData.isActive}
                onChange={e => setFormData(prev => ({ ...prev, isActive: e.target.checked }))}
                disabled={mode === 'view'}
                className={styles.toggleInput}
              />
              <span className={`${styles.toggleSwitch} ${formData.isActive ? styles.active : ''}`}>
                <span className={styles.toggleSlider}></span>
              </span>
              <span className={styles.toggleText}>
                {formData.isActive ? 'Đang hoạt động' : 'Tạm dừng'}
              </span>
            </label>
            <p className={styles.helpText}>
              {formData.isActive 
                ? 'Banner sẽ hiển thị trên trang chủ và các trang khác' 
                : 'Banner sẽ không hiển thị cho đến khi được kích hoạt'}
            </p>
          </div>
        </div>

        {/* View mode - show additional info */}
        {mode === 'view' && banner && (
          <div className={styles.viewInfoSection}>
            <div className={styles.infoCard}>
              <div className={styles.infoLabel}>
                <i className="bi bi-calendar-plus"></i> Ngày tạo
              </div>
              <div className={styles.infoValue}>{formatDateForDisplay(banner.createdAt)}</div>
            </div>
            <div className={styles.infoCard}>
              <div className={styles.infoLabel}>
                <i className="bi bi-lock"></i> Trạng thái khóa
              </div>
              <div className={styles.infoValue}>
                <span className={`${styles.infoBadge} ${banner.isLocked ? styles.locked : styles.unlocked}`}>
                  {banner.isLocked ? 'Đã khóa' : 'Chưa khóa'}
                </span>
              </div>
            </div>
          </div>
        )}

        {/* Action Buttons */}
        {mode !== 'view' && (
          <div className={styles.formActions}>
            <button type="button" onClick={onCancel} className={styles.cancelButton} disabled={loading}>
              <i className="bi bi-x-circle"></i>
              Hủy
            </button>
            <button type="submit" disabled={loading} className={styles.saveButton}>
              {loading ? (
                <>
                  <i className="bi bi-hourglass-split"></i>
                  Đang lưu...
                </>
              ) : (
                <>
                  <i className="bi bi-check-circle"></i>
                  {mode === 'create' ? 'Tạo Banner' : 'Lưu thay đổi'}
                </>
              )}
            </button>
          </div>
        )}

        {mode === 'view' && (
          <div className={styles.formActions}>
            <button type="button" onClick={onCancel} className={styles.saveButton}>
              <i className="bi bi-x-circle"></i>
              Đóng
            </button>
          </div>
        )}
      </div>
    </form>
  );
}
