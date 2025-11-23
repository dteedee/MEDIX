import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { emailVerificationService } from '../../services/mailverified';
import registrationService from '../../services/registrationService';
import { PatientRegistration, BloodType, Gender, RegisterRequestPatient, PatientDTO, ValidationErrors } from '../../types/auth.types';
import { Gender as GenderEnum } from '../../types/common.types';
import { validatePatientRegistrationForm, validatePassword, getPasswordStrength } from '../../utils/validation';
import '../../style/RegistrationPage.css';

export const PatientRegister: React.FC = () => {
  // Helper function to validate email format - kiểm tra đuôi và ký tự có dấu
  const isValidEmail = (email: string): boolean => {
    // Kiểm tra đuôi phải có ít nhất 2 ký tự sau dấu chấm
    const domainRegex = /\.\w{2,}$/;
    if (!domainRegex.test(email)) {
      return false;
    }
    
    // Kiểm tra không có ký tự có dấu trước @
    const beforeAt = email.split('@')[0];
    const hasAccentedChars = /[àáạảãâầấậẩẫăằắặẳẵèéẹẻẽêềếệểễìíịỉĩòóọỏõôồốộổỗơờớợởỡùúụủũưừứựửữỳýỵỷỹđ]/i.test(beforeAt);
    if (hasAccentedChars) {
      return false;
    }
    
    // Kiểm tra format email cơ bản
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
  const [phoneNumberError, setPhoneNumberError] = useState<string | null>(null);
  const [emergencyContactPhoneError, setEmergencyContactPhoneError] = useState<string | null>(null);
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

  // Validation function giống DoctorRegister
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

      case 'email':
        if (!value.trim()) {
          newErrors.Email = ['Vui lòng nhập email'];
        } else if (!isValidEmail(value)) {
          // Kiểm tra các lỗi cụ thể
          const beforeAt = value.split('@')[0];
          const hasAccentedChars = /[àáạảãâầấậẩẫăằắặẳẵèéẹẻẽêềếệểễìíịỉĩòóọỏõôồốộổỗơờớợởỡùúụủũưừứựửữỳýỵỷỹđ]/i.test(beforeAt);
          const domainRegex = /\.\w{2,}$/;
          
          if (hasAccentedChars) {
            newErrors.Email = ['Email không được chứa ký tự có dấu (ả, ạ, á, à...)'];
          } else if (!domainRegex.test(value)) {
            newErrors.Email = ['Đuôi email phải có ít nhất 2 ký tự sau dấu chấm (ví dụ: .com, .vn)'];
          } else {
            newErrors.Email = ['Email không hợp lệ'];
          }
        } else {
          newErrors.Email = [];
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
          const birthYear = new Date(value).getFullYear();
          const currentYear = new Date().getFullYear();
          const age = currentYear - birthYear;

          if (age < 18) {
            newErrors.DateOfBirth = ['Bạn phải đủ 18 tuổi để đăng ký'];
          } else if (age > 150) {
            newErrors.DateOfBirth = ['Ngày sinh không hợp lệ'];
          } else {
            newErrors.DateOfBirth = [];
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

      case 'password':
        if (!value) {
          newErrors.Password = ['Vui lòng nhập mật khẩu'];
        } else if (value.length < 6) {
          newErrors.Password = ['Mật khẩu phải có ít nhất 6 ký tự'];
        } else {
          newErrors.Password = [];
        }
        break;

      case 'passwordConfirmation':
        if (!value) {
          newErrors.PasswordConfirmation = ['Vui lòng xác nhận mật khẩu'];
        } else if (value !== formData.password) {
          newErrors.PasswordConfirmation = ['Mật khẩu xác nhận không khớp'];
        } else {
          newErrors.PasswordConfirmation = [];
        }
        break;
    }

    setValidationErrors((prev: any) => ({ ...prev, ...newErrors }));
  };

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
    if (formData.email && isValidEmail(formData.email)) {
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
    if (!isValidEmail(formData.email)) {
      // Kiểm tra các lỗi cụ thể
      const beforeAt = formData.email.split('@')[0];
      const hasAccentedChars = /[àáạảãâầấậẩẫăằắặẳẵèéẹẻẽêềếệểễìíịỉĩòóọỏõôồốộổỗơờớợởỡùúụủũưừứựửữỳýỵỷỹđ]/i.test(beforeAt);
      const domainRegex = /\.\w{2,}$/;
      
      if (hasAccentedChars) {
        setError('Email không được chứa ký tự có dấu (ả, ạ, á, à...)');
      } else if (!domainRegex.test(formData.email)) {
        setError('Đuôi email phải có ít nhất 2 ký tự sau dấu chấm (ví dụ: .com, .vn)');
      } else {
        setError('Email không hợp lệ');
      }
      return;
    }

    // Check if email already exists first
    setIsCheckingEmail(true);
    setError(''); // Clear error

    try {
      // First check if email exists
      const checkResult = await registrationService.checkEmailExists(formData.email);
      
      if (checkResult.success && checkResult.data?.exists) {
        setEmailExists(true);
        setEmailVerificationSent(false); // Đảm bảo không conflict
        setError('Email này đã được sử dụng. Vui lòng sử dụng email khác.');
        setIsCheckingEmail(false);
        return;
      }

      // If email doesn't exist, send verification code
      const result = await emailVerificationService.sendVerificationCode(formData.email);
      
      if (result.success && result.data) {
        setEmailVerificationSent(true);
        setEmailExists(false); // Đảm bảo không conflict với emailExists
        setResendEndTime(Date.now() + 60000);
        setError(''); // Clear any previous errors
        console.log('Verification code sent successfully');
      } else {
        setError(result.error || 'Không thể gửi mã xác nhận');
        setEmailVerificationSent(false);
      }
    } catch (err) {
      setError('Có lỗi xảy ra khi gửi mã xác nhận');
      setEmailVerificationSent(false);
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
    setError(''); // Clear error trước khi verify

    try {
      // Gọi API verify email code
      const result = await emailVerificationService.verifyEmailCode(formData.email, verificationCode);
      
      console.log('Verification result:', result); // Debug log
      
      if (result.success) {
        setEmailVerified(true);
        setEmailVerificationSent(false); // QUAN TRỌNG: Clear trạng thái "đã gửi"
        setError(''); // Clear error
        setValidationErrors(prev => {
          const { email, ...rest } = prev;
          return rest;
        }); // Clear validation errors
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
    setError(''); // Clear error

    try {
      const result = await emailVerificationService.resendVerificationCode(formData.email);
      
      if (result.success && result.data) {
        setResendEndTime(Date.now() + 60000);
        setError(''); // Clear error
        setEmailVerificationSent(true); // Hiển thị lại thông báo success
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
      setFormData(prev => ({ ...prev, [name]: value }));
      validateField(name, value);
    } else {
      // For identification number, only allow digits
      if (name === 'identificationNumber') {
        const numericValue = value.replace(/\D/g, ''); // Remove non-digits
        setFormData(prev => ({ ...prev, [name]: numericValue }));
        validateField(name, numericValue);
      } 
      // For phone number fields, only allow digits and enforce 0 prefix
      else if (name === 'phoneNumber' || name === 'emergencyContactPhone') {
        const numericValue = value.replace(/\D/g, ''); // Remove non-digits
        
        // Enforce that phone number must start with 0
        if (numericValue && !numericValue.startsWith('0')) {
          // Don't update the field if it doesn't start with 0
          return;
        }
        
        // Don't allow second digit to be 0 (e.g., 0023456789)
        if (numericValue.length >= 2 && numericValue[1] === '0') {
          // Don't update the field if second digit is 0
          return;
        }
        
        // Limit to 10 digits maximum
        const limitedValue = numericValue.slice(0, 10);
        setFormData(prev => ({ ...prev, [name]: limitedValue }));
        validateField(name, limitedValue);
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
          validateField(name, processedValue);
          return; // Early return for date processing
        }
        
        // Use validation function for other fields
        validateField(name, value);
        
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
    
    // Debug log form data - giống DoctorRegister
    console.log('=== PATIENT REGISTRATION FORM SUBMISSION ===');
    console.log('Form data:', formData);
    console.log('Email verified:', emailVerified);
    console.log('Email exists:', emailExists);
    console.log('ID number exists:', idNumberExists);
    
    // Check terms agreement first - giống DoctorRegister
    if (!formData.agreeTerms) {
      console.log('❌ Terms agreement not checked');
      setValidationErrors({ agreeTerms: ['Vui lòng đọc và đồng ý với điều khoản trước khi đăng ký'] });
      return;
    }
    
    // Check all required fields first
    const newErrors: ValidationErrors = {};
    
    // Check required basic fields
    if (!formData.fullName?.trim()) {
      newErrors.fullName = ['Vui lòng nhập họ và tên'];
    }
    
    if (!formData.email?.trim()) {
      newErrors.email = ['Vui lòng nhập email'];
    } else if (emailExists) {
      newErrors.email = ['Email này đã được sử dụng. Vui lòng sử dụng email khác.'];
    } else if (!emailVerified) {
      newErrors.email = ['Vui lòng xác thực email trước khi đăng ký'];
    }
    
    if (!formData.phoneNumber?.trim()) {
      newErrors.phoneNumber = ['Vui lòng nhập số điện thoại'];
    }
    
    if (!formData.password) {
      newErrors.password = ['Vui lòng nhập mật khẩu'];
    }
    
    if (!formData.passwordConfirmation) {
      newErrors.passwordConfirmation = ['Vui lòng xác nhận mật khẩu'];
    }
    
    // Check identification number
    if (!formData.identificationNumber?.trim()) {
      newErrors.identificationNumber = ['Vui lòng nhập số CCCD'];
    } else if (formData.identificationNumber && formData.identificationNumber.length !== 12) {
      newErrors.identificationNumber = ['Số CCCD phải gồm đúng 12 chữ số'];
    } else if (idNumberExists) {
      newErrors.identificationNumber = ['Số CCCD này đã được sử dụng. Vui lòng kiểm tra lại.'];
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
    
    // Check if phone numbers are the same
    if (formData.phoneNumber && formData.emergencyContactPhone && 
        formData.phoneNumber === formData.emergencyContactPhone) {
      newErrors.emergencyContactPhone = ['Số điện thoại liên hệ khẩn cấp không được giống số điện thoại chính'];
    }

    // Validate form data
    const errors = validatePatientRegistrationForm(formData);
    
    // Merge validation errors
    const allErrors = { ...errors, ...newErrors };
    setValidationErrors(allErrors);

    // Check for validation errors
    if (Object.keys(allErrors).length > 0) {
      console.log('❌ Client-side validation errors:', allErrors);
      console.log('Fields with errors:', Object.keys(allErrors));
      return;
    }
    
    console.log('✅ Client-side validation passed');

    try {
      setIsLoading(true);
      
      const registerRequest: RegisterRequestPatient = {
        email: formData.email,
        password: formData.password,
        passwordConfirmation: formData.passwordConfirmation,
        fullName: formData.fullName,
        phoneNumber: formData.phoneNumber || undefined,
        address: formData.address?.trim() || undefined,
        dateOfBirth: formData.dateOfBirth || undefined,
        identificationNumber: formData.identificationNumber || undefined,
        genderCode: formData.genderCode || undefined,
      };

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

      // Debug log to check data being sent - giống DoctorRegister
      console.log('📤 Sending registration data to server:');
      console.log('Register Request:', registerRequest);
      console.log('Patient DTO:', patientDTO);
      console.log('Full Registration Object:', patientRegistration);

      // Sử dụng AuthContext registerPatient
      await registerPatient(patientRegistration);
      
      console.log('✅ Registration successful!');
      console.log('🔄 Redirecting to patient dashboard...');
      
      // Redirect to patient dashboard after successful registration
      navigate('/app/patient/dashboard');
    } catch (err: any) {
      setIsLoading(false);
      
      console.log('❌ Registration failed!');
      console.error('Error details:', err);
      console.log('Error response:', err?.response);
      console.log('Error status:', err?.response?.status);
      console.log('Error data:', err?.response?.data);

      const status = err?.response?.status;

      if (status === 400 || status === 422) {
        // Handle validation errors - giống DoctorRegister
        const errorData = err.response.data;
        console.log('🔍 Server validation errors detected:');
        console.log('Raw error data:', errorData);
        console.log('Error structure:', errorData.errors);
        
        // Convert server errors to our format
        const serverErrors: ValidationErrors = {};
        if (errorData.errors) {
          Object.keys(errorData.errors).forEach(key => {
            serverErrors[key] = Array.isArray(errorData.errors[key]) 
              ? errorData.errors[key] 
              : [errorData.errors[key]];
            console.log(`Server error for ${key}:`, serverErrors[key]);
          });
        }
        
        console.log('📝 Converted server errors:', serverErrors);
        setValidationErrors(serverErrors);
      } else {
        // Fallback for other errors
        console.log('⚠️ Non-validation error occurred');
        console.log('Error message:', err.message);
        setError(err.message || 'Đã xảy ra lỗi. Vui lòng thử lại.');
      }
    } finally {
      setIsLoading(false);
      console.log('🏁 Registration process completed');
    }
  };

  const passwordsMatch = formData.password && formData.passwordConfirmation && 
                         formData.password === formData.passwordConfirmation;

  const passwordStrength = getPasswordStrength(formData.password);

  return (
    <div className="min-h-screen bg-gray-50">
      
      {/* Main Content */}
      <div className="registration-container">
        <form onSubmit={handleSubmit} className="registration-form">
          <div className="form-header" style={{
            border: 'none',
            outline: 'none',
            boxShadow: 'none',
            background: 'none',
            padding: '0',
            margin: '0 0 40px 0',
            borderWidth: '0',
            borderStyle: 'none',
            borderColor: 'transparent',
            borderTop: 'none',
            borderRight: 'none',
            borderBottom: 'none',
            borderLeft: 'none'
          }}>
            <h1 style={{
              border: 'none',
              outline: 'none',
              boxShadow: 'none',
              background: 'none',
              padding: '0',
              margin: '0 0 8px 0',
              borderWidth: '0',
              borderStyle: 'none',
              borderColor: 'transparent',
              borderTop: 'none',
              borderRight: 'none',
              borderBottom: 'none',
              borderLeft: 'none'
            }}>Đăng Ký Tài Khoản Bệnh Nhân</h1>
            <p style={{
              border: 'none',
              outline: 'none',
              boxShadow: 'none',
              background: 'none',
              padding: '0',
              margin: '0',
              borderWidth: '0',
              borderStyle: 'none',
              borderColor: 'transparent',
              borderTop: 'none',
              borderRight: 'none',
              borderBottom: 'none',
              borderLeft: 'none'
            }}>Vui lòng điền đầy đủ thông tin để tạo tài khoản</p>
          </div>

          <div className="form-layout">
            {/* Left Column */}
            <div className="form-column left-column">
              {/* Phần 1: Thông tin cá nhân & đăng nhập */}
              <div className="form-section">
                <h2 className="section-title">Phần 1: Thông tin cá nhân & đăng nhập</h2>
                
                <div className="form-group">
                  <label className="required">Họ và tên</label>
                  <input
                    type="text"
                    name="fullName"
                    value={formData.fullName}
                    onChange={handleChange}
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
                  <label className="required">Email</label>
                  <div className="reg-email-input-group">
                    <input
                      type="email"
                      name="email"
                      value={formData.email}
                      onChange={handleChange}
                      placeholder="Email@example.com"
                      disabled={emailVerified}
                      className={`form-control ${validationErrors.Email?.[0]
                        ? 'is-invalid'
                        : formData.email?.trim()
                            ? 'is-valid'
                            : ''
                        }`}
                    />
                    {/* Hide button when verification code is sent but not yet verified */}
                    {!emailVerificationSent && !emailVerified && (
                      <button
                        type="button"
                        onClick={handleSendVerificationCode}
                        disabled={isCheckingEmail || emailVerified || !formData.email || emailExists}
                        className={`reg-verify-email-btn ${isCheckingEmail ? 'checking' : ''}`}
                      >
                        {isCheckingEmail ? 'Đang kiểm tra...' : 'Gửi mã xác thực'}
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

                  {/* Chỉ hiển thị một thông báo duy nhất theo thứ tự ưu tiên */}
                  {(() => {
                    // Ưu tiên 1: Email đã verified (màu xanh)
                    if (emailVerified && !emailExists) {
                      return (
                        <div className="text-success" style={{ 
                          marginTop: '8px', 
                          fontSize: '13px',
                          padding: '10px 16px',
                          backgroundColor: '#f8fff8',
                          color: '#27ae60',
                          borderRadius: '8px',
                          border: '1px solid #c8e6c9',
                          fontWeight: '500'
                        }}>
                          ✅ Email đã được xác thực
                        </div>
                      );
                    }
                    
                    // Ưu tiên 2: Email đã tồn tại (màu đỏ)
                    if (emailExists) {
                      return (
                        <div className="text-danger">
                          Email này đã được sử dụng. Vui lòng sử dụng email khác.
                        </div>
                      );
                    }
                    
                    // Ưu tiên 3: Validation errors từ submit (màu đỏ) - bao gồm yêu cầu xác thực
                    if (validationErrors.Email && !emailExists && !emailVerified) {
                      return (
                        <div className="text-danger">
                          {validationErrors.Email[0]}
                        </div>
                      );
                    }
                    
                    // Ưu tiên 4: Đã gửi mã xác thực và chưa verified - CHỈ hiển thị khi có hành động gửi mail
                    if (emailVerificationSent && !emailVerified && !emailExists && !validationErrors.Email) {
                      return (
                        <div className="text-success" style={{ 
                          marginTop: '8px', 
                          fontSize: '13px',
                          padding: '10px 16px',
                          backgroundColor: '#f8fff8',
                          color: '#27ae60',
                          borderRadius: '8px',
                          border: '1px solid #c8e6c9',
                          fontWeight: '500'
                        }}>
                          📧 Mã xác thực đã được gửi đến email của bạn!
                        </div>
                      );
                    }
                    
                    // Không hiển thị gì
                    return null;
                  })()}
                </div>

                {/* Verification Code Section - Chỉ hiển thị khi cần thiết */}
                {emailVerificationSent && !emailVerified && !emailExists && (
                  <div className="reg-verification-code-section">
                    <div className="reg-verification-info">
                      <p className="info-text">
                        📧 Mã xác nhận đã được gửi đến email <strong>{formData.email}</strong>
                      </p>
                    </div>
                    
                    <div className="reg-verification-input-group">
                      <input
                        type="text"
                        className="reg-verification-code-input"
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
                        className="reg-verify-code-btn"
                      >
                        {isVerifyingCode ? 'Đang kiểm tra...' : 'Xác nhận'}
                      </button>
                    </div>

                    {/* Hiển thị lỗi xác thực mã - CHỈ khi đang trong flow verify */}
                    {error && emailVerificationSent && !emailVerified && (
                      <div className="error-message">
                        {error}
                      </div>
                    )}

                    <div className="reg-resend-section">
                      <span className="reg-resend-text">
                        Không nhận được mã? 
                      </span>
                      <button
                        type="button"
                        onClick={handleResendCode}
                        disabled={resendCountdown > 0}
                        className="reg-resend-btn"
                      >
                        {resendCountdown > 0 ? `Gửi lại sau ${resendCountdown}s` : 'Gửi lại'}
                      </button>
                    </div>
                  </div>
                )}

                <div className="form-group">
                  <label className="required">Số điện thoại</label>
                  <input
                    type="tel"
                    name="phoneNumber"
                    maxLength={10}
                    value={formData.phoneNumber}
                    onChange={handleChange}
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

                <div className="form-group">
                  <label className="required">Mật khẩu</label>
                  <div style={{ position: 'relative' }}>
                    <input
                      type={showPassword ? "text" : "password"}
                      name="password"
                      value={formData.password}
                      onChange={handleChange}
                      placeholder="••••••••"
                      className={`form-control ${validationErrors.Password?.[0]
                        ? 'is-invalid'
                        : formData.password?.trim()
                            ? 'is-valid'
                            : ''
                        }`}
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
                  {validationErrors.Password?.[0] && <div className="text-danger">{validationErrors.Password[0]}</div>}
                  
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
                      className={`form-control ${validationErrors.PasswordConfirmation?.[0]
                        ? 'is-invalid'
                        : formData.passwordConfirmation?.trim()
                            ? 'is-valid'
                            : ''
                        }`}
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
                        <span className="text-danger">✗ Mật khẩu không khớp</span>
                      )}
                    </div>
                  )}
                  {validationErrors.PasswordConfirmation?.[0] && <div className="text-danger">{validationErrors.PasswordConfirmation[0]}</div>}
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
                  <input
                    type="date"
                    name="dateOfBirth"
                    value={formData.dateOfBirth}
                    onChange={handleChange}
                    placeholder="dd/mm/yyyy"
                    title="Bạn có thể nhập trực tiếp hoặc chọn từ lịch"
                    max="9999-12-31"
                    className={`form-control ${validationErrors.DateOfBirth?.[0]
                      ? 'is-invalid'
                      : formData.dateOfBirth?.trim()
                          ? 'is-valid'
                          : ''
                      }`}
                    onFocus={(e) => {
                      // Hiển thị calendar khi focus
                      e.target.showPicker && e.target.showPicker();
                    }}
                  />
                  {!validationErrors.DateOfBirth && (
                    <div style={{ marginTop: '4px', fontSize: '11px', color: '#6b7280' }}>
                      💡 Bạn có thể nhập: dd/mm/yyyy, dd-mm-yyyy, ddmmyyyy hoặc chọn từ lịch
                    </div>
                  )}
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
                    className={`form-control ${validationErrors.BloodTypeCode?.[0]
                      ? 'is-invalid'
                      : formData.bloodTypeCode?.trim()
                          ? 'is-valid'
                          : ''
                      }`}
                  >
                    <option value="">Chọn nhóm máu</option>
                    {bloodTypes.map((bloodType) => (
                      <option key={bloodType.code} value={bloodType.code}>
                        {bloodType.displayName}
                      </option>
                    ))}
                  </select>
                  {validationErrors.BloodTypeCode?.[0] && <div className="text-danger">{validationErrors.BloodTypeCode[0]}</div>}
                </div>
              </div>
              {/* Phần 3: Người liên hệ khẩn cấp */}
              <div className="form-section">
                <h2 className="section-title">Phần 3: Người liên hệ khẩn cấp</h2>
                
                <div className="form-group">
                  <label className="required">Họ tên người liên hệ</label>
                  <input
                    type="text"
                    name="emergencyContactName"
                    value={formData.emergencyContactName}
                    onChange={handleChange}
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
          </div>

          {/* Terms & Conditions - Outside 2-column layout, like DoctorRegister */}
          <div className="terms-section">
            <div className="checkbox-wrapper">
              <input 
                type="checkbox" 
                id="terms" 
                name="agreeTerms"
                checked={formData.agreeTerms}
                onChange={handleChange}
              />
              <label htmlFor="terms" className="terms-text">
                Tôi đồng ý <Link to="/terms" target="_blank" className="terms-link">Điều khoản dịch vụ</Link> và <Link to="/privacy" target="_blank" className="terms-link">Chính sách bảo mật</Link> của MEDIX. Thông tin y tế của bạn được mã hóa
                và tuân thủ chuẩn bảo mật y tế.
              </label>
            </div>
            {validationErrors.agreeTerms && (
              <div className="text-danger">
                {validationErrors.agreeTerms[0]}
              </div>
            )}
          </div>

          {/* Submit Button - Outside 2-column layout, like DoctorRegister */}
          <div className="submit-section">
            {error && <div className="text-danger">{error}</div>}
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
                'ĐĂNG KÝ TÀI KHOẢN'
              )}
            </button>
            
            <div className="login-link-section">
              Bạn đã có tài khoản? <a href="/login" className="login-link">Đăng nhập ngay</a>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};

