import React from 'react';

interface EmergencyContactProps {
  formData: {
    emergencyContactName: string;
    emergencyRelationship: string;
    emergencyPhoneNumber: string;
  };
  onInputChange: (field: string, value: string) => void;
  errors: Record<string, string>;
}

export function EmergencyContactSection({ formData, onInputChange, errors }: EmergencyContactProps) {
  return (
    <div className="form-section">
      <h2 className="section-title">Phần 3: Người liên hệ khẩn cấp</h2>
      
      <div className="form-group">
        <label htmlFor="emergencyContactName" className="required">Họ tên người liên hệ</label>
        <input
          type="text"
          id="emergencyContactName"
          placeholder="Họ và tên"
          value={formData.emergencyContactName}
          onChange={(e) => onInputChange('emergencyContactName', e.target.value)}
          className={errors.emergencyContactName ? 'error' : (formData.emergencyContactName && !errors.emergencyContactName ? 'success' : '')}
          required
        />
        {errors.emergencyContactName && <span className="error-message">{errors.emergencyContactName}</span>}
      </div>

      <div className="form-group">
        <label htmlFor="emergencyRelationship" className="required">Mối quan hệ (Vợ, chồng, cha, mẹ...)</label>
        <input
          type="text"
          id="emergencyRelationship"
          placeholder="Mối quan hệ"
          value={formData.emergencyRelationship}
          onChange={(e) => onInputChange('emergencyRelationship', e.target.value)}
          className={errors.emergencyRelationship ? 'error' : (formData.emergencyRelationship && !errors.emergencyRelationship ? 'success' : '')}
          required
        />
        {errors.emergencyRelationship && <span className="error-message">{errors.emergencyRelationship}</span>}
      </div>

      <div className="form-group">
        <label htmlFor="emergencyPhoneNumber" className="required">Số điện thoại liên hệ</label>
        <input
          type="tel"
          id="emergencyPhoneNumber"
          placeholder="Số điện thoại liên hệ khẩn cấp"
          value={formData.emergencyPhoneNumber}
          onChange={(e) => onInputChange('emergencyPhoneNumber', e.target.value)}
          className={errors.emergencyPhoneNumber ? 'error' : (formData.emergencyPhoneNumber && !errors.emergencyPhoneNumber ? 'success' : '')}
          required
        />
        {errors.emergencyPhoneNumber && <span className="error-message">{errors.emergencyPhoneNumber}</span>}
      </div>
    </div>
  );
}