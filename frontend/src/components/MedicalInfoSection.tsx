import React, { useState, useEffect } from 'react';
import { patientRegistrationApiService } from '../services/patientRegistrationApiService';
import { BloodTypeDTO, FormData } from '../types/registrationTypes';

interface MedicalInfoProps {
  formData: FormData;
  onInputChange: (field: string, value: string) => void;
  errors: Record<string, string>;
}



export function MedicalInfoSection({ formData, onInputChange, errors }: MedicalInfoProps) {
  const [bloodTypes, setBloodTypes] = useState<BloodTypeDTO[]>([]);
  const [isLoadingBloodTypes, setIsLoadingBloodTypes] = useState(false);

  // Debug log để xem bloodTypes state
  console.log('Current bloodTypes state:', bloodTypes);
  console.log('bloodTypes length:', bloodTypes.length);

  useEffect(() => {
    const fetchBloodTypes = async () => {
      setIsLoadingBloodTypes(true);
      try {
        console.log('Starting to fetch blood types...');
        const response = await patientRegistrationApiService.getBloodTypes();
        console.log('Blood types response:', response);
        
        if (response.success && response.data) {
          console.log('Blood types data:', response.data);
          console.log('Setting bloodTypes state with:', response.data);
          setBloodTypes(response.data);
        } else {
          console.error('Failed to fetch blood types:', response.error);
          console.error('Response status:', response);
        }
      } catch (error) {
        console.error('Error fetching blood types:', error);
      } finally {
        setIsLoadingBloodTypes(false);
      }
    };

    fetchBloodTypes();
  }, []);

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
          onBlur={(e) => onInputChange('dateOfBirth', e.target.value)}
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
          onBlur={(e) => onInputChange('bloodType', e.target.value)}
          className={errors.bloodType ? 'error' : (formData.bloodType && !errors.bloodType ? 'success' : '')}
          required
        >
          <option key="empty" value="">
            {isLoadingBloodTypes ? 'Đang tải...' : 'Chọn nhóm máu'}
          </option>
          {(() => {
            console.log('About to map bloodTypes:', bloodTypes);
            return bloodTypes.map((bloodType, index) => {
              console.log(`Mapping bloodType ${index}:`, bloodType);
              return (
                <option 
                  key={bloodType.code || `bloodtype-${index}`} 
                  value={bloodType.code || ''}
                  
                >
                  {bloodType.displayName}
                </option>
              );
            });
          })()}
        </select>
        {errors.bloodType && <span className="error-message">{errors.bloodType}</span>}
      </div>
    </div>
  );
}