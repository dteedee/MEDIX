import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useToast } from '../../contexts/ToastContext';
import registrationService from '../../services/registrationService';
import patientService from '../../services/patientService';
import { BloodType, ValidationErrors } from '../../types/auth.types';
import { Gender as GenderEnum } from '../../types/common.types';
import { validatePassword, getPasswordStrength } from '../../utils/validation';
import '../../style/RegistrationPage.css';

interface CompleteProfileFormData {
  fullName: string;
  identificationNumber: string;
  address: string;
  phoneNumber: string;
  dateOfBirth: string;
  genderCode: string;
  bloodTypeCode: string;
  emergencyContactName: string;
  emergencyContactPhone: string;
  medicalHistory: string;
  allergies: string;
}

export const CompletePatientProfile: React.FC = () => {
  const navigate = useNavigate();
  const { user, updateUser } = useAuth();
  const { showToast } = useToast();

  const formatDateForDisplay = (dateString: string): string => {
    if (!dateString) return '';
    
    if (/^\d{4}-\d{2}-\d{2}$/.test(dateString)) {
      const [year, month, day] = dateString.split('-');
      return `${day}/${month}/${year}`;
    }
    
    if (/^\d{1,2}\/\d{1,2}\/\d{4}$/.test(dateString)) {
      return dateString;
    }
    
    return dateString;
  };

  const parseDateInput = (input: string): { date: string; error?: string } => {
    if (/^\d{4}-\d{2}-\d{2}$/.test(input)) {
      const [year, month, day] = input.split('-');
      const validation = validateDateValues(day, month, year);
      if (!validation.isValid) {
        return { date: input, error: validation.error };
      }
      return { date: input };
    }
    
    const ddmmyyyyMatch = input.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
    if (ddmmyyyyMatch) {
      const [, day, month, year] = ddmmyyyyMatch;
      const validation = validateDateValues(day, month, year);
      if (!validation.isValid) {
        return { date: input, error: validation.error };
      }
      return { date: `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}` };
    }
    
    const ddmmyyyyDashMatch = input.match(/^(\d{1,2})-(\d{1,2})-(\d{4})$/);
    if (ddmmyyyyDashMatch) {
      const [, day, month, year] = ddmmyyyyDashMatch;
      const validation = validateDateValues(day, month, year);
      if (!validation.isValid) {
        return { date: input, error: validation.error };
      }
      return { date: `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}` };
    }
    
    const ddmmyyyyNoSepMatch = input.match(/^(\d{2})(\d{2})(\d{4})$/);
    if (ddmmyyyyNoSepMatch) {
      const [, day, month, year] = ddmmyyyyNoSepMatch;
      const validation = validateDateValues(day, month, year);
      if (!validation.isValid) {
        return { date: input, error: validation.error };
      }
      return { date: `${year}-${month}-${day}` };
    }
    
    if (input && !input.includes('/') && !input.includes('-') && input.length < 8) {
      return { date: '' };
    }
    
    return { date: input, error: 'Định dạng ngày không hợp lệ. Vui lòng nhập theo định dạng: dd/mm/yyyy' };
  };

  const validateDateValues = (day: string, month: string, year: string): { isValid: boolean; error?: string } => {
    const dayNum = parseInt(day, 10);
    const monthNum = parseInt(month, 10);
    const yearNum = parseInt(year, 10);
    
    const currentYear = new Date().getFullYear();
    if (yearNum < 1900 || yearNum > currentYear) {
      return { isValid: false, error: `Năm phải từ 1900 đến ${currentYear}` };
    }
    
    if (monthNum < 1 || monthNum > 12) {
      return { isValid: false, error: 'Tháng phải từ 1 đến 12' };
    }
    
    const daysInMonth = new Date(yearNum, monthNum, 0).getDate();
    if (dayNum < 1 || dayNum > daysInMonth) {
      return { isValid: false, error: `Ngày không hợp lệ. Tháng ${monthNum} có tối đa ${daysInMonth} ngày` };
    }
    
    const date = new Date(yearNum, monthNum - 1, dayNum);
    if (date.getFullYear() !== yearNum || date.getMonth() !== monthNum - 1 || date.getDate() !== dayNum) {
      return { isValid: false, error: 'Ngày tháng năm không hợp lệ' };
    }
    
    return { isValid: true };
  };

  const formatDateInput = (value: string): string => {
    const digits = value.replace(/\D/g, '');
    const limitedDigits = digits.slice(0, 8);
    
    if (limitedDigits.length <= 2) {
      return limitedDigits;
    } else if (limitedDigits.length <= 4) {
      return `${limitedDigits.slice(0, 2)}/${limitedDigits.slice(2)}`;
    } else {
      return `${limitedDigits.slice(0, 2)}/${limitedDigits.slice(2, 4)}/${limitedDigits.slice(4)}`;
    }
  };

  const [formData, setFormData] = useState<CompleteProfileFormData>({
    fullName: user?.fullName || '',
    identificationNumber: '',
    address: user?.address || '',
    phoneNumber: user?.phoneNumber || '',
    dateOfBirth: user?.dateOfBirth || '',
    genderCode: user?.genderCode || '',
    bloodTypeCode: '',
    emergencyContactName: '',
    emergencyContactPhone: '',
    medicalHistory: '',
    allergies: '',
  });

  const [dateOfBirthDisplay, setDateOfBirthDisplay] = useState('');
  const [bloodTypes, setBloodTypes] = useState<BloodType[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string>('');
  const [validationErrors, setValidationErrors] = useState<ValidationErrors>({});
  const [isCheckingIdNumber, setIsCheckingIdNumber] = useState(false);
  const [idNumberExists, setIdNumberExists] = useState(false);

  useEffect(() => {
    if (user?.isProfileCompleted) {
      navigate('/app/patient/dashboard');
    }
  }, [user, navigate]);

  useEffect(() => {
    const loadOptions = async () => {
      try {
        const bloodTypesResponse = await registrationService.getBloodTypes();
        
        if (bloodTypesResponse.success && bloodTypesResponse.data) {
          const bloodTypesWithActive = bloodTypesResponse.data.map(bt => ({
            ...bt,
            isActive: true
          }));
          setBloodTypes(bloodTypesWithActive);
        }
      } catch (err) {
        console.error('Error loading blood types:', err);
      }
    };

    loadOptions();
  }, []);

  useEffect(() => {
    if (formData.dateOfBirth && /^\d{4}-\d{2}-\d{2}$/.test(formData.dateOfBirth) && !dateOfBirthDisplay) {
      setDateOfBirthDisplay(formatDateForDisplay(formData.dateOfBirth));
    } else if (!formData.dateOfBirth && dateOfBirthDisplay) {
      setDateOfBirthDisplay('');
    }
  }, [formData.dateOfBirth]);

  useEffect(() => {
    if (formData.identificationNumber && formData.identificationNumber.length === 12) {
      const timeoutId = setTimeout(async () => {
        setIsCheckingIdNumber(true);
        try {
          const response = await registrationService.checkIdNumberExists(formData.identificationNumber);
          if (response.success && response.data) {
            setIdNumberExists(response.data.exists);
            if (response.data.exists) {
              setValidationErrors(prev => ({
                ...prev,
                IdentificationNumber: ['Số CCCD/CMND này đã được sử dụng']
              }));
            } else {
              setValidationErrors(prev => {
                const { IdentificationNumber, ...rest } = prev;
                return rest;
              });
            }
          }
        } catch (error) {
          console.error('Error checking ID number:', error);
        } finally {
          setIsCheckingIdNumber(false);
        }
      }, 800);

      return () => clearTimeout(timeoutId);
    } else {
      setIdNumberExists(false);
    }
  }, [formData.identificationNumber]);

  const validateField = (name: string, value: string) => {
    const newErrors: Record<string, string[]> = {};

    switch (name) {
      case 'fullName':
        if (!value.trim()) {
          newErrors.FullName = ['Vui lòng nhập họ và tên'];
        } else {
          newErrors.FullName = [];
        }
        break;

      case 'phoneNumber':
        if (!value.trim()) {
          newErrors.PhoneNumber = ['Vui lòng nhập số điện thoại'];
        } else if (!/^0\d{9}$/.test(value)) {
          newErrors.PhoneNumber = ['Số điện thoại phải bắt đầu bằng 0 và gồm 10 chữ số'];
        } else if (value.startsWith('00')) {
          newErrors.PhoneNumber = ['Số điện thoại không được có số 0 thứ hai sau số 0 đầu tiên'];
        } else if (formData.emergencyContactPhone && value === formData.emergencyContactPhone) {
          newErrors.PhoneNumber = ['Số điện thoại chính không được giống số điện thoại liên hệ khẩn cấp'];
        } else {
          newErrors.PhoneNumber = [];
        }
        break;

      case 'identificationNumber':
        if (!value.trim()) {
          newErrors.IdentificationNumber = ['Vui lòng nhập số CCCD'];
        } else if (!/^\d{12}$/.test(value)) {
          newErrors.IdentificationNumber = ['Số CCCD phải gồm đúng 12 chữ số'];
        } else {
          newErrors.IdentificationNumber = [];
        }
        break;

      case 'dateOfBirth':
        if (!value) {
          newErrors.DateOfBirth = ['Vui lòng chọn ngày sinh'];
        } else {
          const parsed = parseDateInput(value);
          if (parsed.error) {
            newErrors.DateOfBirth = [parsed.error];
          } else if (parsed.date) {
            if (!/^\d{4}-\d{2}-\d{2}$/.test(parsed.date)) {
              newErrors.DateOfBirth = ['Ngày sinh không hợp lệ'];
            } else {
              const birthDate = new Date(parsed.date);
              const currentDate = new Date();
              const age = currentDate.getFullYear() - birthDate.getFullYear();
              const monthDiff = currentDate.getMonth() - birthDate.getMonth();
              const dayDiff = currentDate.getDate() - birthDate.getDate();
              
              let exactAge = age;
              if (monthDiff < 0 || (monthDiff === 0 && dayDiff < 0)) {
                exactAge--;
              }

              if (isNaN(birthDate.getTime())) {
                newErrors.DateOfBirth = ['Ngày sinh không hợp lệ'];
              } else if (exactAge < 18) {
                newErrors.DateOfBirth = ['Bạn phải đủ 18 tuổi'];
              } else if (exactAge > 150) {
                newErrors.DateOfBirth = ['Ngày sinh không hợp lệ'];
              } else if (birthDate > currentDate) {
                newErrors.DateOfBirth = ['Ngày sinh không thể là ngày trong tương lai'];
              } else {
                newErrors.DateOfBirth = [];
              }
            }
          } else {
            newErrors.DateOfBirth = ['Vui lòng nhập đầy đủ ngày sinh'];
          }
        }
        break;

      case 'genderCode':
        if (!value) {
          newErrors.GenderCode = ['Vui lòng chọn giới tính'];
        } else {
          newErrors.GenderCode = [];
        }
        break;

      case 'bloodTypeCode':
        if (!value) {
          newErrors.BloodTypeCode = ['Vui lòng chọn nhóm máu'];
        } else {
          newErrors.BloodTypeCode = [];
        }
        break;

      case 'emergencyContactName':
        if (!value.trim()) {
          newErrors.EmergencyContactName = ['Vui lòng nhập họ tên người liên hệ khẩn cấp'];
        } else {
          newErrors.EmergencyContactName = [];
        }
        break;

      case 'emergencyContactPhone':
        if (!value.trim()) {
          newErrors.EmergencyContactPhone = ['Vui lòng nhập số điện thoại liên hệ khẩn cấp'];
        } else if (!/^0\d{9}$/.test(value)) {
          newErrors.EmergencyContactPhone = ['Số điện thoại phải bắt đầu bằng 0 và gồm 10 chữ số'];
        } else if (formData.phoneNumber && value === formData.phoneNumber) {
          newErrors.EmergencyContactPhone = ['Số điện thoại liên hệ khẩn cấp không được giống số điện thoại chính'];
        } else {
          newErrors.EmergencyContactPhone = [];
        }
        break;
    }

    setValidationErrors((prev: any) => ({ ...prev, ...newErrors }));
  };

  const handleBlur = (e: React.FocusEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    
    if (name === 'dateOfBirth') {
      if (formData.dateOfBirth) {
        validateField(name, formData.dateOfBirth);
      } else if (dateOfBirthDisplay) {
        setValidationErrors((prev: any) => ({ 
          ...prev, 
          DateOfBirth: ['Vui lòng nhập đầy đủ ngày sinh'] 
        }));
      }
    } else {
      validateField(name, value);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    
    if (type === 'radio') {
      setFormData(prev => ({ ...prev, [name]: value }));
      validateField(name, value);
    } else {
      if (name === 'identificationNumber') {
        const numericValue = value.replace(/\D/g, '');
        setFormData(prev => ({ ...prev, [name]: numericValue }));
        validateField(name, numericValue);
      } 
      else if (name === 'phoneNumber' || name === 'emergencyContactPhone') {
        const numericValue = value.replace(/\D/g, '');
        
        if (numericValue && !numericValue.startsWith('0')) {
          return;
        }
        
        if (numericValue.length >= 2 && numericValue[1] === '0') {
          return;
        }
        
        const limitedValue = numericValue.slice(0, 10);
        setFormData(prev => ({ ...prev, [name]: limitedValue }));
        validateField(name, limitedValue);
      } else if (name === 'dateOfBirth') {
        const formattedValue = formatDateInput(value);
        setDateOfBirthDisplay(formattedValue);
        
        const parsed = parseDateInput(formattedValue);
        const dateToStore = parsed.date && !parsed.error ? parsed.date : '';
        setFormData(prev => ({ ...prev, [name]: dateToStore }));
        
        if (parsed.error) {
          setValidationErrors((prev: any) => ({ 
            ...prev, 
            DateOfBirth: [parsed.error] 
          }));
        } else if (dateToStore) {
          validateField(name, dateToStore);
          setValidationErrors((prev: any) => {
            const { DateOfBirth, ...rest } = prev;
            return rest;
          });
        } else if (formattedValue.length >= 10 && formattedValue.includes('/')) {
          setValidationErrors((prev: any) => ({ 
            ...prev, 
            DateOfBirth: ['Định dạng ngày không hợp lệ. Vui lòng nhập theo định dạng: dd/mm/yyyy'] 
          }));
        } else {
          setValidationErrors((prev: any) => {
            const { DateOfBirth, ...rest } = prev;
            return rest;
          });
        }
        return;
      } else {
        setFormData(prev => ({ ...prev, [name]: value }));
        validateField(name, value);
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setValidationErrors({});
    
    const newErrors: ValidationErrors = {};
    
    if (!formData.fullName?.trim()) {
      newErrors.FullName = ['Vui lòng nhập họ và tên'];
    }
    
    if (!formData.phoneNumber?.trim()) {
      newErrors.PhoneNumber = ['Vui lòng nhập số điện thoại'];
    }
    
    if (!formData.identificationNumber?.trim()) {
      newErrors.IdentificationNumber = ['Vui lòng nhập số CCCD'];
    } else if (formData.identificationNumber.length !== 12) {
      newErrors.IdentificationNumber = ['Số CCCD phải gồm đúng 12 chữ số'];
    } else if (idNumberExists) {
      newErrors.IdentificationNumber = ['Số CCCD này đã được sử dụng'];
    }
    
    if (!formData.dateOfBirth) {
      newErrors.DateOfBirth = ['Vui lòng chọn ngày sinh'];
    }
    
    if (!formData.genderCode) {
      newErrors.GenderCode = ['Vui lòng chọn giới tính'];
    } 
    
    if (!formData.bloodTypeCode) {
      newErrors.BloodTypeCode = ['Vui lòng chọn nhóm máu'];
    }

    if (!formData.emergencyContactName?.trim()) {
      newErrors.EmergencyContactName = ['Vui lòng nhập họ tên người liên hệ khẩn cấp'];
    }
    
    if (!formData.emergencyContactPhone?.trim()) {
      newErrors.EmergencyContactPhone = ['Vui lòng nhập số điện thoại liên hệ khẩn cấp'];
    }
    
    if (formData.phoneNumber && formData.emergencyContactPhone && 
        formData.phoneNumber === formData.emergencyContactPhone) {
      newErrors.EmergencyContactPhone = ['Số điện thoại liên hệ khẩn cấp không được giống số điện thoại chính'];
    }

    setValidationErrors(newErrors);

    if (Object.keys(newErrors).length > 0) {
      return;
    }

    try {
      setIsLoading(true);
      
      const payload = {
        fullName: formData.fullName,
        phoneNumber: formData.phoneNumber,
        address: formData.address?.trim() || undefined,
        dateOfBirth: formData.dateOfBirth,
        identificationNumber: formData.identificationNumber,
        genderCode: formData.genderCode,
        bloodTypeCode: formData.bloodTypeCode,
        emergencyContactName: formData.emergencyContactName,
        emergencyContactPhone: formData.emergencyContactPhone,
        allergies: formData.allergies || undefined,
        medicalHistory: formData.medicalHistory || undefined,
      };

      const updatedUserData = await patientService.completeProfile(payload, user?.email || '');
      
      // Update user in context với dữ liệu từ server
      // API trả về user đã được cập nhật với isProfileCompleted = true
      if (updatedUserData) {
        updateUser({ 
          ...updatedUserData,
          isProfileCompleted: true,
        });
      } else {
        // Fallback nếu server không trả về data
        updateUser({ 
          isProfileCompleted: true,
          fullName: formData.fullName,
          phoneNumber: formData.phoneNumber,
          address: formData.address,
          dateOfBirth: formData.dateOfBirth,
          genderCode: formData.genderCode,
          identificationNumber: formData.identificationNumber,
        });
      }
      
      showToast('Hoàn thiện hồ sơ thành công!', 'success');
      navigate('/app/patient/dashboard');
    } catch (err: any) {
      setIsLoading(false);
      
      const status = err?.response?.status;

      if (status === 400 || status === 422) {
        const errorData = err.response?.data;
        
        const serverErrors: ValidationErrors = {};
        if (errorData?.errors) {
          Object.keys(errorData.errors).forEach(key => {
            serverErrors[key] = Array.isArray(errorData.errors[key]) 
              ? errorData.errors[key] 
              : [errorData.errors[key]];
          });
        }
        
        setValidationErrors(serverErrors);
      } else {
        setError(err.message || 'Đã xảy ra lỗi. Vui lòng thử lại.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="registration-container">
        <form onSubmit={handleSubmit} className="registration-form">
          <div className="form-header" style={{
            border: 'none',
            outline: 'none',
            boxShadow: 'none',
            background: 'none',
            padding: '0',
            margin: '0 0 40px 0',
          }}>
            <h1 style={{
              border: 'none',
              outline: 'none',
              boxShadow: 'none',
              background: 'none',
              padding: '0',
              margin: '0 0 8px 0',
            }}>Hoàn Thiện Hồ Sơ Bệnh Nhân</h1>
            <p style={{
              border: 'none',
              outline: 'none',
              boxShadow: 'none',
              background: 'none',
              padding: '0',
              margin: '0',
            }}>Vui lòng điền đầy đủ thông tin để sử dụng đầy đủ các tính năng của MEDIX</p>
            
            {user?.email && (
              <div style={{
                marginTop: '16px',
                padding: '12px 20px',
                backgroundColor: '#e3f2fd',
                borderRadius: '12px',
                display: 'inline-block',
              }}>
                <span style={{ color: '#1565c0', fontWeight: 500 }}>
                  <i className="bi bi-envelope-fill" style={{ marginRight: '8px' }}></i>
                  Email: {user.email}
                </span>
              </div>
            )}
          </div>

          <div className="form-layout">
            <div className="form-column left-column">
              <div className="form-section">
                <h2 className="section-title">Thông tin cá nhân</h2>
                
                <div className="form-group">
                  <label className="required">Họ và tên</label>
                  <input
                    type="text"
                    name="fullName"
                    value={formData.fullName}
                    onChange={handleChange}
                    onBlur={handleBlur}
                    placeholder="Nguyễn Văn A"
                    className={`form-control ${validationErrors.FullName?.[0]
                      ? 'is-invalid'
                      : formData.fullName?.trim()
                          ? 'is-valid'
                          : ''
                      }`}
                  />
                  {validationErrors.FullName?.[0] && <div className="text-danger">{validationErrors.FullName[0]}</div>}
                </div>

                <div className="form-group">
                  <label className="required">Số CCCD</label>
                  <input
                    type="text"
                    name="identificationNumber"
                    maxLength={12}
                    pattern="[0-9]{12}"
                    value={formData.identificationNumber}
                    onChange={handleChange}
                    onBlur={handleBlur}
                    placeholder="Nhập số căn cước công dân 12 số"
                    className={`form-control ${validationErrors.IdentificationNumber?.[0]
                      ? 'is-invalid'
                      : formData.identificationNumber?.trim()
                          ? 'is-valid'
                          : ''
                      }`}
                  />
                  {isCheckingIdNumber && (
                    <div className="mt-1">
                      <span className="info-text" style={{ fontSize: '12px', color: '#6c757d' }}>
                        Đang kiểm tra số CCCD...
                      </span>
                    </div>
                  )}
                  {validationErrors.IdentificationNumber?.[0] && <div className="text-danger">{validationErrors.IdentificationNumber[0]}</div>}
                  {idNumberExists && !validationErrors.IdentificationNumber && (
                    <div className="text-danger">Số CCCD này đã được sử dụng</div>
                  )}
                </div>

                <div className="form-group">
                  <label>Địa chỉ liên lạc</label>
                  <textarea
                    name="address"
                    rows={3}
                    value={formData.address}
                    onChange={handleChange}
                    placeholder="Nhập địa chỉ liên lạc của bạn"
                    className={validationErrors.address ? 'error' : ''}
                  />
                  {validationErrors.address && (
                    <div className="error-message" style={{ marginTop: '4px', fontSize: '12px' }}>
                      {validationErrors.address[0]}
                    </div>
                  )}
                </div>

                <div className="form-group">
                  <label className="required">Số điện thoại</label>
                  <input
                    type="tel"
                    name="phoneNumber"
                    maxLength={10}
                    value={formData.phoneNumber}
                    onChange={handleChange}
                    onBlur={handleBlur}
                    placeholder="09xxxxxxxx"
                    className={`form-control ${validationErrors.PhoneNumber?.[0]
                      ? 'is-invalid'
                      : formData.phoneNumber?.trim()
                          ? 'is-valid'
                          : ''
                      }`}
                  />
                  {validationErrors.PhoneNumber?.[0] && <div className="text-danger">{validationErrors.PhoneNumber[0]}</div>}
                </div>
              </div>
            </div>

            <div className="form-column right-column">
              <div className="form-section">
                <h2 className="section-title">Thông tin Y tế</h2>
                
                <div className="form-group">
                  <label className="required">Ngày sinh</label>
                  <input
                    type="text"
                    name="dateOfBirth"
                    value={dateOfBirthDisplay}
                    onChange={handleChange}
                    onBlur={handleBlur}
                    placeholder="dd/mm/yyyy"
                    title="Nhập ngày sinh theo định dạng: dd/mm/yyyy (ví dụ: 25/12/1990)"
                    maxLength={10}
                    className={`form-control ${validationErrors.DateOfBirth?.[0]
                      ? 'is-invalid'
                      : formData.dateOfBirth?.trim()
                          ? 'is-valid'
                          : ''
                      }`}
                    style={{ textAlign: 'left' }}
                  />
                  {validationErrors.DateOfBirth?.[0] && <div className="text-danger">{validationErrors.DateOfBirth[0]}</div>}
                </div>

                <div className="form-group">
                  <label className="required">Giới tính</label>
                  <div className="radio-group">
                    <label className="radio-option">
                      <input
                        type="radio"
                        name="genderCode"
                        value="Male"
                        checked={formData.genderCode === "Male"}
                        onChange={handleChange}
                      />
                      <span className="radio-custom"></span>
                      Nam
                    </label>
                    <label className="radio-option">
                      <input
                        type="radio"
                        name="genderCode"
                        value="Female"
                        checked={formData.genderCode === "Female"}
                        onChange={handleChange}
                      />
                      <span className="radio-custom"></span>
                      Nữ
                    </label>
                    <label className="radio-option">
                      <input
                        type="radio"
                        name="genderCode"
                        value="Other"
                        checked={formData.genderCode === "Other"}
                        onChange={handleChange}
                      />
                      <span className="radio-custom"></span>
                      Khác
                    </label>
                  </div>
                  {validationErrors.GenderCode?.[0] && <div className="text-danger">{validationErrors.GenderCode[0]}</div>}
                </div>

                <div className="form-group">
                  <label className="required">Nhóm máu</label>
                  <select
                    name="bloodTypeCode"
                    value={formData.bloodTypeCode}
                    onChange={handleChange}
                    onBlur={handleBlur}
                    className={`form-control ${validationErrors.BloodTypeCode?.[0]
                      ? 'is-invalid'
                      : formData.bloodTypeCode?.trim()
                          ? 'is-valid'
                          : ''
                      }`}
                  >
                    <option value="">Chọn nhóm máu</option>
                    {bloodTypes.length > 0 ? (
                      bloodTypes.map((bloodType) => (
                        <option key={bloodType.code} value={bloodType.code}>
                          {bloodType.displayName}
                        </option>
                      ))
                    ) : (
                      <option value="" disabled>Đang tải...</option>
                    )}
                  </select>
                  {validationErrors.BloodTypeCode?.[0] && <div className="text-danger">{validationErrors.BloodTypeCode[0]}</div>}
                </div>
              </div>

              <div className="form-section">
                <h2 className="section-title">Người liên hệ khẩn cấp</h2>
                
                <div className="form-group">
                  <label className="required">Họ tên người liên hệ</label>
                  <input
                    type="text"
                    name="emergencyContactName"
                    value={formData.emergencyContactName}
                    onChange={handleChange}
                    onBlur={handleBlur}
                    placeholder="Họ và tên"
                    className={`form-control ${validationErrors.EmergencyContactName?.[0]
                      ? 'is-invalid'
                      : formData.emergencyContactName?.trim()
                          ? 'is-valid'
                          : ''
                      }`}
                  />
                  {validationErrors.EmergencyContactName?.[0] && <div className="text-danger">{validationErrors.EmergencyContactName[0]}</div>}
                </div>

                <div className="form-group">
                  <label className="required">Số điện thoại liên hệ</label>
                  <input
                    type="tel"
                    name="emergencyContactPhone"
                    maxLength={10}
                    value={formData.emergencyContactPhone}
                    onChange={handleChange}
                    onBlur={handleBlur}
                    placeholder="Số điện thoại khẩn cấp"
                    className={`form-control ${validationErrors.EmergencyContactPhone?.[0]
                      ? 'is-invalid'
                      : formData.emergencyContactPhone?.trim()
                          ? 'is-valid'
                          : ''
                      }`}
                  />
                  {validationErrors.EmergencyContactPhone?.[0] && <div className="text-danger">{validationErrors.EmergencyContactPhone[0]}</div>}
                </div>
              </div>

              <div className="form-section">
                <h2 className="section-title">Tiền sử bệnh lý (không bắt buộc)</h2>
                
                <div className="form-group">
                  <label>Tiền sử bệnh lý</label>
                  <textarea
                    name="medicalHistory"
                    rows={3}
                    value={formData.medicalHistory}
                    onChange={handleChange}
                    placeholder="Vui lòng mô tả tiền sử bệnh lý, bệnh mãn tính..."
                  />
                </div>

                <div className="form-group">
                  <label>Dị ứng</label>
                  <textarea
                    name="allergies"
                    rows={3}
                    value={formData.allergies}
                    onChange={handleChange}
                    placeholder="Vui lòng liệt kê các loại dị ứng"
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="submit-section">
            {error && <div className="text-danger" style={{ marginBottom: '16px' }}>{error}</div>}
            <button
              type="submit"
              disabled={isLoading}
              className="btn-submit"
            >
              {isLoading ? (
                <>
                  <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                  Đang xử lý...
                </>
              ) : (
                'HOÀN THIỆN HỒ SƠ'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CompletePatientProfile;

