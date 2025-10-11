import React, { useState } from 'react';
import { 
  PersonalInfoSection, 
  MedicalInfoSection, 
  EmergencyContactSection, 
  MedicalHistorySection 
} from '../components';
import { emailVerificationService } from '../services';
import './RegistrationPage.css';

interface FormData {
  // Personal Info - matching RegisterDTO
  email: string;
  password: string;
  confirmPassword: string; // for UI validation only
  fullname: string;
  phoneNumber: string;
  gender: boolean | null; // true = male, false = female, null = other
  identificationNumber: string;
  address: string;
  dateOfBirth: string;
  
  // Medical Info (not in DTO)
  bloodType: string;
  
  // Emergency Contact (not in DTO)
  emergencyContactName: string;
  emergencyRelationship: string;
  emergencyPhoneNumber: string;
  
  // Medical History (not in DTO)
  chronicDiseases: string;
  allergies: string;
}

export function RegistrationPage() {
  const [formData, setFormData] = useState<FormData>({
    email: '',
    password: '',
    confirmPassword: '',
    fullname: '',
    phoneNumber: '',
    gender: null,
    identificationNumber: '',
    address: '',
    dateOfBirth: '',
    bloodType: '',
    emergencyContactName: '',
    emergencyRelationship: '',
    emergencyPhoneNumber: '',
    chronicDiseases: '',
    allergies: ''
  });

  const [agreedToTerms, setAgreedToTerms] = useState(false);
  const [termsError, setTermsError] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [emailVerified, setEmailVerified] = useState(false);
  const [emailVerificationSent, setEmailVerificationSent] = useState(false);
  const [verificationCode, setVerificationCode] = useState('');
  const [isVerifyingCode, setIsVerifyingCode] = useState(false);
  const [isResendingCode, setIsResendingCode] = useState(false);
  const [passwordStrength, setPasswordStrength] = useState({
    hasLowercase: false,
    hasUppercase: false,
    hasNumbers: false,
    hasSpecialChars: false,
    isLongEnough: false,
    score: 0
  });

  // Real-time validation functions
  const validateEmail = (email: string): string => {
    if (!email) return '';
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email) ? '' : 'Email không hợp lệ';
  };

  const validatePhone = (phone: string): string => {
    if (!phone) return '';
    const phoneRegex = /^[0-9]{10,11}$/;
    return phoneRegex.test(phone.replace(/\s/g, '')) ? '' : 'Số điện thoại phải có 10-11 chữ số';
  };

  const validateIdNumber = (idNumber: string): string => {
    if (!idNumber) return '';
    const idRegex = /^[0-9]{9,12}$/;
    return idRegex.test(idNumber) ? '' : 'Số CCCD/CMND phải có 9-12 chữ số';
  };

  const checkPasswordStrength = (password: string) => {
    const hasLowercase = /[a-z]/.test(password);
    const hasUppercase = /[A-Z]/.test(password);
    const hasNumbers = /[0-9]/.test(password);
    const hasSpecialChars = /[?#@!$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password);
    const isLongEnough = password.length >= 8;

    let score = 0;
    if (hasLowercase) score++;
    if (hasUppercase) score++;
    if (hasNumbers) score++;
    if (hasSpecialChars) score++;
    if (isLongEnough) score++;

    setPasswordStrength({
      hasLowercase,
      hasUppercase,
      hasNumbers,
      hasSpecialChars,
      isLongEnough,
      score
    });

    return score >= 4;
  };

  const handleEmailVerification = async () => {
    if (!formData.email || validateEmail(formData.email)) {
      alert('Vui lòng nhập email hợp lệ trước khi xác nhận');
      return;
    }

    try {
      setEmailVerificationSent(true);
      const result = await emailVerificationService.sendVerificationCode(formData.email);
      
      if (result.success) {
        alert(result.message || 'Mã xác nhận đã được gửi đến email của bạn');
      } else {
        alert(result.error || 'Có lỗi xảy ra khi gửi email xác nhận');
        setEmailVerificationSent(false);
      }
      
    } catch (error) {
      console.error('Failed to send verification email:', error);
      alert('Có lỗi xảy ra khi gửi email xác nhận. Vui lòng thử lại.');
      setEmailVerificationSent(false);
    }
  };

  const handleVerifyCode = async () => {
    if (!verificationCode.trim()) {
      alert('Vui lòng nhập mã xác nhận');
      return;
    }

    try {
      setIsVerifyingCode(true);
      const result = await emailVerificationService.verifyEmailCode(formData.email, verificationCode);
      
      if (result.success) {
        setEmailVerified(true);
        setEmailVerificationSent(false);
        setVerificationCode('');
        alert(result.message || 'Email đã được xác nhận thành công');
      } else {
        alert(result.error || 'Mã xác nhận không đúng hoặc đã hết hạn');
      }
      
    } catch (error) {
      console.error('Failed to verify email code:', error);
      alert('Có lỗi xảy ra khi xác nhận mã. Vui lòng thử lại.');
    } finally {
      setIsVerifyingCode(false);
    }
  };

  const handleResendCode = async () => {
    try {
      setIsResendingCode(true);
      const result = await emailVerificationService.resendVerificationCode(formData.email);
      
      if (result.success) {
        alert(result.message || 'Mã xác nhận mới đã được gửi đến email của bạn');
      } else {
        alert(result.error || 'Có lỗi xảy ra khi gửi lại email xác nhận');
      }
      
    } catch (error) {
      console.error('Failed to resend verification email:', error);
      alert('Có lỗi xảy ra khi gửi lại email xác nhận. Vui lòng thử lại.');
    } finally {
      setIsResendingCode(false);
    }
  };

  const handleInputChange = (field: string, value: string) => {
    // Handle gender conversion from string to boolean
    let convertedValue: any = value;
    if (field === 'gender') {
      if (value === 'true') convertedValue = true;
      else if (value === 'false') convertedValue = false;
      else if (value === 'null') convertedValue = null;
      else convertedValue = null; // default for empty
    }

    setFormData(prev => ({
      ...prev,
      [field]: convertedValue
    }));
    
    // Real-time validation
    let error = '';
    
    switch (field) {
      case 'fullname':
        if (value && value.trim().length < 2) {
          error = 'Họ và tên phải có ít nhất 2 ký tự';
        }
        break;
      case 'email':
        error = validateEmail(value);
        break;
      case 'phoneNumber':
        error = validatePhone(value);
        break;
      case 'identificationNumber':
        error = validateIdNumber(value);
        break;
      case 'password':
        checkPasswordStrength(value);
        if (value && value.length < 8) {
          error = 'Mật khẩu phải có ít nhất 8 ký tự';
        } else if (value && passwordStrength.score < 3) {
          error = 'Mật khẩu cần mạnh hơn';
        }
        // Also validate confirm password if it exists
        if (formData.confirmPassword && value !== formData.confirmPassword) {
          setErrors(prev => ({
            ...prev,
            confirmPassword: 'Mật khẩu xác nhận không khớp'
          }));
        } else if (formData.confirmPassword && value === formData.confirmPassword) {
          setErrors(prev => ({
            ...prev,
            confirmPassword: ''
          }));
        }
        break;
      case 'confirmPassword':
        if (value && value !== formData.password) {
          error = 'Mật khẩu xác nhận không khớp';
        }
        break;
      case 'emergencyPhoneNumber':
        error = validatePhone(value);
        break;
    }
    
    // Update errors
    setErrors(prev => ({
      ...prev,
      [field]: error
    }));
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    // Required field validation
    if (!formData.fullname.trim()) newErrors.fullname = 'Họ và tên là bắt buộc';
    else if (formData.fullname.trim().length < 2) newErrors.fullname = 'Họ và tên phải có ít nhất 2 ký tự';
    
    if (!formData.identificationNumber.trim()) newErrors.identificationNumber = 'Số CCCD/CMND là bắt buộc';
    else {
      const idError = validateIdNumber(formData.identificationNumber);
      if (idError) newErrors.identificationNumber = idError;
    }
    
    if (!formData.address.trim()) newErrors.address = 'Địa chỉ liên lạc là bắt buộc';
    
    if (!formData.email.trim()) newErrors.email = 'Email là bắt buộc';
    else {
      const emailError = validateEmail(formData.email);
      if (emailError) newErrors.email = emailError;
    }
    
    if (!formData.phoneNumber.trim()) newErrors.phoneNumber = 'Số điện thoại là bắt buộc';
    else {
      const phoneError = validatePhone(formData.phoneNumber);
      if (phoneError) newErrors.phoneNumber = phoneError;
    }
    
    if (!formData.password) newErrors.password = 'Mật khẩu là bắt buộc';
    else if (formData.password.length < 8) newErrors.password = 'Mật khẩu phải có ít nhất 8 ký tự';
    else if (passwordStrength.score < 3) newErrors.password = 'Mật khẩu không đủ mạnh';
    
    if (!formData.confirmPassword) newErrors.confirmPassword = 'Xác nhận mật khẩu là bắt buộc';
    else if (formData.password !== formData.confirmPassword) newErrors.confirmPassword = 'Mật khẩu xác nhận không khớp';
    
    if (!formData.dateOfBirth) newErrors.dateOfBirth = 'Ngày sinh là bắt buộc';
    if (formData.gender === undefined) newErrors.gender = 'Giới tính là bắt buộc';
    if (!formData.bloodType) newErrors.bloodType = 'Nhóm máu là bắt buộc';
    if (!formData.emergencyContactName.trim()) newErrors.emergencyContactName = 'Họ tên người liên hệ là bắt buộc';
    if (!formData.emergencyRelationship.trim()) newErrors.emergencyRelationship = 'Mối quan hệ là bắt buộc';
    
    if (!formData.emergencyPhoneNumber.trim()) newErrors.emergencyPhoneNumber = 'Số điện thoại liên hệ là bắt buộc';
    else {
      const emergencyPhoneError = validatePhone(formData.emergencyPhoneNumber);
      if (emergencyPhoneError) newErrors.emergencyPhoneNumber = emergencyPhoneError;
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!agreedToTerms) {
      setTermsError(true);
      return;
    }
    
    setTermsError(false);
    
    if (!validateForm()) {
      alert('Vui lòng kiểm tra và điền đầy đủ thông tin');
      return;
    }
    
    console.log('Form submitted successfully:', formData);
    alert('Đăng ký thành công!');
    // Here you would typically send the data to your backend API
  };

  // Helper function to convert boolean gender to string for UI
  const getGenderForUI = (gender: boolean | null): 'male' | 'female' | 'other' | '' => {
    if (gender === true) return 'male';
    if (gender === false) return 'female';
    if (gender === null) return 'other';
    return '';
  };

  // Helper function to convert string gender from UI to boolean
  const setGenderFromUI = (genderString: string) => {
    if (genderString === 'male') return handleInputChange('gender', 'true');
    if (genderString === 'female') return handleInputChange('gender', 'false');
    if (genderString === 'other') return handleInputChange('gender', 'null');
    return handleInputChange('gender', '');
  };

  return (
    <div className="registration-container">
      <div className="registration-form">
        <div className="form-header">
          <h1>Đăng ký tài khoản MEDIX</h1>
          <p>Vui lòng điền đầy đủ thông tin để tạo tài khoản</p>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="form-layout">
            <div className="form-column left-column">
              <PersonalInfoSection 
                formData={formData} 
                onInputChange={handleInputChange}
                errors={errors}
                emailVerified={emailVerified}
                emailVerificationSent={emailVerificationSent}
                verificationCode={verificationCode}
                isVerifyingCode={isVerifyingCode}
                isResendingCode={isResendingCode}
                onEmailVerification={handleEmailVerification}
                onVerifyCode={handleVerifyCode}
                onResendCode={handleResendCode}
                onVerificationCodeChange={setVerificationCode}
                passwordStrength={passwordStrength}
              />
            </div>
            
            <div className="form-column right-column">
              <MedicalInfoSection 
                formData={{
                  dateOfBirth: formData.dateOfBirth,
                  gender: getGenderForUI(formData.gender),
                  bloodType: formData.bloodType
                }}
                onInputChange={(field: string, value: string) => {
                  if (field === 'gender') {
                    setGenderFromUI(value);
                  } else {
                    handleInputChange(field, value);
                  }
                }}
                errors={errors}
              />
              
              <EmergencyContactSection 
                formData={formData} 
                onInputChange={handleInputChange}
                errors={errors}
              />
              
              <MedicalHistorySection 
                formData={formData} 
                onInputChange={handleInputChange}
                errors={errors}
              />
            </div>
          </div>

          <div className="form-footer">
            <div className="terms-section">
              <label className={`terms-checkbox ${termsError ? 'error' : ''}`}>
                <input
                  type="checkbox"
                  checked={agreedToTerms}
                  onChange={(e) => {
                    setAgreedToTerms(e.target.checked);
                    if (e.target.checked) {
                      setTermsError(false);
                    }
                  }}
                />
                <span className="checkmark"></span>
                Tôi đồng ý với{' '}
                <a href="#" className="terms-link">Điều khoản dịch vụ</a> và{' '}
                <a href="#" className="terms-link">Chính sách bảo mật</a> của MEDIX
              </label>
              {termsError && <span className="error-message">Vui lòng đồng ý với Điều khoản dịch vụ và Chính sách bảo mật</span>}
            </div>

            <button type="submit" className="submit-button">
              ĐĂNG KÝ TÀI KHOẢN
            </button>

            <div className="login-link">
              Bạn đã có tài khoản? <a href="#" className="login-link-text">Đăng nhập ngay</a>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}