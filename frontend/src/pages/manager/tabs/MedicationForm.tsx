import React, { useState, useEffect } from 'react';
import { useToast } from '../../../contexts/ToastContext';
import styles from '../../../styles/admin/UserList.module.css';
import medicationService, { MedicationDto } from '../../../services/medicationService';

interface MedicationFormProps {
  medication: MedicationDto | null;
  mode: 'create' | 'edit' | 'view';
  onSaved: () => void;
  onCancel: () => void;
}

const MedicationForm: React.FC<MedicationFormProps> = ({
  medication,
  mode,
  onSaved,
  onCancel,
}) => {
  const { showToast } = useToast();
  const [formData, setFormData] = useState({
    medicationName: '',
    genericName: '',
    dosageForms: '',
    commonUses: '',
    sideEffects: '',
    isActive: true,
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (medication) {
      setFormData({
        medicationName: medication.medicationName || '',
        genericName: medication.genericName || '',
        dosageForms: medication.dosageForms || '',
        commonUses: medication.commonUses || '',
        sideEffects: medication.sideEffects || '',
        isActive: medication.isActive ?? true,
      });
    } else {
      // Reset form when creating new
      setFormData({
        medicationName: '',
        genericName: '',
        dosageForms: '',
        commonUses: '',
        sideEffects: '',
        isActive: true,
      });
    }
  }, [medication]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (mode === 'view') return;

    setLoading(true);
    try {
      if (mode === 'create') {
        await medicationService.create({
          medicationName: formData.medicationName,
          genericName: formData.genericName,
          dosageForms: formData.dosageForms,
          commonUses: formData.commonUses,
          sideEffects: formData.sideEffects,
          isActive: formData.isActive,
        });
      } else {
        await medicationService.update(medication!.id, {
          medicationName: formData.medicationName,
          genericName: formData.genericName,
          dosageForms: formData.dosageForms,
          commonUses: formData.commonUses,
          sideEffects: formData.sideEffects,
          isActive: formData.isActive,
        });
      }
      showToast(
        `Đã ${mode === 'create' ? 'tạo' : 'cập nhật'} thuốc thành công`,
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

  return (
    <form onSubmit={handleSubmit} className={styles.form}>
      {/* View Mode - Display Info Cards */}
      {isReadOnly && medication && (
        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', 
          gap: '16px', 
          marginBottom: '24px' 
        }}>
          <div style={{ 
            background: medication.isActive 
              ? 'linear-gradient(135deg, #dcfce7 0%, #86efac 100%)' 
              : 'linear-gradient(135deg, #fee2e2 0%, #fca5a5 100%)', 
            padding: '20px', 
            borderRadius: '12px', 
            border: `1px solid ${medication.isActive ? '#4ade80' : '#f87171'}`,
            boxShadow: `0 2px 8px rgba(${medication.isActive ? '34, 197, 94' : '239, 68, 68'}, 0.1)`
          }}>
            <div style={{ fontSize: '13px', color: medication.isActive ? '#166534' : '#991b1b', marginBottom: '8px', fontWeight: '500' }}>
              <i className={`bi ${medication.isActive ? 'bi-check-circle-fill' : 'bi-x-circle-fill'}`} style={{ marginRight: '6px' }}></i>
              Trạng thái
            </div>
            <div style={{ fontSize: '18px', fontWeight: '600', color: medication.isActive ? '#15803d' : '#dc2626' }}>
              {medication.isActive ? 'Hoạt động' : 'Tạm dừng'}
            </div>
          </div>
          {medication.createdAt && (
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
                {new Date(medication.createdAt).toLocaleDateString('vi-VN', { 
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
          <i className="bi bi-capsule" style={{ marginRight: '8px', color: '#667eea' }}></i>
          Tên thuốc <span className={styles.required}>*</span>
        </label>
        <input
          type="text"
          value={formData.medicationName}
          onChange={(e) => setFormData({ ...formData, medicationName: e.target.value })}
          required
          disabled={isReadOnly}
          placeholder="VD: Paracetamol 500mg"
        />
        {!isReadOnly && (
          <small style={{ color: '#6b7280', marginTop: '4px', display: 'block' }}>
            <i className="bi bi-info-circle" style={{ marginRight: '4px' }}></i>
            Tên thương mại hoặc tên đầy đủ của thuốc
          </small>
        )}
      </div>

      <div className={styles.formGroup}>
        <label>
          <i className="bi bi-file-medical-fill" style={{ marginRight: '8px', color: '#667eea' }}></i>
          Tên gốc (Generic Name)
        </label>
        <input
          type="text"
          value={formData.genericName}
          onChange={(e) => setFormData({ ...formData, genericName: e.target.value })}
          disabled={isReadOnly}
          placeholder="VD: Acetaminophen"
        />
        {!isReadOnly && (
          <small style={{ color: '#6b7280', marginTop: '4px', display: 'block' }}>
            <i className="bi bi-info-circle" style={{ marginRight: '4px' }}></i>
            Tên hoạt chất chính của thuốc
          </small>
        )}
      </div>

      <div className={styles.formGroup}>
        <label>
          <i className="bi bi-box-seam-fill" style={{ marginRight: '8px', color: '#667eea' }}></i>
          Dạng bào chế
        </label>
        <input
          type="text"
          value={formData.dosageForms}
          onChange={(e) => setFormData({ ...formData, dosageForms: e.target.value })}
          disabled={isReadOnly}
          placeholder="VD: Viên nén, Viên nang, Dung dịch tiêm, Siro..."
        />
        {!isReadOnly && (
          <small style={{ color: '#6b7280', marginTop: '4px', display: 'block' }}>
            <i className="bi bi-info-circle" style={{ marginRight: '4px' }}></i>
            Các dạng bào chế có sẵn của thuốc
          </small>
        )}
      </div>

      <div className={styles.formGroup}>
        <label>
          <i className="bi bi-heart-pulse-fill" style={{ marginRight: '8px', color: '#667eea' }}></i>
          Công dụng
        </label>
        <textarea
          value={formData.commonUses}
          onChange={(e) => setFormData({ ...formData, commonUses: e.target.value })}
          disabled={isReadOnly}
          rows={4}
          placeholder="Mô tả chi tiết công dụng, chỉ định của thuốc..."
          style={{ resize: 'vertical' }}
        />
        {!isReadOnly && (
          <small style={{ color: '#6b7280', marginTop: '4px', display: 'block' }}>
            <i className="bi bi-lightbulb" style={{ marginRight: '4px' }}></i>
            Mô tả các bệnh lý và tình trạng mà thuốc được sử dụng để điều trị
          </small>
        )}
      </div>

      <div className={styles.formGroup}>
        <label>
          <i className="bi bi-exclamation-triangle-fill" style={{ marginRight: '8px', color: '#667eea' }}></i>
          Tác dụng phụ
        </label>
        <textarea
          value={formData.sideEffects}
          onChange={(e) => setFormData({ ...formData, sideEffects: e.target.value })}
          disabled={isReadOnly}
          rows={4}
          placeholder="Mô tả các tác dụng phụ có thể gặp phải khi sử dụng thuốc..."
          style={{ resize: 'vertical' }}
        />
        {!isReadOnly && (
          <small style={{ color: '#6b7280', marginTop: '4px', display: 'block' }}>
            <i className="bi bi-lightbulb" style={{ marginRight: '4px' }}></i>
            Liệt kê các tác dụng phụ thường gặp và hiếm gặp
          </small>
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
                Kích hoạt thuốc
              </span>
              <small style={{ color: '#6b7280', display: 'block', marginTop: '4px' }}>
                Thuốc đã kích hoạt sẽ hiển thị trong danh sách khi bác sĩ kê đơn
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
            background: medication?.isActive 
              ? 'linear-gradient(135deg, #dcfce7 0%, #86efac 100%)' 
              : 'linear-gradient(135deg, #fee2e2 0%, #fca5a5 100%)',
            color: medication?.isActive ? '#166534' : '#991b1b',
            border: `2px solid ${medication?.isActive ? '#4ade80' : '#f87171'}`,
            boxShadow: `0 2px 8px rgba(${medication?.isActive ? '34, 197, 94' : '239, 68, 68'}, 0.2)`
          }}>
            <i className={`bi ${medication?.isActive ? 'bi-check-circle-fill' : 'bi-x-circle-fill'}`} style={{ marginRight: '8px' }}></i>
            {medication?.isActive ? 'Hoạt động' : 'Tạm dừng'}
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

export default MedicationForm;
