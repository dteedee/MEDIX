import React, { useState, useEffect } from 'react';
import { BannerDTO, CreateBannerRequest, UpdateBannerRequest } from '../../types/banner.types';
import { useToast } from '../../contexts/ToastContext';
import { bannerService } from '../../services/bannerService';
import styles from '../../styles/admin/BannerForm.module.css';

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
    startDate: banner?.startDate ? banner.startDate.split('T')[0] : '',
    endDate: banner?.endDate ? banner.endDate.split('T')[0] : '',
  });

  const [imagePreview, setImagePreview] = useState<string>(banner?.bannerImageUrl || '');
  const [imageFile, setImageFile] = useState<File | null>(null);

  useEffect(() => {
    if (banner) {
      setFormData({
        bannerTitle: banner.bannerTitle || '',
        bannerImageUrl: banner.bannerImageUrl || '',
        bannerUrl: banner.bannerUrl || '',
        displayOrder: banner.displayOrder || 0,
        isActive: banner.isActive ?? true,
        startDate: banner.startDate ? banner.startDate.split('T')[0] : '',
        endDate: banner.endDate ? banner.endDate.split('T')[0] : '',
      });
      setImagePreview(banner.bannerImageUrl || '');
    }
  }, [banner]);

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

    if (formData.startDate && formData.endDate) {
      const start = new Date(formData.startDate);
      const end = new Date(formData.endDate);
      if (start > end) {
        newErrors.dateRange = 'Ngày bắt đầu phải trước ngày kết thúc';
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

    const payload: CreateBannerRequest | UpdateBannerRequest = {
      bannerTitle: formData.bannerTitle,
      bannerImageUrl: formData.bannerImageUrl,
      bannerUrl: formData.bannerUrl || undefined,
      displayOrder: formData.displayOrder || undefined,
      isActive: formData.isActive,
      startDate: formData.startDate || undefined,
      endDate: formData.endDate || undefined,
      bannerFile: imageFile || undefined,
    };

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
        await bannerService.create(payload as CreateBannerRequest);
        showToast('Tạo banner thành công!', 'success');
      } else if (banner) {
        await bannerService.update(banner.id, payload);
        showToast('Cập nhật banner thành công!', 'success');
      }
      onSaved();
    } catch (error: any) {
      console.error('Error saving banner:', error);
      const message = error?.response?.data?.message || error?.message || 'Không thể lưu banner';
      showToast(message, 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setImageFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        const result = reader.result as string;
        setImagePreview(result);
      };
      reader.readAsDataURL(file);
    }
  };

  const formatDateForDisplay = (dateString?: string | null) => {
    if (!dateString) return 'Chưa có';
    return new Date(dateString).toLocaleDateString('vi-VN');
  };

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
            onChange={e => setFormData(prev => ({ ...prev, bannerTitle: e.target.value }))}
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
                      <i className="bi bi-trash"></i> Xóa ảnh
                    </button>
                  )}
                </div>
              )}
              {errors.bannerImageUrl && <span className={styles.errorText}>{errors.bannerImageUrl}</span>}
            </>
          )}
        </div>

        {/* Display in 2 columns */}
        <div className={styles.twoColumnGrid}>
          {/* Banner URL */}
          <div className={styles.formGroup}>
            <label className={styles.label}>
              <i className="bi bi-link-45deg"></i>
              Đường dẫn URL (tùy chọn)
            </label>
            <input
              type="text"
              value={formData.bannerUrl}
              onChange={e => setFormData(prev => ({ ...prev, bannerUrl: e.target.value }))}
              className={`${styles.input} ${errors.bannerUrl ? styles.inputError : ''}`}
              disabled={mode === 'view'}
              placeholder="https://example.com"
            />
            {errors.bannerUrl && <span className={styles.errorText}>{errors.bannerUrl}</span>}
          </div>

          {/* Display Order */}
          <div className={styles.formGroup}>
            <label className={styles.label}>
              <i className="bi bi-list-ol"></i>
              Thứ tự hiển thị
            </label>
            <input
              type="number"
              value={formData.displayOrder}
              onChange={e => setFormData(prev => ({ ...prev, displayOrder: parseInt(e.target.value) || 0 }))}
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

        {/* Date Range */}
        <div className={styles.formGroup}>
          <label className={styles.label}>
            <i className="bi bi-calendar-range"></i>
            Thời gian hiển thị (tùy chọn)
          </label>
          <div className={styles.dateRangeContainer}>
            <div className={styles.dateInputGroup}>
              <label className={styles.dateLabel}>
                <i className="bi bi-calendar-event"></i>
                Từ ngày
              </label>
              <input
                type="date"
                value={formData.startDate}
                onChange={e => setFormData(prev => ({ ...prev, startDate: e.target.value }))}
                className={`${styles.input} ${styles.dateInput}`}
                disabled={mode === 'view'}
              />
              {mode === 'view' && formData.startDate && (
                <span className={styles.dateDisplay}>{formatDateForDisplay(formData.startDate)}</span>
              )}
            </div>
            <div className={styles.dateInputGroup}>
              <label className={styles.dateLabel}>
                <i className="bi bi-calendar-check"></i>
                Đến ngày
              </label>
              <input
                type="date"
                value={formData.endDate}
                onChange={e => setFormData(prev => ({ ...prev, endDate: e.target.value }))}
                className={`${styles.input} ${styles.dateInput}`}
                disabled={mode === 'view'}
              />
              {mode === 'view' && formData.endDate && (
                <span className={styles.dateDisplay}>{formatDateForDisplay(formData.endDate)}</span>
              )}
            </div>
          </div>
          {errors.dateRange && <span className={styles.errorText}>{errors.dateRange}</span>}
          {mode !== 'view' && (
            <span className={styles.helpText}>Banner sẽ tự động ẩn khi hết hạn</span>
          )}
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
              <i className="bi bi-x-lg"></i>
              Hủy
            </button>
            <button type="submit" disabled={loading} className={styles.submitButton}>
              {loading ? (
                <>
                  <div className={styles.spinner}></div>
                  Đang lưu...
                </>
              ) : (
                <>
                  <i className="bi bi-check-lg"></i>
                  {mode === 'create' ? 'Tạo banner' : 'Cập nhật'}
                </>
              )}
            </button>
          </div>
        )}

        {mode === 'view' && (
          <div className={styles.formActions}>
            <button type="button" onClick={onCancel} className={styles.submitButton}>
              <i className="bi bi-x-lg"></i>
              Đóng
            </button>
          </div>
        )}
      </div>
    </form>
  );
}
