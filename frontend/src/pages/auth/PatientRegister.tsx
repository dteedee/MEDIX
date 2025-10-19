import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { emailVerificationService } from '../../services/mailverified';
import registrationService from '../../services/registrationService';
import { PatientRegistration, BloodType, Gender, RegisterRequestPatient, PatientDTO, ValidationErrors } from '../../types/auth.types';
import { Gender as GenderEnum } from '../../types/common.types';
import { validatePatientRegistrationForm, validatePassword, getPasswordStrength } from '../../utils/validation';
// @ts-ignore: allow importing CSS without type declarations
import '../../style/RegistrationPage.css';

export const PatientRegister: React.FC = () => {
  // Helper function to validate email format
  const isValidEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  // Helper function to parse and format date input
  const parseDateInput = (input: string): string => {
    // If input is already in YYYY-MM-DD format, return as is
    if (/^\d{4}-\d{2}-\d{2}$/.test(input)) {
      return input;
    }
    
    // Handle DD/MM/YYYY format
    const ddmmyyyyMatch = input.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
    if (ddmmyyyyMatch) {
      const [, day, month, year] = ddmmyyyyMatch;
      return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
    }
    
    // Handle DD-MM-YYYY format
    const ddmmyyyyDashMatch = input.match(/^(\d{1,2})-(\d{1,2})-(\d{4})$/);
    if (ddmmyyyyDashMatch) {
      const [, day, month, year] = ddmmyyyyDashMatch;
      return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
    }
    
    // Handle DDMMYYYY format (8 digits)
    const ddmmyyyyNoSepMatch = input.match(/^(\d{2})(\d{2})(\d{4})$/);
    if (ddmmyyyyNoSepMatch) {
      const [, day, month, year] = ddmmyyyyNoSepMatch;
      return `${year}-${month}-${day}`;
    }
    
    return input; // Return original if no format matches
  };

  const [formData, setFormData] = useState({
    // Phần 1: Thông tin cá nhân & đăng nhập
    fullName: '',
    identificationNumber: '',
    address: '',
    email: '',
    phoneNumber: '',
    password: '',
    passwordConfirmation: '', // Match backend
    
    // Phần 2: Thông tin Y tế & EMR
    dateOfBirth: '',
    genderCode: '', // Match backqend
    bloodTypeCode: '',
    
    // Phần 3: Người liên hệ khẩn cấp
    emergencyContactName: '',
    emergencyContactPhone: '',
    
    // Phần 4: Tiền sử bệnh lý
    medicalHistory: '',
    allergies: '',
    
    // Đồng ý điều khoản
    agreeTerms: false,
  });

  const [bloodTypes, setBloodTypes] = useState<BloodType[]>([]);
  const [genderOptions, setGenderOptions] = useState<{ code: string; displayName: string }[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string>('');
  const [validationErrors, setValidationErrors] = useState<ValidationErrors>({});
  const [passwordRequirements, setPasswordRequirements] = useState({
    minLength: false,
    hasUppercase: false,
    hasLowercase: false,
    hasNumber: false,
    hasSpecialChar: false,
  });

  // Email verification states
  const [emailVerificationSent, setEmailVerificationSent] = useState(false);
  const [emailVerified, setEmailVerified] = useState(false);
  const [verificationCode, setVerificationCode] = useState('');
  const [serverVerificationCode, setServerVerificationCode] = useState('');
  const [isCheckingEmail, setIsCheckingEmail] = useState(false);
  const [isVerifyingCode, setIsVerifyingCode] = useState(false);
  const [resendCountdown, setResendCountdown] = useState(0);
  const [resendEndTime, setResendEndTime] = useState<number | null>(null);

  // Email and ID validation states
  const [emailExists, setEmailExists] = useState(false);
  const [idNumberExists, setIdNumberExists] = useState(false);
  const [isCheckingIdNumber, setIsCheckingIdNumber] = useState(false);
  const [autoSendTriggered, setAutoSendTriggered] = useState(false);

  // Password visibility states
  const [showPassword, setShowPassword] = useState(false);
  const [showPasswordConfirmation, setShowPasswordConfirmation] = useState(false);

  const { registerPatient } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    // Load blood types and gender options
    const loadOptions = async () => {
      try {
        // Load blood types từ registrationService
        const bloodTypesResponse = await registrationService.getBloodTypes();
        if (bloodTypesResponse.success && bloodTypesResponse.data) {
          // Convert BloodTypeDTO to BloodType (add isActive field)
          const bloodTypesWithActive = bloodTypesResponse.data.map(bt => ({
            ...bt,
            isActive: true
          }));
          setBloodTypes(bloodTypesWithActive);
        } else {
          console.error('Failed to load blood types:', bloodTypesResponse.errors);
        }
        
        // Set gender options from enum
        const genderOptionsFromEnum = [
          { code: GenderEnum.MALE, displayName: 'Nam' },
          { code: GenderEnum.FEMALE, displayName: 'Nữ' },
          { code: GenderEnum.OTHER, displayName: 'Khác' }
        ];
        console.log('Gender Options:', genderOptionsFromEnum);
        setGenderOptions(genderOptionsFromEnum);
      } catch (err) {
        console.error('Error loading options:', err);
      }
    };

    loadOptions();
  }, []);

  useEffect(() => {
    // Update password requirements in real-time
    const requirements = validatePassword(formData.password);
    setPasswordRequirements(requirements);
  }, [formData.password]);

  // Debug useEffect to log genderCode changes
  useEffect(() => {
    console.log('formData.genderCode changed to:', formData.genderCode, 'Type:', typeof formData.genderCode);
  }, [formData.genderCode]);

  // Countdown timer for resend button - sử dụng timestamp để tránh bị pause khi tab inactive
  useEffect(() => {
    let intervalId: NodeJS.Timeout;

    if (resendEndTime) {
      const updateCountdown = () => {
        const now = Date.now();
        const remaining = Math.max(0, Math.ceil((resendEndTime - now) / 1000));
        
        if (remaining > 0) {
          setResendCountdown(remaining);
        } else {
          setResendCountdown(0);
          setResendEndTime(null);
        }
      };

      // Update immediately
      updateCountdown();
      
      // Update every 100ms for better accuracy
      intervalId = setInterval(updateCountdown, 100);
    } else {
      setResendCountdown(0);
    }

    return () => {
      if (intervalId) {
        clearInterval(intervalId);
      }
    };
  }, [resendEndTime]);

  // Handle visibility change để update countdown khi user quay lại tab
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (!document.hidden && resendEndTime) {
        const now = Date.now();
        const remaining = Math.max(0, Math.ceil((resendEndTime - now) / 1000));
        setResendCountdown(remaining);
        
        if (remaining <= 0) {
          setResendEndTime(null);
        }
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [resendEndTime]);

  // Auto-check email exists when user finishes typing
  useEffect(() => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    
    if (formData.email && emailRegex.test(formData.email)) {
      const timeoutId = setTimeout(async () => {
        setIsCheckingEmail(true);
        try {
          const response = await registrationService.checkEmailExists(formData.email);
          if (response.success && response.data) {
            setEmailExists(response.data.exists);
            if (response.data.exists) {
              // Reset verification states if email exists
              setEmailVerificationSent(false);
              setEmailVerified(false);
              setVerificationCode('');
              setServerVerificationCode('');
              setValidationErrors(prev => ({
                ...prev,
                email: ['Email này đã được sử dụng']
              }));
            } else {
              // Remove email error if exists
              setValidationErrors(prev => {
                const { email, ...rest } = prev;
                return rest;
              });
            }
          }
        } catch (error) {
          console.error('Error checking email:', error);
        } finally {
          setIsCheckingEmail(false);
        }
      }, 800); // Debounce 800ms

      return () => clearTimeout(timeoutId);
    } else {
      setEmailExists(false);
    }
  }, [formData.email]);

  // Clear email validation errors when email is verified
  useEffect(() => {
    if (emailVerified) {
      setValidationErrors(prev => {
        const { email, ...rest } = prev;
        return rest;
      });
    }
  }, [emailVerified]);

  // Auto-check ID number exists when user finishes typing
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
                identificationNumber: ['Số CCCD/CMND này đã được sử dụng']
              }));
            } else {
              // Remove ID error if exists
              setValidationErrors(prev => {
                const { identificationNumber, ...rest } = prev;
                return rest;
              });
            }
          }
        } catch (error) {
          console.error('Error checking ID number:', error);
        } finally {
          setIsCheckingIdNumber(false);
        }
      }, 800); // Debounce 800ms

      return () => clearTimeout(timeoutId);
    } else {
      setIdNumberExists(false);
    }
  }, [formData.identificationNumber]);

  // Auto-send verification code when email is valid and not sent yet
  useEffect(() => {
    if (formData.email && 
        isValidEmail(formData.email) && 
        !emailVerificationSent && 
        !autoSendTriggered &&
        !emailExists) {
      
      const timeoutId = setTimeout(async () => {
        setAutoSendTriggered(true);
        await handleSendVerificationCode();
      }, 1000); // Delay 1 second after user stops typing

      return () => clearTimeout(timeoutId);
    }
  }, [formData.email, emailVerificationSent, autoSendTriggered, emailExists]);

  // Handle send verification code
  const handleSendVerificationCode = async () => {
    if (!formData.email) {
      setError('Vui lòng nhập email');
      return;
    }

    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
      setError('Email không hợp lệ');
      return;
    }

    // Check if email already exists first
    setIsCheckingEmail(true);
    setError('');

    try {
      // First check if email exists
      const checkResult = await registrationService.checkEmailExists(formData.email);
      
      if (checkResult.success && checkResult.data?.exists) {
        setEmailExists(true);
        setError('Email này đã được sử dụng. Vui lòng sử dụng email khác.');
        setIsCheckingEmail(false);
        return;
      }

      // If email doesn't exist, send verification code
      const result = await emailVerificationService.sendVerificationCode(formData.email);
      
      if (result.success && result.data) {
        // Không cần lưu serverVerificationCode nữa vì verify qua API
        setEmailVerificationSent(true);
        setResendEndTime(Date.now() + 60000); // 60 seconds từ bây giờ
        setError('');
        // Show success message in UI instead of alert
      } else {
        setError(result.error || 'Không thể gửi mã xác nhận');
      }
    } catch (err) {
      setError('Có lỗi xảy ra khi gửi mã xác nhận');
    } finally {
      setIsCheckingEmail(false);
    }
  };

  // Handle verify code
  const handleVerifyCode = async () => {
    if (!verificationCode) {
      setError('Vui lòng nhập mã xác nhận');
      return;
    }

    setIsVerifyingCode(true);
    setError('');

    try {
      // Gọi API verify email code
      const result = await emailVerificationService.verifyEmailCode(formData.email, verificationCode);
      
      console.log('Verification result:', result); // Debug log
      
      if (result.success) {
        setEmailVerified(true);
        setError(''); // Clear error
        // Có thể thêm success message nếu cần
        console.log('Email verification successful!');
      } else {
        // Hiển thị thông báo lỗi khi mã code sai
        setError(result.error || 'Mã xác nhận không đúng. Vui lòng kiểm tra lại.');
        console.log('Verification failed:', result.error);
      }
    } catch (error) {
      console.error('Verification error:', error);
      setError('Có lỗi xảy ra khi xác thực mã. Vui lòng thử lại.');
    } finally {
      setIsVerifyingCode(false);
    }
  };

  // Handle resend verification code
  const handleResendCode = async () => {
    if (resendCountdown > 0) return;

    setIsCheckingEmail(true);
    setError('');
    // Ẩn thông báo success cũ khi bấm resend
    setEmailVerificationSent(false);

    try {
      const result = await emailVerificationService.resendVerificationCode(formData.email);
      
      if (result.success && result.data) {
        // Không cần lưu serverVerificationCode nữa vì verify qua API
        setResendEndTime(Date.now() + 60000);
        setError('');
        // Hiển thị lại thông báo success mới
        setEmailVerificationSent(true);
      } else {
        setError(result.error || 'Không thể gửi lại mã xác nhận');
      }
    } catch (err) {
      setError('Có lỗi xảy ra khi gửi lại mã xác nhận');
    } finally {
      setIsCheckingEmail(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    
    // Debug: Log current validation state
    console.log(`Field changed: ${name}, value: ${value}, has error: ${!!validationErrors[name]}`);
    
    if (type === 'checkbox') {
      const checked = (e.target as HTMLInputElement).checked;
      setFormData(prev => ({ ...prev, [name]: checked }));
      
      // Clear validation error for agreeTerms when checked
      if (name === 'agreeTerms' && checked && validationErrors.agreeTerms) {
        setValidationErrors(prev => {
          const { agreeTerms, ...rest } = prev;
          return rest;
        });
      }
    } else if (type === 'radio') {
      console.log('Radio button changed:', name, 'value:', value);
      setFormData(prev => ({ ...prev, [name]: value }));
      
      // Force clear validation error for radio buttons when selected (immediate)
      setValidationErrors(prev => {
        const { [name]: removedError, ...rest } = prev;
        console.log(`Force clearing validation error for radio field: ${name}`);
        return rest;
      });
    } else {
      // For identification number, only allow digits
      if (name === 'identificationNumber') {
        const numericValue = value.replace(/\D/g, ''); // Remove non-digits
        setFormData(prev => ({ ...prev, [name]: numericValue }));
        
        // Validate identification number length
        if (numericValue.length > 0 && numericValue.length !== 12) {
          setValidationErrors(prev => ({
            ...prev,
            identificationNumber: ['Số CCCD/CMND phải có đúng 12 ký tự']
          }));
        } else {
          // Clear error when exactly 12 characters or when field is empty
          if (validationErrors.identificationNumber) {
            console.log(`Clearing identification number validation error`);
            setValidationErrors(prev => {
              const { identificationNumber, ...rest } = prev;
              return rest;
            });
          }
        }
      } 
      // For phone number fields, only allow digits
      else if (name === 'phoneNumber' || name === 'emergencyContactPhone') {
        const numericValue = value.replace(/\D/g, ''); // Remove non-digits
        setFormData(prev => ({ ...prev, [name]: numericValue }));
        
        // Clear validation error for phone fields when user starts typing
        if (validationErrors[name] && numericValue.length > 0) {
          console.log(`Clearing validation error for phone field: ${name}`);
          setValidationErrors(prev => {
            const { [name]: removedError, ...rest } = prev;
            return rest;
          });
        }
      } else {
        setFormData(prev => ({ ...prev, [name]: value }));
        
        // Special validation for date of birth
        if (name === 'dateOfBirth') {
          let processedValue = value;
          
          // If user typed a date, try to parse it
          if (value && value !== formData.dateOfBirth) {
            processedValue = parseDateInput(value);
          }
          
          // Update form data with processed value
          setFormData(prev => ({ ...prev, [name]: processedValue }));
          
          if (processedValue) {
            const date = new Date(processedValue);
            const now = new Date();
            
            // Check if date is valid
            if (isNaN(date.getTime())) {
              setValidationErrors(prev => ({
                ...prev,
                dateOfBirth: ['Ngày sinh không hợp lệ. Vui lòng nhập đúng định dạng dd/mm/yyyy']
              }));
              return;
            }
            
            // Check if date is in the future
            if (date > now) {
              setValidationErrors(prev => ({
                ...prev,
                dateOfBirth: ['Ngày sinh không thể là ngày trong tương lai']
              }));
              return;
            }
            
            // Calculate age more accurately considering month and day
            let age = now.getFullYear() - date.getFullYear();
            const monthDiff = now.getMonth() - date.getMonth();
            
            if (monthDiff < 0 || (monthDiff === 0 && now.getDate() < date.getDate())) {
              age--;
            }
            
            if (age < 18) {
              setValidationErrors(prev => ({
                ...prev,
                dateOfBirth: ['Bạn phải đủ 18 tuổi để đăng ký']
              }));
            } else if (age > 150) {
              setValidationErrors(prev => ({
                ...prev,
                dateOfBirth: ['Ngày sinh không hợp lý']
              }));
            } else if (validationErrors.dateOfBirth) {
              // Clear error when age is valid
              setValidationErrors(prev => {
                const { dateOfBirth, ...rest } = prev;
                return rest;
              });
            }
          }
          return; // Early return for date processing
        }
        // Clear validation error for any field when user starts typing/selecting
        else if (validationErrors[name]) {
          // For text inputs, clear error when there's content
          // For select/date inputs, clear error immediately when changed
          if ((type === 'select-one' || type === 'date' || value.trim().length > 0)) {
            console.log(`Clearing validation error for field: ${name}`);
            setValidationErrors(prev => {
              const { [name]: removedError, ...rest } = prev;
              return rest;
            });
          }
        }
        
        // Reset auto-send trigger when email changes
        if (name === 'email') {
          setAutoSendTriggered(false);
          setEmailVerificationSent(false);
          setEmailVerified(false);
          setEmailExists(false);
          setVerificationCode('');
        }
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setValidationErrors({});
    
    // Check all required fields first
    const newErrors: ValidationErrors = {};
    
    // Check required basic fields
    if (!formData.fullName?.trim()) {
      newErrors.fullName = ['Họ và tên là trường bắt buộc'];
    }
    
    if (!formData.email?.trim()) {
      newErrors.email = ['Email là trường bắt buộc'];
    } else if (emailExists) {
      newErrors.email = ['Email này đã được sử dụng. Vui lòng sử dụng email khác.'];
    } else if (!emailVerified) {
      newErrors.email = ['Vui lòng xác thực email trước khi đăng ký'];
    }
    
    if (!formData.phoneNumber?.trim()) {
      newErrors.phoneNumber = ['Số điện thoại là trường bắt buộc'];
    }
    
    if (!formData.password) {
      newErrors.password = ['Mật khẩu là trường bắt buộc'];
    }
    
    if (!formData.passwordConfirmation) {
      newErrors.passwordConfirmation = ['Xác nhận mật khẩu là trường bắt buộc'];
    }
    
    // Check identification number
    if (!formData.identificationNumber?.trim()) {
      newErrors.identificationNumber = ['Số CCCD/CMND là trường bắt buộc'];
    } else if (formData.identificationNumber && formData.identificationNumber.length !== 12) {
      newErrors.identificationNumber = ['Số CCCD/CMND phải có đúng 12 ký tự'];
    } else if (idNumberExists) {
      newErrors.identificationNumber = ['Số CCCD/CMND này đã được sử dụng. Vui lòng kiểm tra lại.'];
    }
    
    if (!formData.dateOfBirth) {
      newErrors.dateOfBirth = ['Vui lòng chọn ngày sinh'];
    }
    
    if (!formData.genderCode) {
      newErrors.genderCode = ['Vui lòng chọn giới tính'];
    } 
    
    if (!formData.bloodTypeCode) {
      newErrors.bloodTypeCode = ['Vui lòng chọn nhóm máu'];
    }

    // Check required emergency contact fields
    if (!formData.emergencyContactName?.trim()) {
      newErrors.emergencyContactName = ['Vui lòng nhập họ tên người liên hệ khẩn cấp'];
    }
    
    if (!formData.emergencyContactPhone?.trim()) {
      newErrors.emergencyContactPhone = ['Vui lòng nhập số điện thoại liên hệ khẩn cấp'];
    }

    // Check terms agreement
    if (!formData.agreeTerms) {
      newErrors.agreeTerms = ['Vui lòng đồng ý với điều khoản dịch vụ'];
    }

    // Validate form data
    const errors = validatePatientRegistrationForm(formData);
    
    // Merge validation errors
    const allErrors = { ...errors, ...newErrors };
    setValidationErrors(allErrors);

    // Check for validation errors
    if (Object.keys(allErrors).length > 0) {
      return;
    }

    try {
      setIsLoading(true);
      
      const registerRequest: RegisterRequestPatient = {
        email: formData.email,
        password: formData.password,
        passwordConfirmation: formData.passwordConfirmation,
        fullName: formData.fullName,
        phoneNumber: formData.phoneNumber || undefined,
        address: formData.address?.trim() || undefined, // Ensure no empty strings
        dateOfBirth: formData.dateOfBirth || undefined,
        identificationNumber: formData.identificationNumber || undefined,
        genderCode: formData.genderCode || undefined,
      };

      // Debug log to check data being sent
      console.log('Registration data being sent:', {
        registerRequest,
        address: formData.address,
        genderCode: formData.genderCode,
        genderCodeType: typeof formData.genderCode,
        formDataFull: formData
      });

      const patientDTO: PatientDTO = {
        bloodTypeCode: formData.bloodTypeCode || undefined,
        emergencyContactName: formData.emergencyContactName,
        emergencyContactPhone: formData.emergencyContactPhone,
        allergies: formData.allergies || undefined,
        medicalHistory: formData.medicalHistory || undefined,
      };

      const patientRegistration: PatientRegistration = {
        registerRequest,
        patientDTO,
      };

      await registerPatient(patientRegistration);
      // Redirect to patient dashboard after successful registration
      navigate('/app/patient/dashboard');
    } catch (err: any) {
      console.error('Registration error:', err);
      setError(err.message || 'Đăng ký thất bại. Vui lòng thử lại.');
    } finally {
      setIsLoading(false);
    }
  };

  const passwordsMatch = formData.password && formData.passwordConfirmation && 
                         formData.password === formData.passwordConfirmation;

  const passwordStrength = getPasswordStrength(formData.password);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-blue-600 text-white py-4">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between">
            <Link to="/" className="text-2xl font-bold">MEDIX</Link>
            <p className="text-blue-100">HỆ THỐNG Y TẾ THÔNG MINH ỨNG DỤNG AI</p>
            <div className="flex space-x-4">
              <Link to="/login" className="bg-transparent border border-white px-4 py-2 rounded hover:bg-white hover:text-blue-600 transition">
                Đăng Nhập
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="registration-container">
        <form onSubmit={handleSubmit} className="registration-form">
          <div className="form-header">
            <h1>Đăng Ký Tài Khoản Bệnh Nhân</h1>
            <p>Vui lòng điền đầy đủ thông tin để tạo tài khoản</p>
          </div>

          <div className="form-layout">
            {/* Left Column */}
            <div className="form-column left-column">
              {/* Phần 1: Thông tin cá nhân & đăng nhập */}
              <div className="form-section">
                <h2 className="section-title">Phần 1: Thông tin cá nhân & đăng nhập</h2>
                
                <div className="form-group">
                  <label className="required">Họ và tên</label>
                  <div style={{ position: 'relative' }}>
                    <input
                      type="text"
                      name="fullName"
                      
                      value={formData.fullName}
                      onChange={handleChange}
                      placeholder="Nguyễn Văn A"
                      className={validationErrors.fullName ? 'error' : formData.fullName?.trim() ? 'success' : ''}
                      style={formData.fullName?.trim() && !validationErrors.fullName ? { paddingRight: '40px' } : {}}
                    />
                    {formData.fullName?.trim() && !validationErrors.fullName && (
                      <span style={{
                        position: 'absolute',
                        right: '10px',
                        top: '50%',
                        transform: 'translateY(-50%)',
                        color: '#27ae60',
                        fontSize: '16px',
                        fontWeight: 'bold'
                      }}>
                        ✓
                      </span>
                    )}
                  </div>
                  {validationErrors.fullName && (
                    <div className="error-message" style={{ marginTop: '4px', fontSize: '12px' }}>
                      {validationErrors.fullName[0]}
                    </div>
                  )}
                </div>

                <div className="form-group">
                  <label className="required">Số CCCD/CMND</label>
                  <div style={{ position: 'relative' }}>
                    <input
                      type="text"
                      name="identificationNumber"
                      
                      maxLength={12}
                      pattern="[0-9]{12}"
                      value={formData.identificationNumber}
                      onChange={handleChange}
                      placeholder="Nhập số căn cước công dân (đúng 12 ký tự)"
                      className={idNumberExists || validationErrors.identificationNumber ? 'error' : 
                        (formData.identificationNumber?.length === 12 && !idNumberExists) ? 'success' : ''}
                      style={(formData.identificationNumber?.length === 12 && !idNumberExists && !validationErrors.identificationNumber) ? { paddingRight: '40px' } : {}}
                    />
                    {formData.identificationNumber?.length === 12 && !idNumberExists && !validationErrors.identificationNumber && (
                      <span style={{
                        position: 'absolute',
                        right: '10px',
                        top: '50%',
                        transform: 'translateY(-50%)',
                        color: '#27ae60',
                        fontSize: '16px',
                        fontWeight: 'bold'
                      }}>
                        ✓
                      </span>
                    )}
                  </div>
                  {isCheckingIdNumber && (
                    <div className="mt-1">
                      <span className="info-text" style={{ fontSize: '12px', color: '#6c757d' }}>
                        Đang kiểm tra số CCCD/CMND...
                      </span>
                    </div>
                  )}
                  {validationErrors.identificationNumber && (
                    <div className="error-message">
                      {validationErrors.identificationNumber[0]}
                    </div>
                  )}
                  {idNumberExists && !validationErrors.identificationNumber && (
                    <div className="error-message">
                      Số CCCD/CMND này đã được sử dụng
                    </div>
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
                  <label className="required">Email</label>
                  <div className="email-input-group">
                    <input
                      type="email"
                      name="email"
                      
                      value={formData.email}
                      onChange={handleChange}
                      placeholder="Email@example.com"
                      disabled={emailVerified}
                      className={emailVerified ? 'success' : emailExists ? 'error' : ''}
                      style={emailExists ? { borderColor: '#e74c3c', backgroundColor: '#fdf2f2' } : {}}
                    />
                    {/* Hide button when verification code is sent but not yet verified */}
                    {!emailVerificationSent && (
                      <button
                        type="button"
                        onClick={handleSendVerificationCode}
                        disabled={isCheckingEmail || emailVerified || !formData.email || emailExists}
                        className={`verify-email-btn ${emailVerified ? 'verified' : ''} ${isCheckingEmail ? 'checking' : ''}`}
                      >
                        {isCheckingEmail ? 'Đang kiểm tra...' : emailVerified ? '✓ Đã xác thực' : 'Gửi mã xác thực'}
                      </button>
                    )}
                    {emailVerified && (
                      <button
                        type="button"
                        disabled
                        className="verify-email-btn verified"
                      >
                        ✓ Đã xác thực
                      </button>
                    )}
                  </div>
                  {isCheckingEmail && (
                    <div className="mt-1">
                      <span className="info-text" style={{ fontSize: '12px', color: '#6c757d' }}>
                        Đang kiểm tra email...
                      </span>
                    </div>
                  )}
                  {emailExists && (
                    <div className="error-message" style={{ 
                      marginTop: '4px', 
                      fontSize: '12px',
                      padding: '8px 12px',
                      borderLeft: '3px solid #e74c3c'
                    }}>
                      ❌ Email này đã được sử dụng. Vui lòng sử dụng email khác.
                    </div>
                  )}
                  {emailVerificationSent && !emailVerified && !emailExists && (
                    <div className="success-message" style={{ 
                      marginTop: '4px', 
                      fontSize: '12px',
                      padding: '8px 12px',
                      borderLeft: '3px solid #27ae60',
                      backgroundColor: '#f8fff8',
                      color: '#27ae60'
                    }}>
                      ✅ Mã xác thực đã được gửi đến email của bạn!
                    </div>
                  )}
                  {validationErrors.email && !emailExists && !emailVerified && (
                    <div className="error-message" style={{ marginTop: '4px', fontSize: '12px' }}>
                      ❌ {validationErrors.email[0]}
                    </div>
                  )}
                  {emailVerified && !emailExists && (
                    <div className="email-verified-message" style={{ 
                      marginTop: '4px', 
                      fontSize: '12px',
                      padding: '8px 12px',
                      borderLeft: '3px solid #27ae60',
                      backgroundColor: '#f8f9fa',
                      color: '#27ae60'
                    }}>
                      ✓ Email đã được xác thực
                    </div>
                  )}
                </div>

                {/* Verification Code Section - Only show if email doesn't exist */}
                {emailVerificationSent && !emailVerified && !emailExists && (
                  <div className="verification-code-section">
                    <div className="verification-info">
                      <p className="info-text">
                        📧 Mã xác nhận đã được gửi đến email <strong>{formData.email}</strong>
                      </p>
                    </div>
                    
                    <div className="verification-input-group">
                      <input
                        type="text"
                        className="verification-code-input"
                        placeholder="Nhập mã xác nhận"
                        value={verificationCode}
                        onChange={(e) => {
                          setVerificationCode(e.target.value);
                          // Xóa thông báo lỗi khi người dùng nhập lại
                          if (error) setError('');
                        }}
                        maxLength={6}
                      />
                      <button
                        type="button"
                        onClick={handleVerifyCode}
                        disabled={isVerifyingCode || !verificationCode}
                        className="verify-code-btn"
                      >
                        {isVerifyingCode ? 'Đang kiểm tra...' : 'Xác nhận'}
                      </button>
                    </div>

                    {/* Hiển thị lỗi xác thực mã */}
                    {error && (
                      <div className="error-message" style={{ 
                        marginTop: '8px', 
                        fontSize: '12px',
                        padding: '8px 12px',
                        borderLeft: '3px solid #e74c3c',
                        backgroundColor: '#fdf2f2',
                        color: '#e74c3c'
                      }}>
                        ❌ {error}
                      </div>
                    )}

                    <div className="resend-section">
                      <span className="resend-text">
                        Không nhận được mã? 
                      </span>
                      <button
                        type="button"
                        onClick={handleResendCode}
                        disabled={resendCountdown > 0}
                        className="resend-btn"
                      >
                        {resendCountdown > 0 ? `Gửi lại sau ${resendCountdown}s` : 'Gửi lại'}
                      </button>
                    </div>
                  </div>
                )}

                <div className="form-group">
                  <label className="required">Số điện thoại</label>
                  <div style={{ position: 'relative' }}>
                    <input
                      type="tel"
                      name="phoneNumber"
                      
                      maxLength={10}
                      value={formData.phoneNumber}
                      onChange={handleChange}
                      placeholder="09xxxxxxxx"
                      className={validationErrors.phoneNumber ? 'error' : formData.phoneNumber?.trim() ? 'success' : ''}
                      style={formData.phoneNumber?.trim() && !validationErrors.phoneNumber ? { paddingRight: '40px' } : {}}
                    />
                    {formData.phoneNumber?.trim() && !validationErrors.phoneNumber && (
                      <span style={{
                        position: 'absolute',
                        right: '10px',
                        top: '50%',
                        transform: 'translateY(-50%)',
                        color: '#27ae60',
                        fontSize: '16px',
                        fontWeight: 'bold'
                      }}>
                        ✓
                      </span>
                    )}
                  </div>
                  {validationErrors.phoneNumber && (
                    <div className="error-message" style={{ marginTop: '4px', fontSize: '12px' }}>
                      {validationErrors.phoneNumber[0]}
                    </div>
                  )}
                </div>

                <div className="form-group">
                  <label className="required">Mật khẩu</label>
                  <div style={{ position: 'relative' }}>
                    <input
                      type={showPassword ? "text" : "password"}
                      name="password"
                      
                      value={formData.password}
                      onChange={handleChange}
                      placeholder="••••••••"
                      className={validationErrors.password ? 'error' : ''}
                      style={{ paddingRight: '45px' }}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      style={{
                        position: 'absolute',
                        right: '10px',
                        top: '50%',
                        transform: 'translateY(-50%)',
                        background: 'transparent',
                        border: 'none',
                        cursor: 'pointer',
                        fontSize: '18px',
                        color: '#6c757d',
                        padding: '5px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                      }}
                      title={showPassword ? "Ẩn mật khẩu" : "Hiển thị mật khẩu"}
                    >
                      {showPassword ? '👁️' : '👁️‍🗨️'}
                    </button>
                  </div>
                  {validationErrors.password && (
                    <div className="error-message" style={{ marginTop: '4px', fontSize: '12px' }}>
                      {validationErrors.password[0]}
                    </div>
                  )}
                  
                  {/* Password Requirements */}
                  <div className="password-requirements">
                    <h4>Yêu cầu mật khẩu:</h4>
                    <div className="requirement-list">
                      <div className={passwordRequirements.minLength ? 'requirement met' : 'requirement'}>
                        <span className="check-icon">{passwordRequirements.minLength ? '✓' : '✗'}</span>
                        Ít nhất 6 ký tự
                      </div>
                      <div className={passwordRequirements.hasUppercase ? 'requirement met' : 'requirement'}>
                        <span className="check-icon">{passwordRequirements.hasUppercase ? '✓' : '✗'}</span>
                        Có chữ hoa (A, B, C)
                      </div>
                      <div className={passwordRequirements.hasLowercase ? 'requirement met' : 'requirement'}>
                        <span className="check-icon">{passwordRequirements.hasLowercase ? '✓' : '✗'}</span>
                        Có chữ thường (a, b, c)
                      </div>
                      <div className={passwordRequirements.hasNumber ? 'requirement met' : 'requirement'}>
                        <span className="check-icon">{passwordRequirements.hasNumber ? '✓' : '✗'}</span>
                        Có số (1, 2, 3)
                      </div>
                      <div className={passwordRequirements.hasSpecialChar ? 'requirement met' : 'requirement'}>
                        <span className="check-icon">{passwordRequirements.hasSpecialChar ? '✓' : '✗'}</span>
                        Có ký tự đặc biệt (!@#$%)
                      </div>
                    </div>
                    <div className="password-strength">
                      <span style={{ fontSize: '12px', color: '#6c757d' }}>Độ mạnh:</span>
                      <span className={`strength-text ${passwordStrength.label.toLowerCase()}`} style={{ color: passwordStrength.color }}>
                        {passwordStrength.label}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="form-group">
                  <label className="required">Xác nhận mật khẩu</label>
                  <div style={{ position: 'relative' }}>
                    <input
                      type={showPasswordConfirmation ? "text" : "password"}
                      name="passwordConfirmation"
                      
                      value={formData.passwordConfirmation}
                      onChange={handleChange}
                      placeholder="••••••••"
                      className={validationErrors.passwordConfirmation ? 'error' : ''}
                      style={{ paddingRight: '45px' }}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPasswordConfirmation(!showPasswordConfirmation)}
                      style={{
                        position: 'absolute',
                        right: '10px',
                        top: '50%',
                        transform: 'translateY(-50%)',
                        background: 'transparent',
                        border: 'none',
                        cursor: 'pointer',
                        fontSize: '18px',
                        color: '#6c757d',
                        padding: '5px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                      }}
                      title={showPasswordConfirmation ? "Ẩn mật khẩu" : "Hiển thị mật khẩu"}
                    >
                      {showPasswordConfirmation ? '👁️' : '👁️‍🗨️'}
                    </button>
                  </div>
                  {formData.passwordConfirmation && (
                    <div className="password-match">
                      {passwordsMatch ? (
                        <span className="match-text success-text">✓ Mật khẩu khớp</span>
                      ) : (
                        <span className="error-message">✗ Mật khẩu không khớp</span>
                      )}
                    </div>
                  )}
                  {validationErrors.passwordConfirmation && (
                    <div className="error-message" style={{ marginTop: '4px', fontSize: '12px' }}>
                      {validationErrors.passwordConfirmation[0]}
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Right Column */}
            <div className="form-column right-column">
              {/* Phần 2: Thông tin Y tế & EMR */}
              <div className="form-section">
                <h2 className="section-title">Phần 2: Thông tin Y tế & EMR</h2>
                
                <div className="form-group">
                  <label className="required">Ngày sinh</label>
                  <div style={{ position: 'relative' }}>
                    <input
                      type="date"
                      name="dateOfBirth"
                      value={formData.dateOfBirth}
                      onChange={handleChange}
                      placeholder="dd/mm/yyyy"
                      title="Bạn có thể nhập trực tiếp hoặc chọn từ lịch"
                      className={validationErrors.dateOfBirth ? 'error' : formData.dateOfBirth ? 'success' : ''}
                      style={{
                        ...(formData.dateOfBirth && !validationErrors.dateOfBirth ? { paddingRight: '40px' } : {}),
                        cursor: 'text'
                      }}
                      onFocus={(e) => {
                        // Hiển thị calendar khi focus
                        e.target.showPicker && e.target.showPicker();
                      }}
                    />
                    {formData.dateOfBirth && !validationErrors.dateOfBirth && (
                      <span style={{
                        position: 'absolute',
                        right: '10px',
                        top: '50%',
                        transform: 'translateY(-50%)',
                        color: '#27ae60',
                        fontSize: '16px',
                        fontWeight: 'bold'
                      }}>
                        ✓
                      </span>
                    )}
                  </div>
                  {!validationErrors.dateOfBirth && (
                    <div style={{ marginTop: '4px', fontSize: '11px', color: '#6b7280' }}>
                      💡 Bạn có thể nhập: dd/mm/yyyy, dd-mm-yyyy, ddmmyyyy hoặc chọn từ lịch
                    </div>
                  )}
                  {validationErrors.dateOfBirth && (
                    <div className="error-message" style={{ marginTop: '4px', fontSize: '12px' }}>
                      {validationErrors.dateOfBirth[0]}
                    </div>
                  )}
                </div>

                <div className="form-group" style={{ position: 'relative' }}>
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
                  {formData.genderCode && !validationErrors.genderCode && (
                    <span 
                      className="success-checkmark" 
                      style={{ 
                        position: 'absolute', 
                        right: '15px', 
                        top: '36px', 
                        color: '#4CAF50',
                        fontSize: '18px'
                      }}
                    >
                      ✓
                    </span>
                  )}
                  {validationErrors.genderCode && (
                    <div className="error-message" style={{ marginTop: '4px', fontSize: '12px' }}>
                      {validationErrors.genderCode[0]}
                    </div>
                  )}
                </div>

                <div className="form-group">
                  <label className="required">Nhóm máu</label>
                  <div style={{ position: 'relative' }}>
                    <select
                      name="bloodTypeCode"
                      
                      value={formData.bloodTypeCode}
                      onChange={handleChange}
                      className={validationErrors.bloodTypeCode ? 'error' : formData.bloodTypeCode ? 'success' : ''}
                      style={formData.bloodTypeCode && !validationErrors.bloodTypeCode ? { paddingRight: '40px' } : {}}
                    >
                      <option value="">Chọn nhóm máu</option>
                      {bloodTypes.map((bloodType) => (
                        <option key={bloodType.code} value={bloodType.code}>
                          {bloodType.displayName}
                        </option>
                      ))}
                    </select>
                    {formData.bloodTypeCode && !validationErrors.bloodTypeCode && (
                      <span style={{
                        position: 'absolute',
                        right: '10px',
                        top: '50%',
                        transform: 'translateY(-50%)',
                        color: '#27ae60',
                        fontSize: '16px',
                        fontWeight: 'bold',
                        pointerEvents: 'none'
                      }}>
                        ✓
                      </span>
                    )}
                  </div>
                  {validationErrors.bloodTypeCode && (
                    <div className="error-message" style={{ marginTop: '4px', fontSize: '12px' }}>
                      {validationErrors.bloodTypeCode[0]}
                    </div>
                  )}
                </div>
              </div>
              {/* Phần 3: Người liên hệ khẩn cấp */}
              <div className="form-section">
                <h2 className="section-title">Phần 3: Người liên hệ khẩn cấp</h2>
                
                <div className="form-group">
                  <label className="required">Họ tên người liên hệ</label>
                  <div style={{ position: 'relative' }}>
                    <input
                      type="text"
                      name="emergencyContactName"
                      
                      value={formData.emergencyContactName}
                      onChange={handleChange}
                      placeholder="Họ và tên"
                      className={validationErrors.emergencyContactName ? 'error' : formData.emergencyContactName?.trim() ? 'success' : ''}
                      style={formData.emergencyContactName?.trim() && !validationErrors.emergencyContactName ? { paddingRight: '40px' } : {}}
                    />
                    {formData.emergencyContactName?.trim() && !validationErrors.emergencyContactName && (
                      <span style={{
                        position: 'absolute',
                        right: '10px',
                        top: '50%',
                        transform: 'translateY(-50%)',
                        color: '#27ae60',
                        fontSize: '16px',
                        fontWeight: 'bold'
                      }}>
                        ✓
                      </span>
                    )}
                  </div>
                  {validationErrors.emergencyContactName && (
                    <div className="error-message" style={{ marginTop: '4px', fontSize: '12px' }}>
                      {validationErrors.emergencyContactName[0]}
                    </div>
                  )}
                </div>

                <div className="form-group">
                  <label className="required">Số điện thoại liên hệ</label>
                  <div style={{ position: 'relative' }}>
                    <input
                      type="tel"
                      name="emergencyContactPhone"
                      
                      value={formData.emergencyContactPhone}
                      onChange={handleChange}
                      placeholder="Số điện thoại khẩn cấp"
                      className={validationErrors.emergencyContactPhone ? 'error' : formData.emergencyContactPhone?.trim() ? 'success' : ''}
                      style={formData.emergencyContactPhone?.trim() && !validationErrors.emergencyContactPhone ? { paddingRight: '40px' } : {}}
                    />
                    {formData.emergencyContactPhone?.trim() && !validationErrors.emergencyContactPhone && (
                      <span style={{
                        position: 'absolute',
                        right: '10px',
                        top: '50%',
                        transform: 'translateY(-50%)',
                        color: '#27ae60',
                        fontSize: '16px',
                        fontWeight: 'bold'
                      }}>
                        ✓
                      </span>
                    )}
                  </div>
                  {validationErrors.emergencyContactPhone && (
                    <div className="error-message" style={{ marginTop: '4px', fontSize: '12px' }}>
                      {validationErrors.emergencyContactPhone[0]}
                    </div>
                  )}
                </div>
              </div>

              {/* Phần 4: Tiền sử bệnh lý */}
              <div className="form-section">
                <h2 className="section-title">Phần 4: Tiền sử bệnh lý</h2>
                
                <div className="form-group">
                  <label>Tiền sử bệnh lý</label>
                  <textarea
                    name="medicalHistory"
                    rows={4}
                    value={formData.medicalHistory}
                    onChange={handleChange}
                    placeholder="Vui lòng mô tả tiền sử bệnh lý, bệnh mãn tính..."
                  />
                </div>

                <div className="form-group">
                  <label>Dị ứng</label>
                  <textarea
                    name="allergies"
                    rows={4}
                    value={formData.allergies}
                    onChange={handleChange}
                    placeholder="Vui lòng liệt kê các loại dị ứng"
                  />
                </div>
              </div>
            </div>

            {/* Terms & Conditions */}
            <div className="form-footer">
              <div className="terms-section">
                <label className={`terms-checkbox ${validationErrors.agreeTerms ? 'error' : ''}`}>
                  <input
                    type="checkbox"
                    name="agreeTerms"
                    checked={formData.agreeTerms}
                    onChange={handleChange}
                  />
                  <span className="checkmark"></span>
                  <span>
                    Tôi đồng ý{' '}
                    <Link to="/terms" className="terms-link">
                      Điều khoản dịch vụ
                    </Link>{' '}
                    và{' '}
                    <Link to="/privacy" className="terms-link">
                      Chính sách bảo mật
                    </Link>{' '}
                    của MEDIX. Thông tin y tế của bạn được mã hóa và tuân thủ chuẩn bảo mật y tế.
                  </span>
                </label>
                {validationErrors.agreeTerms && (
                  <div className="error-message" style={{ marginTop: '8px', fontSize: '12px' }}>
                    {validationErrors.agreeTerms[0]}
                  </div>
                )}
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={isLoading}
                className="submit-button"
              >
                {isLoading ? 'ĐANG ĐĂNG KÝ...' : 'ĐĂNG KÝ TÀI KHOẢN'}
              </button>
              
              <div className="login-link">
                Bạn đã có tài khoản?{' '}
                <Link to="/login" className="login-link-text">
                  Đăng nhập ngay
                </Link>
              </div>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
