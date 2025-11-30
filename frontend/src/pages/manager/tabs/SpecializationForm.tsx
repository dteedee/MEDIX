import React, { useState, useEffect } from 'react';
import { useToast } from '../../../contexts/ToastContext';
import specializationService, { SpecializationListDto } from '../../../services/specializationService';
import styles from '../../../styles/admin/ArticleForm.module.css';

interface SpecializationFormProps {
  specialization: SpecializationListDto | null;
  mode: 'create' | 'edit' | 'view';
  onSaved: () => void;
  onCancel: () => void;
}

const SpecializationForm: React.FC<SpecializationFormProps> = ({
  specialization,
  mode,
  onSaved,
  onCancel,
}) => {
  const { showToast } = useToast();
  const [formData, setFormData] = useState({
    code: '',
    name: '',
    description: '',
    imageUrl: '',
    isActive: true,
  });
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [imagePreview, setImagePreview] = useState<string>('');
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imageError, setImageError] = useState(false);

  useEffect(() => {
    if (specialization) {
      setFormData({
        code: specialization.code || '',
        name: specialization.name || '',
        description: specialization.description || '',
        imageUrl: specialization.imageUrl || '',
        isActive: specialization.isActive ?? true,
      });
      setImagePreview(specialization.imageUrl || '');
    } else {
      // Reset form when creating new
      setFormData({
        code: '',
        name: '',
        description: '',
        imageUrl: '',
        isActive: true,
      });
      setImagePreview('');
    }
    setImageError(false);
    setImageFile(null);
  }, [specialization]);

  const getImageUrl = (url: string) => {
    if (!url) return '';
    if (url.startsWith('http') || url.startsWith('/')) {
      return url;
    }
    return `/images/specialties/${url}`;
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
        setErrors(prev => ({ ...prev, imageUrl: 'Chỉ chấp nhận các tệp ảnh (.jpg, .png, .gif, .webp).' }));
        e.target.value = '';
        return;
      }

      // Clear error if file is valid
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors.imageUrl;
        return newErrors;
      });

      setImageFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        const result = reader.result as string;
        setImagePreview(result);
        setImageError(false);
      };
      reader.readAsDataURL(file);
    } else {
      setImageFile(null);
      setImagePreview(specialization?.imageUrl || '');
    }
  };


  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.code.trim()) {
      newErrors.code = 'Mã chuyên khoa không được để trống';
    } else if (formData.code.length > 50) {
      newErrors.code = 'Mã chuyên khoa không được vượt quá 50 ký tự';
    }

    if (!formData.name.trim()) {
      newErrors.name = 'Tên chuyên khoa không được để trống';
    } else if (formData.name.length > 200) {
      newErrors.name = 'Tên chuyên khoa không được vượt quá 200 ký tự';
    }

    if (formData.description && formData.description.length > 1000) {
      newErrors.description = 'Mô tả không được vượt quá 1000 ký tự';
    }

    if (mode === 'create' && !imagePreview && !formData.imageUrl) {
      newErrors.imageUrl = 'Vui lòng chọn ảnh hoặc nhập URL ảnh';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (mode === 'view') return;

    if (!validate()) {
      showToast('Vui lòng kiểm tra lại các trường dữ liệu', 'error');
      return;
    }

    setLoading(true);
    try {
      // Determine imageUrl to send
      // Always send imageUrl (even if empty) so backend knows what to do
      let finalImageUrl: string = formData.imageUrl || '';
      
      // If no new file and we're editing, use existing imageUrl from specialization
      if (!imageFile && mode === 'edit' && specialization) {
        if (!finalImageUrl && specialization.imageUrl) {
          finalImageUrl = specialization.imageUrl;
        } else if (imagePreview && imagePreview.startsWith('http')) {
          // Use preview URL if it's a full URL
          finalImageUrl = imagePreview;
        }
      } else if (imagePreview && imagePreview.startsWith('http') && !imageFile) {
        // Use preview URL if it's a full URL and no new file
        finalImageUrl = imagePreview;
      }

      // Prepare payload
      const payload = {
        code: formData.code.trim(),
        name: formData.name.trim(),
        description: formData.description?.trim() || '',
        imageUrl: finalImageUrl,
        isActive: formData.isActive,
        imageFile: imageFile || undefined,
      };

      console.log('Submitting specialization:', {
        mode,
        payload: { ...payload, imageFile: imageFile ? `${imageFile.name} (${imageFile.size} bytes)` : 'none' }
      });

      if (mode === 'create') {
        await specializationService.create(payload);
      } else {
        await specializationService.update(specialization!.id, payload);
      }
      showToast(
        `Đã ${mode === 'create' ? 'tạo' : 'cập nhật'} chuyên khoa thành công`,
        'success'
      );
      onSaved();
    } catch (error: any) {
    
      
      if (error.response?.status === 400) {
        const errorData = error.response.data;
        if (errorData?.errors) {
          const errorMessages = Object.values(errorData.errors).flat().join(', ');
          showToast(`Lỗi validation: ${errorMessages}`, 'error');
        } else if (errorData?.message) {
          showToast(errorData.message, 'error');
        } else {
          showToast('Dữ liệu không hợp lệ. Vui lòng kiểm tra lại.', 'error');
        }
      } else {
        const errorMessage = error.response?.data?.message || error.message || 'Có lỗi xảy ra';
        showToast(errorMessage, 'error');
      }
    } finally {
      setLoading(false);
    }
  };

  const isReadOnly = mode === 'view';

  return (
    <form onSubmit={handleSubmit} className={styles.form}>
      <div className={styles.formContent}>
        {isReadOnly && specialization && (
          <div style={{ 
            display: 'grid', 
            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', 
            gap: '20px', 
            marginBottom: '32px' 
          }}>
            <div style={{ 
              background: 'linear-gradient(135deg, #e0f2fe 0%, #bae6fd 100%)', 
              padding: '24px', 
              borderRadius: '16px', 
              border: '2px solid #7dd3fc',
              boxShadow: '0 4px 12px rgba(14, 165, 233, 0.15)',
              transition: 'transform 0.2s ease'
            }}>
              <div style={{ fontSize: '14px', color: '#0369a1', marginBottom: '12px', fontWeight: '600', display: 'flex', alignItems: 'center' }}>
                <i className="bi bi-people-fill" style={{ marginRight: '8px', fontSize: '18px' }}></i>
                Số bác sĩ đăng ký
              </div>
              <div style={{ fontSize: '32px', fontWeight: 'bold', color: '#0c4a6e', lineHeight: '1.2' }}>
                {specialization.doctorCount || 0}
              </div>
              <div style={{ fontSize: '12px', color: '#0284c7', marginTop: '8px', opacity: 0.8 }}>
                Bác sĩ đang hoạt động
              </div>
            </div>
            <div style={{ 
              background: specialization.isActive 
                ? 'linear-gradient(135deg, #dcfce7 0%, #86efac 100%)' 
                : 'linear-gradient(135deg, #fee2e2 0%, #fca5a5 100%)', 
              padding: '24px', 
              borderRadius: '16px', 
              border: `2px solid ${specialization.isActive ? '#4ade80' : '#f87171'}`,
              boxShadow: `0 4px 12px rgba(${specialization.isActive ? '34, 197, 94' : '239, 68, 68'}, 0.15)`
            }}>
              <div style={{ fontSize: '14px', color: specialization.isActive ? '#166534' : '#991b1b', marginBottom: '12px', fontWeight: '600', display: 'flex', alignItems: 'center' }}>
                <i className={`bi ${specialization.isActive ? 'bi-check-circle-fill' : 'bi-x-circle-fill'}`} style={{ marginRight: '8px', fontSize: '18px' }}></i>
                Trạng thái hoạt động
              </div>
              <div style={{ fontSize: '20px', fontWeight: '700', color: specialization.isActive ? '#15803d' : '#dc2626', lineHeight: '1.2' }}>
                {specialization.isActive ? 'Đang hoạt động' : 'Tạm dừng'}
              </div>
              <div style={{ fontSize: '12px', color: specialization.isActive ? '#16a34a' : '#dc2626', marginTop: '8px', opacity: 0.8 }}>
                {specialization.isActive ? 'Hiển thị cho người dùng' : 'Ẩn khỏi danh sách'}
              </div>
            </div>
            {specialization.createdAt && (
              <div style={{ 
                background: 'linear-gradient(135deg, #fef3c7 0%, #fde047 100%)', 
                padding: '24px', 
                borderRadius: '16px', 
                border: '2px solid #facc15',
                boxShadow: '0 4px 12px rgba(234, 179, 8, 0.15)'
              }}>
                <div style={{ fontSize: '14px', color: '#92400e', marginBottom: '12px', fontWeight: '600', display: 'flex', alignItems: 'center' }}>
                  <i className="bi bi-calendar-plus-fill" style={{ marginRight: '8px', fontSize: '18px' }}></i>
                  Ngày tạo
                </div>
                <div style={{ fontSize: '16px', fontWeight: '700', color: '#78350f', lineHeight: '1.3' }}>
                  {new Date(specialization.createdAt).toLocaleDateString('vi-VN', { 
                    year: 'numeric', 
                    month: 'long', 
                    day: 'numeric' 
                  })}
                </div>
                <div style={{ fontSize: '12px', color: '#a16207', marginTop: '8px', opacity: 0.8 }}>
                  {new Date(specialization.createdAt).toLocaleTimeString('vi-VN', { 
                    hour: '2-digit', 
                    minute: '2-digit' 
                  })}
                </div>
              </div>
            )}
            {specialization.updatedAt && (
              <div style={{ 
                background: 'linear-gradient(135deg, #fce7f3 0%, #f9a8d4 100%)', 
                padding: '24px', 
                borderRadius: '16px', 
                border: '2px solid #f472b6',
                boxShadow: '0 4px 12px rgba(236, 72, 153, 0.15)'
              }}>
                <div style={{ fontSize: '14px', color: '#9f1239', marginBottom: '12px', fontWeight: '600', display: 'flex', alignItems: 'center' }}>
                  <i className="bi bi-calendar-check-fill" style={{ marginRight: '8px', fontSize: '18px' }}></i>
                  Cập nhật lần cuối
                </div>
                <div style={{ fontSize: '16px', fontWeight: '700', color: '#831843', lineHeight: '1.3' }}>
                  {new Date(specialization.updatedAt).toLocaleDateString('vi-VN', { 
                    year: 'numeric', 
                    month: 'long', 
                    day: 'numeric' 
                  })}
                </div>
                <div style={{ fontSize: '12px', color: '#be185d', marginTop: '8px', opacity: 0.8 }}>
                  {new Date(specialization.updatedAt).toLocaleTimeString('vi-VN', { 
                    hour: '2-digit', 
                    minute: '2-digit' 
                  })}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Basic Information Section */}
        <div style={{ 
          padding: '24px', 
          background: 'linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%)', 
          borderRadius: '16px', 
          border: '1px solid #e2e8f0',
          marginBottom: '8px'
        }}>
          <h3 style={{ 
            fontSize: '18px', 
            fontWeight: '700', 
            color: '#1e293b', 
            marginBottom: '20px',
            display: 'flex',
            alignItems: 'center',
            gap: '10px'
          }}>
            <i className="bi bi-info-circle-fill" style={{ color: '#667eea', fontSize: '20px' }}></i>
            Thông tin cơ bản
          </h3>

        {/* Code */}
          <div className={styles.formGroup} style={{ marginBottom: '24px' }}>
          <label className={styles.label}>
            <i className="bi bi-tag-fill"></i>
            Mã chuyên khoa <span className={styles.required}>*</span>
          </label>
          <input
            type="text"
            value={formData.code}
            onChange={(e) => {
              const value = e.target.value.toUpperCase().replace(/\s+/g, '_');
              setFormData({ ...formData, code: value });
              if (errors.code) {
                const newErrors = { ...errors };
                delete newErrors.code;
                setErrors(newErrors);
              }
            }}
            className={`${styles.input} ${errors.code ? styles.inputError : ''}`}
            required
            disabled={isReadOnly}
            placeholder="VD: CO_XUONG_KHOP"
            maxLength={50}
            style={{ textTransform: 'uppercase', fontFamily: 'monospace' }}
          />
          {errors.code && <span className={styles.errorText}>{errors.code}</span>}
          {!isReadOnly && (
            <span className={styles.helpText}>
                <i className="bi bi-lightbulb" style={{ marginRight: '6px' }}></i>
                Mã sẽ tự động chuyển thành chữ hoa và thay khoảng trắng bằng dấu gạch dưới. Mã này dùng để định danh duy nhất cho chuyên khoa. {formData.code.length}/50 ký tự
            </span>
          )}
        </div>

        {/* Name */}
          <div className={styles.formGroup} style={{ marginBottom: '24px' }}>
          <label className={styles.label}>
            <i className="bi bi-hospital-fill"></i>
            Tên chuyên khoa <span className={styles.required}>*</span>
          </label>
          <input
            type="text"
            value={formData.name}
            onChange={(e) => {
              setFormData({ ...formData, name: e.target.value });
              if (errors.name) {
                const newErrors = { ...errors };
                delete newErrors.name;
                setErrors(newErrors);
              }
            }}
            className={`${styles.input} ${errors.name ? styles.inputError : ''}`}
            required
            disabled={isReadOnly}
              placeholder="VD: Cơ xương khớp (Thấp khớp học)"
            maxLength={200}
          />
          {errors.name && <span className={styles.errorText}>{errors.name}</span>}
          {!isReadOnly && (
              <span className={styles.helpText}>
                <i className="bi bi-lightbulb" style={{ marginRight: '6px' }}></i>
                Tên hiển thị của chuyên khoa sẽ xuất hiện trên giao diện người dùng và bác sĩ. {formData.name.length}/200 ký tự
              </span>
          )}
        </div>

        {/* Description */}
        <div className={styles.formGroup}>
          <label className={styles.label}>
            <i className="bi bi-file-text-fill"></i>
              Mô tả chi tiết
          </label>
          <textarea
            value={formData.description}
            onChange={(e) => {
              setFormData({ ...formData, description: e.target.value });
              if (errors.description) {
                const newErrors = { ...errors };
                delete newErrors.description;
                setErrors(newErrors);
              }
            }}
            className={`${styles.textarea} ${errors.description ? styles.inputError : ''}`}
            disabled={isReadOnly}
              rows={6}
              placeholder="Mô tả chi tiết về chuyên khoa, các dịch vụ, phương pháp điều trị và công nghệ sử dụng. Ví dụ: Điều trị các bệnh viêm khớp, lupus, gút và các rối loạn tự miễn..."
            maxLength={1000}
            style={{ resize: 'vertical' }}
          />
          {errors.description && <span className={styles.errorText}>{errors.description}</span>}
          {!isReadOnly && (
            <span className={styles.helpText}>
                <i className="bi bi-lightbulb" style={{ marginRight: '6px' }}></i>
                Mô tả chi tiết sẽ giúp người dùng hiểu rõ hơn về chuyên khoa này, các dịch vụ và phương pháp điều trị. {formData.description.length}/1000 ký tự
            </span>
          )}
          </div>
        </div>

        {/* Image Section */}
        <div style={{ 
          padding: '24px', 
          background: 'linear-gradient(135deg, #fef3f2 0%, #fee2e2 100%)', 
          borderRadius: '16px', 
          border: '1px solid #fecaca',
          marginBottom: '8px'
        }}>
          <h3 style={{ 
            fontSize: '18px', 
            fontWeight: '700', 
            color: '#1e293b', 
            marginBottom: '20px',
            display: 'flex',
            alignItems: 'center',
            gap: '10px'
          }}>
            <i className="bi bi-image-fill" style={{ color: '#667eea', fontSize: '20px' }}></i>
            Hình ảnh chuyên khoa
            {mode === 'create' && <span className={styles.required}>*</span>}
          </h3>
          
        <div className={styles.formGroup}>
          <label className={styles.label} style={{ marginBottom: '12px' }}>
            <i className="bi bi-image"></i>
            Ảnh đại diện {mode === 'create' && <span className={styles.required}>*</span>}
          </label>
          
          {mode === 'view' ? (
            <div style={{
              marginTop: '12px',
              width: '100%',
              maxWidth: '600px',
              height: '400px',
              background: '#f9fafb',
              borderRadius: '14px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              border: '2px solid #e5e7eb',
              overflow: 'hidden'
            }}>
              {imagePreview ? (
                <img 
                  src={getImageUrl(imagePreview)} 
                  alt="Preview" 
                  style={{
                    width: '100%',
                    height: '100%',
                    objectFit: 'cover',
                    borderRadius: '12px'
                  }}
                  onError={() => setImageError(true)}
                />
              ) : (
                <div className={styles.noImage}>Không có ảnh</div>
              )}
            </div>
          ) : (
            <>
              {/* File Upload - Larger */}
              <input
                type="file"
                accept="image/*"
                onChange={handleImageChange}
                className={styles.fileInput}
                id="specializationImage"
              />
              <label htmlFor="specializationImage" className={styles.fileInputLabel} style={{
                padding: '24px 32px',
                fontSize: '16px',
                minHeight: '80px',
                justifyContent: 'center'
              }}>
                <i className="bi bi-cloud-upload" style={{ fontSize: '28px' }}></i>
                <span>{imageFile ? `Đã chọn: ${imageFile.name}` : imagePreview ? 'Chọn ảnh khác' : 'Chọn ảnh chuyên khoa (Kéo thả hoặc click để chọn)'}</span>
              </label>
              
              {errors.imageUrl && <span className={styles.errorText}>{errors.imageUrl}</span>}
              <span className={styles.helpText}>
                Upload ảnh trực tiếp. Hỗ trợ các định dạng: JPG, PNG, GIF, WEBP
              </span>

              {/* Image Preview - Larger */}
              {imagePreview && (
                <div style={{
                  marginTop: '20px',
                  width: '100%',
                  maxWidth: '600px',
                  position: 'relative',
                  borderRadius: '14px',
                  overflow: 'hidden',
                  border: '2px solid #e5e7eb',
                  boxShadow: '0 4px 16px rgba(0,0,0,0.1)'
                }}>
                  {!imageError ? (
                    <img 
                      src={imagePreview.startsWith('data:') || imagePreview.startsWith('http') 
                        ? imagePreview 
                        : getImageUrl(imagePreview)} 
                      alt="Preview" 
                      style={{
                        width: '100%',
                        height: 'auto',
                        maxHeight: '500px',
                        objectFit: 'contain',
                        display: 'block',
                        background: '#f9fafb'
                      }}
                      onError={() => setImageError(true)}
                    />
                  ) : (
                    <div style={{ 
                      padding: '60px 40px', 
                      color: '#dc2626', 
                      fontSize: '15px',
                      background: '#fee2e2',
                      borderRadius: '12px',
                      border: '1px solid #fca5a5',
                      textAlign: 'center'
                    }}>
                      <i className="bi bi-exclamation-triangle-fill" style={{ fontSize: '32px', marginBottom: '12px', display: 'block' }}></i>
                      Không thể tải ảnh. Vui lòng kiểm tra lại đường dẫn.
                    </div>
                  )}
                  <button
                    type="button"
                    onClick={() => {
                      setImagePreview('');
                      setImageFile(null);
                      setFormData({ ...formData, imageUrl: '' });
                      setImageError(false);
                      // Reset file input
                      const fileInput = document.getElementById('specializationImage') as HTMLInputElement;
                      if (fileInput) fileInput.value = '';
                    }}
                    className={styles.removeImageBtn}
                    style={{
                      width: '42px',
                      height: '42px',
                      fontSize: '18px'
                    }}
                    title="Xóa ảnh"
                    >
                      <i className="bi bi-x"></i>
                    </button>
                </div>
              )}
            </>
          )}
        </div>
        </div>

        {/* Status Section */}
        <div style={{ 
          padding: '24px', 
          background: 'linear-gradient(135deg, #f0fdf4 0%, #dcfce7 100%)', 
          borderRadius: '16px', 
          border: '1px solid #bbf7d0',
          marginBottom: '8px'
        }}>
          <h3 style={{ 
            fontSize: '18px', 
            fontWeight: '700', 
            color: '#1e293b', 
            marginBottom: '20px',
            display: 'flex',
            alignItems: 'center',
            gap: '10px'
          }}>
            <i className="bi bi-power" style={{ color: '#667eea', fontSize: '20px' }}></i>
            Trạng thái hoạt động
          </h3>
          
        {!isReadOnly && (
          <div className={styles.formGroup}>
            <div className={styles.toggleContainer}>
              <label className={styles.toggleLabel}>
                <input
                  type="checkbox"
                  checked={formData.isActive}
                  onChange={e => setFormData({ ...formData, isActive: e.target.checked })}
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
                  <i className="bi bi-info-circle" style={{ marginRight: '6px' }}></i>
                {formData.isActive 
                    ? 'Chuyên khoa sẽ hiển thị cho người dùng và bác sĩ có thể đăng ký. Người dùng có thể tìm kiếm và chọn chuyên khoa này khi đặt lịch hẹn.' 
                    : 'Chuyên khoa sẽ không hiển thị cho đến khi được kích hoạt. Bác sĩ không thể đăng ký chuyên khoa này.'}
              </p>
            </div>
          </div>
        )}

        {isReadOnly && (
          <div className={styles.formGroup}>
            <div style={{ 
                display: 'inline-flex', 
                alignItems: 'center',
                padding: '14px 20px', 
                borderRadius: '12px',
              fontWeight: '600',
                fontSize: '16px',
              background: specialization?.isActive 
                ? 'linear-gradient(135deg, #dcfce7 0%, #86efac 100%)' 
                : 'linear-gradient(135deg, #fee2e2 0%, #fca5a5 100%)',
              color: specialization?.isActive ? '#166534' : '#991b1b',
              border: `2px solid ${specialization?.isActive ? '#4ade80' : '#f87171'}`,
                boxShadow: `0 4px 12px rgba(${specialization?.isActive ? '34, 197, 94' : '239, 68, 68'}, 0.2)`,
                gap: '10px'
            }}>
                <i className={`bi ${specialization?.isActive ? 'bi-check-circle-fill' : 'bi-x-circle-fill'}`} style={{ fontSize: '20px' }}></i>
                <span>{specialization?.isActive ? 'Đang hoạt động' : 'Tạm dừng'}</span>
              </div>
              <p className={styles.helpText} style={{ marginTop: '12px' }}>
                <i className="bi bi-info-circle" style={{ marginRight: '6px' }}></i>
                {specialization?.isActive 
                  ? 'Chuyên khoa này đang được hiển thị và có thể được sử dụng bởi người dùng và bác sĩ.' 
                  : 'Chuyên khoa này đang bị tạm dừng và không hiển thị cho người dùng.'}
              </p>
            </div>
          )}
          </div>

        {/* Action Buttons */}
        {!isReadOnly && (
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
                  <i className={`bi ${mode === 'create' ? 'bi-plus-circle-fill' : 'bi-check-circle'}`}></i>
                  {mode === 'create' ? 'Tạo chuyên khoa' : 'Cập nhật'}
                </>
              )}
            </button>
          </div>
        )}

        {isReadOnly && (
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
};

export default SpecializationForm;
