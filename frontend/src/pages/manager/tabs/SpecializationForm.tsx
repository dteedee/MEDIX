import React, { useState, useEffect } from 'react';
import { useToast } from '../../../contexts/ToastContext';
import specializationService, { SpecializationListDto } from '../../../services/specializationService';
import styles from '../../../styles/admin/UserList.module.css';

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
    } else {
      // Reset form when creating new
      setFormData({
        code: '',
        name: '',
        description: '',
        imageUrl: '',
        isActive: true,
      });
    }
    setImageError(false);
  }, [specialization]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (mode === 'view') return;

    setLoading(true);
    try {
      if (mode === 'create') {
        await specializationService.create({
          code: formData.code,
          name: formData.name,
          description: formData.description,
          imageUrl: formData.imageUrl,
          isActive: formData.isActive,
        });
      } else {
        await specializationService.update(specialization!.id, {
          code: formData.code,
          name: formData.name,
          description: formData.description,
          imageUrl: formData.imageUrl,
          isActive: formData.isActive,
        });
      }
      showToast(
        `Đã ${mode === 'create' ? 'tạo' : 'cập nhật'} chuyên khoa thành công`,
        'success'
      );
      onSaved();
    } catch (error: any) {
      showToast(error.response?.data?.message || error.message || 'Có lỗi xảy ra', 'error');
    } finally {
      setLoading(false);
    }
  };

  const isReadOnly = mode === 'view';
  const getImageUrl = (url: string) => {
    if (!url) return '';
    if (url.startsWith('http') || url.startsWith('/')) {
      return url;
    }
    return `/images/specialties/${url}`;
  };

  return (
    <form onSubmit={handleSubmit} className={styles.form}>
      {/* View Mode - Display Info Cards */}
      {isReadOnly && specialization && (
        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', 
          gap: '16px', 
          marginBottom: '24px' 
        }}>
          <div style={{ 
            background: 'linear-gradient(135deg, #e0f2fe 0%, #bae6fd 100%)', 
            padding: '20px', 
            borderRadius: '12px', 
            border: '1px solid #7dd3fc',
            boxShadow: '0 2px 8px rgba(14, 165, 233, 0.1)'
          }}>
            <div style={{ fontSize: '13px', color: '#0369a1', marginBottom: '8px', fontWeight: '500' }}>
              <i className="bi bi-people-fill" style={{ marginRight: '6px' }}></i>
              Số bác sĩ
            </div>
            <div style={{ fontSize: '28px', fontWeight: 'bold', color: '#0c4a6e' }}>
              {specialization.doctorCount || 0}
            </div>
          </div>
          <div style={{ 
            background: specialization.isActive 
              ? 'linear-gradient(135deg, #dcfce7 0%, #86efac 100%)' 
              : 'linear-gradient(135deg, #fee2e2 0%, #fca5a5 100%)', 
            padding: '20px', 
            borderRadius: '12px', 
            border: `1px solid ${specialization.isActive ? '#4ade80' : '#f87171'}`,
            boxShadow: `0 2px 8px rgba(${specialization.isActive ? '34, 197, 94' : '239, 68, 68'}, 0.1)`
          }}>
            <div style={{ fontSize: '13px', color: specialization.isActive ? '#166534' : '#991b1b', marginBottom: '8px', fontWeight: '500' }}>
              <i className={`bi ${specialization.isActive ? 'bi-check-circle-fill' : 'bi-x-circle-fill'}`} style={{ marginRight: '6px' }}></i>
              Trạng thái
            </div>
            <div style={{ fontSize: '18px', fontWeight: '600', color: specialization.isActive ? '#15803d' : '#dc2626' }}>
              {specialization.isActive ? 'Hoạt động' : 'Tạm dừng'}
            </div>
          </div>
          {specialization.createdAt && (
            <div style={{ 
              background: 'linear-gradient(135deg, #fef3c7 0%, #fde047 100%)', 
              padding: '20px', 
              borderRadius: '12px', 
              border: '1px solid #facc15',
              boxShadow: '0 2px 8px rgba(234, 179, 8, 0.1)'
            }}>
              <div style={{ fontSize: '13px', color: '#92400e', marginBottom: '8px', fontWeight: '500' }}>
                <i className="bi bi-calendar-plus-fill" style={{ marginRight: '6px' }}></i>
                Ngày tạo
              </div>
              <div style={{ fontSize: '14px', fontWeight: '600', color: '#78350f' }}>
                {new Date(specialization.createdAt).toLocaleDateString('vi-VN', { 
                  year: 'numeric', 
                  month: 'long', 
                  day: 'numeric' 
                })}
              </div>
            </div>
          )}
          {specialization.updatedAt && (
            <div style={{ 
              background: 'linear-gradient(135deg, #fce7f3 0%, #f9a8d4 100%)', 
              padding: '20px', 
              borderRadius: '12px', 
              border: '1px solid #f472b6',
              boxShadow: '0 2px 8px rgba(236, 72, 153, 0.1)'
            }}>
              <div style={{ fontSize: '13px', color: '#9f1239', marginBottom: '8px', fontWeight: '500' }}>
                <i className="bi bi-calendar-check-fill" style={{ marginRight: '6px' }}></i>
                Cập nhật lần cuối
              </div>
              <div style={{ fontSize: '14px', fontWeight: '600', color: '#831843' }}>
                {new Date(specialization.updatedAt).toLocaleDateString('vi-VN', { 
                  year: 'numeric', 
                  month: 'long', 
                  day: 'numeric' 
                })}
              </div>
            </div>
          )}
        </div>
      )}

      <div className={styles.formGroup}>
        <label>
          <i className="bi bi-tag-fill" style={{ marginRight: '8px', color: '#667eea' }}></i>
          Mã chuyên khoa <span className={styles.required}>*</span>
        </label>
        <input
          type="text"
          value={formData.code}
          onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase().replace(/\s+/g, '_') })}
          required
          disabled={isReadOnly}
          placeholder="VD: CO_XUONG_KHOP"
          style={{ textTransform: 'uppercase', fontFamily: 'monospace' }}
        />
        {!isReadOnly && (
          <small style={{ color: '#6b7280', marginTop: '4px', display: 'block' }}>
            <i className="bi bi-info-circle" style={{ marginRight: '4px' }}></i>
            Mã sẽ tự động chuyển thành chữ hoa và thay khoảng trắng bằng dấu gạch dưới
          </small>
        )}
      </div>

      <div className={styles.formGroup}>
        <label>
          <i className="bi bi-hospital-fill" style={{ marginRight: '8px', color: '#667eea' }}></i>
          Tên chuyên khoa <span className={styles.required}>*</span>
        </label>
        <input
          type="text"
          value={formData.name}
          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          required
          disabled={isReadOnly}
          placeholder="VD: Cơ xương khớp"
        />
      </div>

      <div className={styles.formGroup}>
        <label>
          <i className="bi bi-file-text-fill" style={{ marginRight: '8px', color: '#667eea' }}></i>
          Mô tả
        </label>
        <textarea
          value={formData.description}
          onChange={(e) => setFormData({ ...formData, description: e.target.value })}
          disabled={isReadOnly}
          rows={5}
          placeholder="Mô tả chi tiết về chuyên khoa, các dịch vụ và công nghệ sử dụng..."
          style={{ resize: 'vertical' }}
        />
        {!isReadOnly && (
          <small style={{ color: '#6b7280', marginTop: '4px', display: 'block' }}>
            <i className="bi bi-lightbulb" style={{ marginRight: '4px' }}></i>
            Mô tả chi tiết sẽ giúp người dùng hiểu rõ hơn về chuyên khoa này
          </small>
        )}
      </div>

      <div className={styles.formGroup}>
        <label>
          <i className="bi bi-image-fill" style={{ marginRight: '8px', color: '#667eea' }}></i>
          URL ảnh
        </label>
        <input
          type="text"
          value={formData.imageUrl}
          onChange={(e) => {
            setFormData({ ...formData, imageUrl: e.target.value });
            setImageError(false);
          }}
          disabled={isReadOnly}
          placeholder="/images/specialties/co-xuong-khop.jpg hoặc tên file: co-xuong-khop.jpg"
        />
        <small style={{ color: '#6b7280', marginTop: '4px', display: 'block' }}>
          <i className="bi bi-info-circle" style={{ marginRight: '4px' }}></i>
          Có thể nhập URL đầy đủ hoặc chỉ tên file (sẽ tự động thêm /images/specialties/)
        </small>
        {formData.imageUrl && (
          <div style={{ 
            marginTop: '12px', 
            padding: '16px', 
            background: '#f9fafb', 
            borderRadius: '12px', 
            border: '2px dashed #e5e7eb',
            textAlign: 'center'
          }}>
            <div style={{ fontSize: '12px', color: '#6b7280', marginBottom: '12px', fontWeight: '500' }}>
              <i className="bi bi-eye" style={{ marginRight: '4px' }}></i>
              Preview:
            </div>
            {!imageError ? (
              <img 
                src={getImageUrl(formData.imageUrl)}
                alt="Preview" 
                style={{ 
                  maxWidth: '100%', 
                  maxHeight: '300px', 
                  borderRadius: '8px', 
                  border: '2px solid #e5e7eb',
                  objectFit: 'cover',
                  display: 'block',
                  margin: '0 auto',
                  boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)'
                }}
                onError={() => setImageError(true)}
              />
            ) : (
              <div style={{ 
                padding: '40px', 
                color: '#dc2626', 
                fontSize: '14px',
                background: '#fee2e2',
                borderRadius: '8px',
                border: '1px solid #fca5a5'
              }}>
                <i className="bi bi-exclamation-triangle-fill" style={{ fontSize: '24px', marginBottom: '8px', display: 'block' }}></i>
                Không thể tải ảnh. Vui lòng kiểm tra lại đường dẫn.
              </div>
            )}
          </div>
        )}
      </div>

      {!isReadOnly && (
        <div className={styles.formGroup}>
          <label style={{ display: 'flex', alignItems: 'center', cursor: 'pointer', padding: '12px', background: '#f9fafb', borderRadius: '8px', border: '1px solid #e5e7eb' }}>
            <input
              type="checkbox"
              checked={formData.isActive}
              onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
              style={{ marginRight: '12px', width: '20px', height: '20px', cursor: 'pointer' }}
            />
            <div>
              <span style={{ fontWeight: '600', fontSize: '15px', display: 'block' }}>
                <i className="bi bi-power" style={{ marginRight: '6px', color: formData.isActive ? '#16a34a' : '#dc2626' }}></i>
                Kích hoạt chuyên khoa
              </span>
              <small style={{ color: '#6b7280', display: 'block', marginTop: '4px' }}>
                Chuyên khoa đã kích hoạt sẽ hiển thị cho người dùng và bác sĩ có thể đăng ký
              </small>
            </div>
          </label>
        </div>
      )}

      {isReadOnly && (
        <div className={styles.formGroup}>
          <label>
            <i className="bi bi-toggle-on" style={{ marginRight: '8px', color: '#667eea' }}></i>
            Trạng thái
          </label>
          <div style={{ 
            display: 'inline-block', 
            padding: '10px 16px', 
            borderRadius: '8px',
            fontWeight: '600',
            fontSize: '15px',
            background: specialization?.isActive 
              ? 'linear-gradient(135deg, #dcfce7 0%, #86efac 100%)' 
              : 'linear-gradient(135deg, #fee2e2 0%, #fca5a5 100%)',
            color: specialization?.isActive ? '#166534' : '#991b1b',
            border: `2px solid ${specialization?.isActive ? '#4ade80' : '#f87171'}`,
            boxShadow: `0 2px 8px rgba(${specialization?.isActive ? '34, 197, 94' : '239, 68, 68'}, 0.2)`
          }}>
            <i className={`bi ${specialization?.isActive ? 'bi-check-circle-fill' : 'bi-x-circle-fill'}`} style={{ marginRight: '8px' }}></i>
            {specialization?.isActive ? 'Hoạt động' : 'Tạm dừng'}
          </div>
        </div>
      )}

      {!isReadOnly && (
        <div className={styles.formActions}>
          <button type="button" onClick={onCancel} className={styles.btnCancel}>
            <i className="bi bi-x-circle" style={{ marginRight: '8px' }}></i>
            Hủy
          </button>
          <button type="submit" disabled={loading} className={styles.btnSubmit}>
            {loading ? (
              <>
                <i className="bi bi-hourglass-split" style={{ marginRight: '8px' }}></i>
                Đang lưu...
              </>
            ) : (
              <>
                <i className={`bi ${mode === 'create' ? 'bi-plus-circle-fill' : 'bi-check-circle-fill'}`} style={{ marginRight: '8px' }}></i>
                {mode === 'create' ? 'Tạo mới' : 'Cập nhật'}
              </>
            )}
          </button>
        </div>
      )}

      {isReadOnly && (
        <div className={styles.formActions}>
          <button type="button" onClick={onCancel} className={styles.btnCancel}>
            <i className="bi bi-x-circle" style={{ marginRight: '8px' }}></i>
            Đóng
          </button>
        </div>
      )}
    </form>
  );
};

export default SpecializationForm;
