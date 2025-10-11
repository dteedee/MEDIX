import React from 'react';

interface MedicalInfoProps {
  formData: {
    dateOfBirth: string;
    gender: 'male' | 'female' | 'other' | '';
    bloodType: string;
  };
  onInputChange: (field: string, value: string) => void;
  errors: Record<string, string>;
}

export function MedicalInfoSection({ formData, onInputChange, errors }: MedicalInfoProps) {
  return (
    <div className="form-section">
      <h2 className="section-title">Phần 2: Thông tin Y tế & EMR</h2>
      
      <div className="form-group">
        <label htmlFor="dateOfBirth" className="required">Ngày sinh</label>
        <input
          type="date"
          id="dateOfBirth"
          placeholder="mm/dd/yyyy"
          value={formData.dateOfBirth}
          onChange={(e) => onInputChange('dateOfBirth', e.target.value)}
          className={errors.dateOfBirth ? 'error' : (formData.dateOfBirth && !errors.dateOfBirth ? 'success' : '')}
          required
        />
        {errors.dateOfBirth && <span className="error-message">{errors.dateOfBirth}</span>}
      </div>

      <div className="form-group">
        <label className="required">Giới tính</label>
        <div className="radio-group">
          <label className="radio-option">
            <input
              type="radio"
              name="gender"
              value="male"
              checked={formData.gender === 'male'}
              onChange={(e) => onInputChange('gender', e.target.value)}
            />
            <span className="radio-custom"></span>
            Nam
          </label>
          <label className="radio-option">
            <input
              type="radio"
              name="gender"
              value="female"
              checked={formData.gender === 'female'}
              onChange={(e) => onInputChange('gender', e.target.value)}
            />
            <span className="radio-custom"></span>
            Nữ
          </label>
          <label className="radio-option">
            <input
              type="radio"
              name="gender"
              value="other"
              checked={formData.gender === 'other'}
              onChange={(e) => onInputChange('gender', e.target.value)}
            />
            <span className="radio-custom"></span>
            Khác
          </label>
        </div>
        {errors.gender && <span className="error-message">{errors.gender}</span>}
      </div>

      <div className="form-group">
        <label htmlFor="bloodType" className="required">Nhóm máu</label>
        <select
          id="bloodType"
          value={formData.bloodType}
          onChange={(e) => onInputChange('bloodType', e.target.value)}
          className={errors.bloodType ? 'error' : (formData.bloodType && !errors.bloodType ? 'success' : '')}
          required
        >
          <option value="">Chọn nhóm máu</option>
          <option value="A">Nhóm máu A</option>
          <option value="B">Nhóm máu B</option>
          <option value="AB">Nhóm máu AB</option>
          <option value="O">Nhóm máu O</option>
        </select>
        {errors.bloodType && <span className="error-message">{errors.bloodType}</span>}
      </div>
    </div>
  );
}