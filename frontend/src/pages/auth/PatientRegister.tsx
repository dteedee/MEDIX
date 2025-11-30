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
  const isValidEmail = (email: string): boolean => {
    const domainRegex = /\.\w{2,}$/;
    if (!domainRegex.test(email)) {
      return false;
    }
    
    const beforeAt = email.split('@')[0];
    const hasAccentedChars = /[àáạảãâầấậẩẫăằắặẳẵèéẹẻẽêềếệểễìíịỉĩòóọỏõôồốộổỗơờớợởỡùúụủũưừứựửữỳýỵỷỹđ]/i.test(beforeAt);
    if (hasAccentedChars) {
      return false;
    }
    
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

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

  const [formData, setFormData] = useState({
    fullName: '',
    identificationNumber: '',
    address: '',
    email: '',
    phoneNumber: '',
    password: '',
    passwordConfirmation: '',
    
    dateOfBirth: '',
    genderCode: '',
    bloodTypeCode: '',
    
    emergencyContactName: '',
    emergencyContactPhone: '',
    
    medicalHistory: '',
    allergies: '',
    
    agreeTerms: false,
  });

  const [dateOfBirthDisplay, setDateOfBirthDisplay] = useState('');

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

  const [emailVerificationSent, setEmailVerificationSent] = useState(false);
  const [emailVerified, setEmailVerified] = useState(false);
  const [verificationCode, setVerificationCode] = useState('');
  const [serverVerificationCode, setServerVerificationCode] = useState('');
  const [isCheckingEmail, setIsCheckingEmail] = useState(false);
  const [isVerifyingCode, setIsVerifyingCode] = useState(false);
  const [resendCountdown, setResendCountdown] = useState(0);
  const [resendEndTime, setResendEndTime] = useState<number | null>(null);

  const [emailExists, setEmailExists] = useState(false);
  const [idNumberExists, setIdNumberExists] = useState(false);
  const [isCheckingIdNumber, setIsCheckingIdNumber] = useState(false);
  const [autoSendTriggered, setAutoSendTriggered] = useState(false);

  const [showPassword, setShowPassword] = useState(false);
  const [showPasswordConfirmation, setShowPasswordConfirmation] = useState(false);

  const { registerPatient } = useAuth();
  const navigate = useNavigate();

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
                newErrors.DateOfBirth = ['Bạn phải đủ 18 tuổi để đăng ký'];
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
        
        const genderOptionsFromEnum = [
          { code: GenderEnum.MALE, displayName: 'Nam' },
          { code: GenderEnum.FEMALE, displayName: 'Nữ' },
          { code: GenderEnum.OTHER, displayName: 'Khác' }
        ];

        setGenderOptions(genderOptionsFromEnum);
      } catch (err) {}
    };

    loadOptions();
  }, []);

  useEffect(() => {
    const requirements = validatePassword(formData.password);
    setPasswordRequirements(requirements);
  }, [formData.password]);
  useEffect(() => {
    if (formData.dateOfBirth && /^\d{4}-\d{2}-\d{2}$/.test(formData.dateOfBirth) && !dateOfBirthDisplay) {
      setDateOfBirthDisplay(formatDateForDisplay(formData.dateOfBirth));
    } else if (!formData.dateOfBirth && dateOfBirthDisplay) {
      setDateOfBirthDisplay('');
    }
  }, [formData.dateOfBirth]);
  useEffect(() => {
  }, [formData.genderCode]);
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

      updateCountdown();
      
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

  useEffect(() => {
    if (formData.email && isValidEmail(formData.email)) {
      const timeoutId = setTimeout(async () => {
        setIsCheckingEmail(true);
        try {
          const response = await registrationService.checkEmailExists(formData.email);
          if (response.success && response.data) {
            setEmailExists(response.data.exists);
            if (response.data.exists) {
              setEmailVerificationSent(false);
              setEmailVerified(false);
              setVerificationCode('');
              setServerVerificationCode('');
              setValidationErrors(prev => ({
                ...prev,
                email: ['Email này đã được sử dụng']
              }));
            } else {
              setValidationErrors(prev => {
                const { email, ...rest } = prev;
                return rest;
              });
            }
          }
        } catch (error) {} finally {
          setIsCheckingEmail(false);
        }
      }, 800);

      return () => clearTimeout(timeoutId);
    } else {
      setEmailExists(false);
    }
  }, [formData.email]);

  useEffect(() => {
    if (emailVerified) {
      setValidationErrors(prev => {
        const { email, ...rest } = prev;
        return rest;
      });
    }
  }, [emailVerified]);

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
              setValidationErrors(prev => {
                const { identificationNumber, ...rest } = prev;
                return rest;
              });
            }
          }
        } catch (error) {} finally {
          setIsCheckingIdNumber(false);
        }
      }, 800);

      return () => clearTimeout(timeoutId);
    } else {
      setIdNumberExists(false);
    }
  }, [formData.identificationNumber]);
  useEffect(() => {
    if (formData.email && 
        isValidEmail(formData.email) && 
        !emailVerificationSent && 
        !autoSendTriggered &&
        !emailExists) {
      
      const timeoutId = setTimeout(async () => {
        setAutoSendTriggered(true);
        await handleSendVerificationCode();
      }, 1000);

      return () => clearTimeout(timeoutId);
    }
  }, [formData.email, emailVerificationSent, autoSendTriggered, emailExists]);

  const handleSendVerificationCode = async () => {
    if (!formData.email) {
      setError('Vui lòng nhập email');
      return;
    }
    if (!isValidEmail(formData.email)) {
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

    setIsCheckingEmail(true);
    setError('');

    try {
      const checkResult = await registrationService.checkEmailExists(formData.email);
      
      if (checkResult.success && checkResult.data?.exists) {
        setEmailExists(true);
        setEmailVerificationSent(false);
        setError('Email này đã được sử dụng. Vui lòng sử dụng email khác.');
        setIsCheckingEmail(false);
        return;
      }

      const result = await emailVerificationService.sendVerificationCode(formData.email);
      
      if (result.success && result.data) {
        setEmailVerificationSent(true);
        setEmailExists(false);
        setResendEndTime(Date.now() + 60000);
        setError('');
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
      
      
      if (result.success) {
        setEmailVerified(true);
        setEmailVerificationSent(false); 
        setError(''); 
        setValidationErrors(prev => {
          const { email, ...rest } = prev;
          return rest;
        }); 
      } else {
        setError(result.error || 'Mã xác nhận không đúng. Vui lòng kiểm tra lại.');
      }
    } catch (error) {
      setError('Có lỗi xảy ra khi xác thực mã. Vui lòng thử lại.');
    } finally {
      setIsVerifyingCode(false);
    }
  };

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
    
    if (type === 'checkbox') {
      const checked = (e.target as HTMLInputElement).checked;
      setFormData(prev => ({ ...prev, [name]: checked }));
      
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
      } else {
        setFormData(prev => ({ ...prev, [name]: value }));
        
        if (name === 'dateOfBirth') {
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
        }
        
        validateField(name, value);
        
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
    
    
    
    if (!formData.agreeTerms) {
      setValidationErrors({ agreeTerms: ['Vui lòng đọc và đồng ý với điều khoản trước khi đăng ký'] });
      return;
    }
    
    const newErrors: ValidationErrors = {};
    
    if (!formData.fullName?.trim()) {
      newErrors.FullName = ['Vui lòng nhập họ và tên'];
    }
    
    if (!formData.email?.trim()) {
      newErrors.Email = ['Vui lòng nhập email'];
    } else if (emailExists) {
      newErrors.Email = ['Email này đã được sử dụng. Vui lòng sử dụng email khác.'];
    } else if (!emailVerified) {
      newErrors.Email = ['Vui lòng xác thực email trước khi đăng ký'];
    }
    
    if (!formData.phoneNumber?.trim()) {
      newErrors.PhoneNumber = ['Vui lòng nhập số điện thoại'];
    }
    
    if (!formData.password) {
      newErrors.Password = ['Vui lòng nhập mật khẩu'];
    }
    
    if (!formData.passwordConfirmation) {
      newErrors.PasswordConfirmation = ['Vui lòng xác nhận mật khẩu'];
    }
    
    if (!formData.identificationNumber?.trim()) {
      newErrors.IdentificationNumber = ['Vui lòng nhập số CCCD'];
    } else if (formData.identificationNumber && formData.identificationNumber.length !== 12) {
      newErrors.IdentificationNumber = ['Số CCCD phải gồm đúng 12 chữ số'];
    } else if (idNumberExists) {
      newErrors.IdentificationNumber = ['Số CCCD này đã được sử dụng. Vui lòng kiểm tra lại.'];
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
      newErrors.EmergencyContactPhone = ['Só điện thoại liên hệ khẩn cấp không được giống số điện thoại chính'];
    }

    const errors = validatePatientRegistrationForm(formData);
    
    const allErrors = { ...errors, ...newErrors };
    setValidationErrors(allErrors);

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

     

      await registerPatient(patientRegistration);
      
      
      
      navigate('/app/patient/dashboard');
    } catch (err: any) {
      setIsLoading(false);
      
     

      const status = err?.response?.status;

      if (status === 400 || status === 422) {
        const errorData = err.response.data;
       
        
        const serverErrors: ValidationErrors = {};
        if (errorData.errors) {
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

  const passwordsMatch = formData.password && formData.passwordConfirmation && 
                         formData.password === formData.passwordConfirmation;

  const passwordStrength = getPasswordStrength(formData.password);

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
            <div className="form-column left-column">
              <div className="form-section">
                <h2 className="section-title">Phần 1: Thông tin cá nhân & đăng nhập</h2>
                
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
                  <label className="required">Email</label>
                  <div className="reg-email-input-group">
                    <input
                      type="email"
                      name="email"
                      value={formData.email}
                      onChange={handleChange}
                      onBlur={handleBlur}
                      placeholder="Email@example.com"
                      disabled={emailVerified}
                      className={`form-control ${validationErrors.Email?.[0]
                        ? 'is-invalid'
                        : formData.email?.trim()
                            ? 'is-valid'
                            : ''
                        }`}
                    />
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

                  {(() => {
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
                           Email đã được xác thực
                        </div>
                      );
                    }
                    
                    if (emailExists) {
                      return (
                        <div className="text-danger">
                          Email này đã được sử dụng. Vui lòng sử dụng email khác.
                        </div>
                      );
                    }
                    
                    if (validationErrors.Email && !emailExists && !emailVerified) {
                      return (
                        <div className="text-danger">
                          {validationErrors.Email[0]}
                        </div>
                      );
                    }
                    
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
                           Mã xác thực đã được gửi đến email của bạn!
                        </div>
                      );
                    }
                    
                    return null;
                  })()}
                </div>

                {emailVerificationSent && !emailVerified && !emailExists && (
                  <div className="reg-verification-code-section">
                    <div className="reg-verification-info">
                      <p className="info-text">
                         Mã xác nhận đã được gửi đến email <strong>{formData.email}</strong>
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

                <div className="form-group">
                  <label className="required">Mật khẩu</label>
                  <div style={{ position: 'relative' }}>
                    <input
                      type={showPassword ? "text" : "password"}
                      name="password"
                      value={formData.password}
                      onChange={handleChange}
                      onBlur={handleBlur}
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
                      onBlur={handleBlur}
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
                        <span className="text-danger">✗ Vui lòng kiểm tra lại mật khẩu</span>
                      )}
                    </div>
                  )}
                  {validationErrors.PasswordConfirmation?.[0] && <div className="text-danger">{validationErrors.PasswordConfirmation[0]}</div>}
                </div>
              </div>
            </div>

            <div className="form-column right-column">
              <div className="form-section">
                <h2 className="section-title">Phần 2: Thông tin Y tế & EMR</h2>
                
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
                <h2 className="section-title">Phần 3: Người liên hệ khẩn cấp</h2>
                
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
