import React, { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  PersonalInfoSection,
  MedicalInfoSection,
  EmergencyContactSection,
  MedicalHistorySection
} from '../components';
import { emailVerificationService } from '../services';
import { patientRegistrationApiService } from '../services/patientRegistrationApiService';
import { FormData, PasswordStrength, initialFormData } from '../types/registrationTypes';
import { 
  validateEmail, 
  validatePhone, 
  validateIdNumber, 
  validateForm, 
  checkPasswordStrength,
  handleInputChange as handleInputChangeUtil,
  handleGenderChange
} from '../utils/validationregisterPatient';
import './RegistrationPage.css';

export function RegistrationPage() {
  const [formData, setFormData] = useState<FormData>(initialFormData);
  const navigate = useNavigate();
  const emailCheckTimeoutRef = useRef<number | null>(null);
  const idNumberCheckTimeoutRef = useRef<number | null>(null);

  const [agreedToTerms, setAgreedToTerms] = useState(false);
  const [termsError, setTermsError] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [emailVerified, setEmailVerified] = useState(false);
  const [emailVerificationSent, setEmailVerificationSent] = useState(false);
  const [verificationCode, setVerificationCode] = useState('');
  const [serverVerificationCode, setServerVerificationCode] = useState(''); // Lưu code từ server
  const [isSendingVerificationCode, setIsSendingVerificationCode] = useState(false); // Để tránh double click
  const [isVerifyingCode, setIsVerifyingCode] = useState(false);
  const [isResendingCode, setIsResendingCode] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isCheckingEmail, setIsCheckingEmail] = useState(false);
  const [emailCheckCompleted, setEmailCheckCompleted] = useState(false);
  const [isCheckingIdNumber, setIsCheckingIdNumber] = useState(false);
  const [idNumberCheckCompleted, setIdNumberCheckCompleted] = useState(false);
  const [passwordStrength, setPasswordStrength] = useState<PasswordStrength>({
    hasLowercase: false,
    hasUppercase: false,
    hasNumbers: false,
    hasSpecialChars: false,
    isLongEnough: false,
    score: 0
  });

  // Hàm kiểm tra email có tồn tại không
  const checkEmailExists = async (email: string) => {
    if (!email || validateEmail(email)) {
      setEmailCheckCompleted(false);
      return;
    }

    setIsCheckingEmail(true);
    try {
      const result = await patientRegistrationApiService.checkEmailExists(email);
      
      if (result.success && result.data?.exists) {
        // Email đã tồn tại
        setErrors(prev => ({
          ...prev,
          email: 'Email này đã được sử dụng'
        }));
        setEmailCheckCompleted(false);
      } else {
        // Email chưa tồn tại - có thể tiến hành verification
        setErrors(prev => ({
          ...prev,
          email: ''
        }));
        setEmailCheckCompleted(true);
      }
    } catch (error) {
      console.error('Error checking email:', error);
      setEmailCheckCompleted(false);
    } finally {
      setIsCheckingEmail(false);
    }
  };

  // Hàm kiểm tra số CCCD/CMND có tồn tại không
  const checkIdNumberExists = async (idNumber: string) => {
    if (!idNumber || validateIdNumber(idNumber)) {
      setIdNumberCheckCompleted(false);
      return;
    }

    setIsCheckingIdNumber(true);
    try {
      const result = await patientRegistrationApiService.checkIdNumberExists(idNumber);
      
      if (result.success && result.data?.exists) {
        // ID number đã tồn tại
        setErrors(prev => ({
          ...prev,
          identificationNumber: 'Số CCCD/CMND này đã được sử dụng'
        }));
        setIdNumberCheckCompleted(false);
      } else {
        // ID number chưa tồn tại - hợp lệ
        setErrors(prev => ({
          ...prev,
          identificationNumber: ''
        }));
        setIdNumberCheckCompleted(true);
      }
    } catch (error) {
      console.error('Error checking ID number:', error);
      setIdNumberCheckCompleted(false);
    } finally {
      setIsCheckingIdNumber(false);
    }
  };

  const handleEmailVerification = async () => {
    if (!formData.email || validateEmail(formData.email)) {
      setErrors(prev => ({
        ...prev,
        email: 'Vui lòng nhập email hợp lệ trước khi xác nhận'
      }));
      return;
    }

    if (!emailCheckCompleted) {
      setErrors(prev => ({
        ...prev,
        email: 'Vui lòng đợi kiểm tra email hoàn tất'
      }));
      return;
    }

    try {
      setIsSendingVerificationCode(true); // Set loading state
      // Clear any previous email errors
      setErrors(prev => ({
        ...prev,
        email: ''
      }));
      
      const result = await emailVerificationService.sendVerificationCode(formData.email);

      if (result.success && result.data?.verificationCode) {
        // Chỉ set emailVerificationSent = true khi thành công
        setEmailVerificationSent(true);
        // Lưu verification code từ server để so sánh
        setServerVerificationCode(String(result.data.verificationCode));
        // Hiển thị success message (có thể thêm success state nếu cần)
      } else {
        // Hiển thị lỗi dưới field email thay vì alert
        setErrors(prev => ({
          ...prev,
          email: result.error || 'Có lỗi xảy ra khi gửi email xác nhận'
        }));
        setEmailVerificationSent(false);
      }

    } catch (error) {
      console.error('Failed to send verification email:', error);
      // Hiển thị lỗi dưới field email thay vì alert
      setErrors(prev => ({
        ...prev,
        email: 'Có lỗi xảy ra khi gửi email xác nhận. Vui lòng thử lại.'
      }));
      setEmailVerificationSent(false);
    } finally {
      setIsSendingVerificationCode(false); // Clear loading state
    }
  };

  const handleVerifyCode = async () => {
    if (!verificationCode.trim()) {
      // Hiển thị lỗi dưới verification code field
      setErrors(prev => ({
        ...prev,
        verificationCode: 'Vui lòng nhập mã xác nhận'
      }));
      return;
    }

    try {
      setIsVerifyingCode(true);
      // Clear any previous verification code errors
      setErrors(prev => ({
        ...prev,
        verificationCode: ''
      }));
      
      // So sánh với code từ server
      if (verificationCode.trim() === serverVerificationCode.trim()) {
        setEmailVerified(true);
        setEmailVerificationSent(false);
        setVerificationCode('');
        setServerVerificationCode(''); // Clear server code
        // Success message có thể hiển thị trong UI component
      } else {
        // Hiển thị lỗi dưới verification code field
        setErrors(prev => ({
          ...prev,
          verificationCode: 'Mã xác nhận không đúng. Vui lòng kiểm tra lại.'
        }));
      }

    } catch (error) {
      console.error('Failed to verify email code:', error);
      // Hiển thị lỗi dưới verification code field
      setErrors(prev => ({
        ...prev,
        verificationCode: 'Có lỗi xảy ra khi xác nhận mã. Vui lòng thử lại.'
      }));
    } finally {
      setIsVerifyingCode(false);
    }
  };

  const handleResendCode = async () => {
    try {
      setIsResendingCode(true);
      const result = await emailVerificationService.resendVerificationCode(formData.email);

      if (result.success && result.data?.verificationCode) {
        // Cập nhật server verification code mới
        setServerVerificationCode(String(result.data.verificationCode));
        // Clear any previous errors
        setErrors(prev => ({
          ...prev,
          email: ''
        }));
      } else {
        // Hiển thị lỗi dưới email field
        setErrors(prev => ({
          ...prev,
          email: result.error || 'Có lỗi xảy ra khi gửi lại email xác nhận'
        }));
      }

    } catch (error) {
      console.error('Failed to resend verification email:', error);
      // Hiển thị lỗi dưới email field
      setErrors(prev => ({
        ...prev,
        email: 'Có lỗi xảy ra khi gửi lại email xác nhận. Vui lòng thử lại.'
      }));
    } finally {
      setIsResendingCode(false);
    }
  };

  // Hàm để handle verification code change và clear error
  const handleVerificationCodeChange = (code: string) => {
    setVerificationCode(code);
    // Clear verification code error khi user typing
    if (errors.verificationCode) {
      setErrors(prev => ({
        ...prev,
        verificationCode: ''
      }));
    }
  };

  const handleInputChange = (field: string, value: string) => {
    handleInputChangeUtil(field, value, formData, passwordStrength, setFormData, setErrors, setPasswordStrength);
    
    // Nếu là email field, reset email verification state và kiểm tra email
    if (field === 'email') {
      setEmailVerified(false);
      setEmailVerificationSent(false);
      setVerificationCode('');
      setServerVerificationCode(''); // Reset server code
      setEmailCheckCompleted(false);
      
      // Clear timeout trước đó
      if (emailCheckTimeoutRef.current) {
        clearTimeout(emailCheckTimeoutRef.current);
      }
      
      // Debounce check email - chỉ check khi user ngừng nhập 1 giây
      emailCheckTimeoutRef.current = window.setTimeout(() => {
        checkEmailExists(value);
      }, 1000);
    }
    
    // Nếu là identificationNumber field, kiểm tra ID number
    if (field === 'identificationNumber') {
      setIdNumberCheckCompleted(false);
      
      // Clear timeout trước đó
      if (idNumberCheckTimeoutRef.current) {
        clearTimeout(idNumberCheckTimeoutRef.current);
      }
      
      // Debounce check ID number - chỉ check khi user ngừng nhập 1 giây
      idNumberCheckTimeoutRef.current = window.setTimeout(() => {
        checkIdNumberExists(value);
      }, 1000);
    }
  };

  const handleFormValidation = (): boolean => {
    const newErrors = validateForm(formData, passwordStrength);
    setErrors(newErrors);
    
    // Nếu có lỗi, scroll đến field đầu tiên có lỗi
    if (Object.keys(newErrors).length > 0) {
      const firstErrorField = Object.keys(newErrors)[0];
      const fieldElement = document.getElementById(firstErrorField);
      if (fieldElement) {
        fieldElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
        fieldElement.focus();
      }
    }
    
    return Object.keys(newErrors).length === 0;
  };

  // Không cần kiểm tra email và ID nữa vì đã được check tự động
  const checkExistingData = async (): Promise<boolean> => {
    // Email và ID number đã được check tự động, chỉ cần return true
    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Kiểm tra điều khoản trước tiên
    if (!agreedToTerms) {
      setTermsError(true);
      alert('Vui lòng đồng ý với Điều khoản dịch vụ và Chính sách bảo mật');
      // Scroll đến phần điều khoản
      const termsElement = document.querySelector('.terms-section');
      if (termsElement) {
        termsElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
      return;
    }

    setTermsError(false);

    // Kiểm tra validation form
    if (!handleFormValidation()) {
      const errorFields = Object.keys(errors);
      const errorCount = errorFields.length;
      const errorMessage = errorCount === 1 
        ? 'Vui lòng điền đầy đủ thông tin bắt buộc'
        : `Vui lòng kiểm tra và sửa ${errorCount} lỗi trong form`;
      alert(errorMessage);
      return;
    }

    // Kiểm tra email đã được xác nhận chưa
    if (!emailVerified) {
      alert('Vui lòng xác nhận email trước khi đăng ký');
      // Scroll đến email verification section
      const emailElement = document.getElementById('email');
      if (emailElement) {
        emailElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
      return;
    }

    setIsSubmitting(true);

    try {
      // Kiểm tra dữ liệu đã tồn tại chưa
      const isDataValid = await checkExistingData();
      if (!isDataValid) {
        alert('Vui lòng kiểm tra lại thông tin. Email hoặc số CCCD/CMND đã được sử dụng.');
        setIsSubmitting(false);
        return;
      }

      // Call API để đăng ký bệnh nhân
      const result = await patientRegistrationApiService.registerPatient(formData);
      
      if (result.success && result.data) {
        alert(result.message || 'Đăng ký thành công!');
        console.log('Registration successful:', result.data);

        // Lưu token vào localStorage (tạm thời, có thể chuyển sang httpOnly cookie ở backend)
        try {
          localStorage.setItem('accessToken', result.data.AccessToken);
          localStorage.setItem('refreshToken', result.data.RefreshToken);
          localStorage.setItem('tokenExpiresAt', result.data.ExpiresAt);
        } catch (e) {
          console.warn('Cannot access localStorage:', e);
        }

        // Decode access token to get roles
        const payload = decodeJwt(result.data.AccessToken);
        const roles = getTokenRoles(payload);

        // Map roles to routes (điều chỉnh theo hệ thống)
        const redirectByRole = (rs: string[]): string => {
          const r = rs.map(x => x.toLowerCase());
          if (r.includes('admin')) return '/admin';
          if (r.includes('doctor')) return '/doctor';
          if (r.includes('nurse')) return '/nurse';
          if (r.includes('patient') || r.length === 0) return '/patient';
          return '/';
        };

        const target = redirectByRole(roles);
        navigate(target, { replace: true });
        
        // Reset form sau khi đăng ký thành công
        setFormData(initialFormData);
        setErrors({});
        setEmailVerified(false);
        setEmailVerificationSent(false);
        setVerificationCode('');
        setServerVerificationCode(''); // Reset server code
        setAgreedToTerms(false);
        setPasswordStrength({
          hasLowercase: false,
          hasUppercase: false,
          hasNumbers: false,
          hasSpecialChars: false,
          isLongEnough: false,
          score: 0
        });
        
        // Nếu muốn, có thể show toast thay vì alert
        
      } else {
        alert(result.error || 'Có lỗi xảy ra khi đăng ký. Vui lòng thử lại.');
        console.error('Registration failed:', result.error);
      }
      
    } catch (error) {
      console.error('Unexpected error during registration:', error);
      alert('Có lỗi không mong muốn xảy ra. Vui lòng thử lại sau.');
    } finally {
      setIsSubmitting(false);
    }
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
                isCheckingEmail={isCheckingEmail}
                emailCheckCompleted={emailCheckCompleted}
                isCheckingIdNumber={isCheckingIdNumber}
                idNumberCheckCompleted={idNumberCheckCompleted}
                isSendingVerificationCode={isSendingVerificationCode} // Thêm prop mới
                onEmailVerification={handleEmailVerification}
                onVerifyCode={handleVerifyCode}
                onResendCode={handleResendCode}
                onVerificationCodeChange={handleVerificationCodeChange}
                passwordStrength={passwordStrength}
              />
            </div>

            <div className="form-column right-column">
              <MedicalInfoSection
                formData={formData}
                onInputChange={handleInputChange}
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

            <button 
              type="submit" 
              className="submit-button"
              disabled={isSubmitting || !emailVerified}
            >
              {isSubmitting ? 'ĐANG ĐĂNG KÝ...' : 'ĐĂNG KÝ TÀI KHOẢN'}
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