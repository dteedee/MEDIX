import React, { useState, useEffect } from 'react';
import { useToast } from '../../../contexts/ToastContext';
import styles from '../../../styles/admin/ArticleForm.module.css';
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
      {isReadOnly && medication && (
        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', 
          gap: '20px', 
          marginBottom: '32px' 
        }}>
          <div style={{ 
            background: medication.isActive 
              ? 'linear-gradient(135deg, #dcfce7 0%, #86efac 100%)' 
              : 'linear-gradient(135deg, #fee2e2 0%, #fca5a5 100%)', 
            padding: '24px', 
            borderRadius: '16px', 
            border: `2px solid ${medication.isActive ? '#4ade80' : '#f87171'}`,
            boxShadow: `0 4px 12px rgba(${medication.isActive ? '34, 197, 94' : '239, 68, 68'}, 0.15)`
          }}>
            <div style={{ fontSize: '14px', color: medication.isActive ? '#166534' : '#991b1b', marginBottom: '12px', fontWeight: '600', display: 'flex', alignItems: 'center' }}>
              <i className={`bi ${medication.isActive ? 'bi-check-circle-fill' : 'bi-x-circle-fill'}`} style={{ marginRight: '8px', fontSize: '18px' }}></i>
              Trạng thái hoạt động
            </div>
            <div style={{ fontSize: '20px', fontWeight: '700', color: medication.isActive ? '#15803d' : '#dc2626', lineHeight: '1.2' }}>
              {medication.isActive ? 'Đang hoạt động' : 'Tạm dừng'}
            </div>
            <div style={{ fontSize: '12px', color: medication.isActive ? '#16a34a' : '#dc2626', marginTop: '8px', opacity: 0.8 }}>
              {medication.isActive ? 'Hiển thị trong danh sách kê đơn' : 'Ẩn khỏi danh sách'}
            </div>
          </div>
          {medication.createdAt && (
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
                {new Date(medication.createdAt).toLocaleDateString('vi-VN', { 
                  year: 'numeric', 
                  month: 'long', 
                  day: 'numeric' 
                })}
              </div>
              <div style={{ fontSize: '12px', color: '#a16207', marginTop: '8px', opacity: 0.8 }}>
                {new Date(medication.createdAt).toLocaleTimeString('vi-VN', { 
                  hour: '2-digit', 
                  minute: '2-digit' 
                })}
              </div>
            </div>
          )}
        </div>
      )}

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

        <div className={styles.formGroup} style={{ marginBottom: '24px' }}>
          <label className={styles.label}>
            <i className="bi bi-capsule"></i>
            Tên thuốc <span className={styles.required}>*</span>
          </label>
          <input
            type="text"
            value={formData.medicationName}
            onChange={(e) => setFormData({ ...formData, medicationName: e.target.value })}
            className={styles.input}
            required
            disabled={isReadOnly}
            placeholder="VD: Paracetamol 500mg, Amoxicillin 250mg..."
          />
          {!isReadOnly && (
            <span className={styles.helpText}>
              <i className="bi bi-lightbulb" style={{ marginRight: '6px' }}></i>
              Tên thương mại hoặc tên đầy đủ của thuốc sẽ hiển thị khi bác sĩ kê đơn
            </span>
          )}
        </div>

        <div className={styles.formGroup} style={{ marginBottom: '24px' }}>
          <label className={styles.label}>
            <i className="bi bi-file-medical-fill"></i>
            Tên gốc (Generic Name)
          </label>
          <input
            type="text"
            value={formData.genericName}
            onChange={(e) => setFormData({ ...formData, genericName: e.target.value })}
            className={styles.input}
            disabled={isReadOnly}
            placeholder="VD: Acetaminophen, Amoxicillin..."
          />
          {!isReadOnly && (
            <span className={styles.helpText}>
              <i className="bi bi-lightbulb" style={{ marginRight: '6px' }}></i>
              Tên hoạt chất chính của thuốc, giúp nhận diện thuốc theo tên khoa học
            </span>
          )}
        </div>

        <div className={styles.formGroup}>
          <label className={styles.label}>
            <i className="bi bi-box-seam-fill"></i>
            Dạng bào chế
          </label>
          <input
            type="text"
            value={formData.dosageForms}
            onChange={(e) => setFormData({ ...formData, dosageForms: e.target.value })}
            className={styles.input}
            disabled={isReadOnly}
            placeholder="VD: Viên nén, Viên nang, Dung dịch tiêm, Siro, Thuốc nhỏ mắt..."
          />
          {!isReadOnly && (
            <span className={styles.helpText}>
              <i className="bi bi-lightbulb" style={{ marginRight: '6px' }}></i>
              Các dạng bào chế có sẵn của thuốc, giúp bác sĩ và bệnh nhân lựa chọn phù hợp
            </span>
          )}
        </div>
      </div>

      {/* Medical Information Section */}
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
          <i className="bi bi-heart-pulse-fill" style={{ color: '#667eea', fontSize: '20px' }}></i>
          Thông tin y tế
        </h3>

        <div className={styles.formGroup} style={{ marginBottom: '24px' }}>
          <label className={styles.label}>
            <i className="bi bi-heart-pulse-fill"></i>
            Công dụng và chỉ định
          </label>
          <textarea
            value={formData.commonUses}
            onChange={(e) => setFormData({ ...formData, commonUses: e.target.value })}
            className={styles.textarea}
            disabled={isReadOnly}
            rows={5}
            placeholder="Mô tả chi tiết công dụng, chỉ định của thuốc. Ví dụ: Điều trị các bệnh nhiễm khuẩn đường hô hấp, tiết niệu, da và mô mềm..."
            style={{ resize: 'vertical' }}
          />
          {!isReadOnly && (
            <span className={styles.helpText}>
              <i className="bi bi-lightbulb" style={{ marginRight: '6px' }}></i>
              Mô tả chi tiết các bệnh lý và tình trạng mà thuốc được sử dụng để điều trị, giúp bác sĩ quyết định kê đơn phù hợp
            </span>
          )}
        </div>

        <div className={styles.formGroup}>
          <label className={styles.label}>
            <i className="bi bi-exclamation-triangle-fill"></i>
            Tác dụng phụ và cảnh báo
          </label>
          <textarea
            value={formData.sideEffects}
            onChange={(e) => setFormData({ ...formData, sideEffects: e.target.value })}
            className={styles.textarea}
            disabled={isReadOnly}
            rows={5}
            placeholder="Mô tả các tác dụng phụ có thể gặp phải khi sử dụng thuốc. Ví dụ: Tiêu chảy, dị ứng, buồn nôn, đau đầu..."
            style={{ resize: 'vertical' }}
          />
          {!isReadOnly && (
            <span className={styles.helpText}>
              <i className="bi bi-lightbulb" style={{ marginRight: '6px' }}></i>
              Liệt kê các tác dụng phụ thường gặp và hiếm gặp, giúp bác sĩ và bệnh nhân theo dõi và xử lý kịp thời
            </span>
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
                  onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
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
                  ? 'Thuốc sẽ hiển thị trong danh sách khi bác sĩ kê đơn. Bác sĩ có thể tìm kiếm và chọn thuốc này cho bệnh nhân.' 
                  : 'Thuốc sẽ không hiển thị trong danh sách cho đến khi được kích hoạt. Bác sĩ không thể kê đơn thuốc này.'}
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
              background: medication?.isActive 
                ? 'linear-gradient(135deg, #dcfce7 0%, #86efac 100%)' 
                : 'linear-gradient(135deg, #fee2e2 0%, #fca5a5 100%)',
              color: medication?.isActive ? '#166534' : '#991b1b',
              border: `2px solid ${medication?.isActive ? '#4ade80' : '#f87171'}`,
              boxShadow: `0 4px 12px rgba(${medication?.isActive ? '34, 197, 94' : '239, 68, 68'}, 0.2)`,
              gap: '10px'
            }}>
              <i className={`bi ${medication?.isActive ? 'bi-check-circle-fill' : 'bi-x-circle-fill'}`} style={{ fontSize: '20px' }}></i>
              <span>{medication?.isActive ? 'Đang hoạt động' : 'Tạm dừng'}</span>
            </div>
            <p className={styles.helpText} style={{ marginTop: '12px' }}>
              <i className="bi bi-info-circle" style={{ marginRight: '6px' }}></i>
              {medication?.isActive 
                ? 'Thuốc này đang được hiển thị và có thể được sử dụng bởi bác sĩ khi kê đơn.' 
                : 'Thuốc này đang bị tạm dừng và không hiển thị trong danh sách kê đơn.'}
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
                {mode === 'create' ? 'Tạo thuốc' : 'Cập nhật'}
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
    </form>
  );
};

export default MedicationForm;
