import React from 'react';
import { FormData } from '../types/registrationTypes';

interface MedicalHistoryProps {
  formData: FormData;
  onInputChange: (field: string, value: string) => void;
  errors: Record<string, string>;
}

export function MedicalHistorySection({ formData, onInputChange, errors }: MedicalHistoryProps) {
  return (
    <div className="form-section">
      <h2 className="section-title">Phần 4: Tiền sử bệnh lý</h2>
      
      <div className="form-group">
        <label htmlFor="chronicDiseases">Bệnh mãn tính</label>
        <textarea
          id="chronicDiseases"
          placeholder="Ví dụ: cao huyết áp, tiểu đường, trầm cảm, rối loạn lo âu..."
          value={formData.chronicDiseases}
          onChange={(e) => onInputChange('chronicDiseases', e.target.value)}
          className={errors.chronicDiseases ? 'error' : (formData.chronicDiseases && !errors.chronicDiseases ? 'success' : '')}
          rows={4}
        />
        {errors.chronicDiseases && <span className="error-message">{errors.chronicDiseases}</span>}
      </div>

      <div className="form-group">
        <label htmlFor="allergies">Dị ứng</label>
        <textarea
          id="allergies"
          placeholder="Vui lòng liệt kê các chất hoặc thực phẩm bạn bị dị ứng"
          value={formData.allergies}
          onChange={(e) => onInputChange('allergies', e.target.value)}
          className={errors.allergies ? 'error' : (formData.allergies && !errors.allergies ? 'success' : '')}
          rows={4}
        />
        {errors.allergies && <span className="error-message">{errors.allergies}</span>}
      </div>
    </div>
  );
}