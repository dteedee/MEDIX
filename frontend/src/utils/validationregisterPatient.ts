// src/utils/validationregisterPatient.ts
import { FormData, PasswordStrength } from '../types/registrationTypes';

// ====================== VALIDATION FUNCTIONS ======================

export const validateEmail = (email: string): string => {
  if (!email) return '';
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email) ? '' : 'Email không hợp lệ';
};

export const validatePhone = (phone: string): string => {
  if (!phone) return '';
  const phoneRegex = /^[0-9]{10,11}$/;
  return phoneRegex.test(phone.replace(/\s/g, '')) ? '' : 'Số điện thoại phải có 10-11 chữ số';
};

export const validateIdNumber = (idNumber: string): string => {
  if (!idNumber) return '';
  const idRegex = /^[0-9]{9,12}$/;
  return idRegex.test(idNumber) ? '' : 'Số CCCD/CMND phải có 9-12 chữ số';
};

export const checkPasswordStrength = (password: string): PasswordStrength => {
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

  return {
    hasLowercase,
    hasUppercase,
    hasNumbers,
    hasSpecialChars,
    isLongEnough,
    score
  };
};

export const validateForm = (formData: FormData, passwordStrength: PasswordStrength): Record<string, string> => {
  const newErrors: Record<string, string> = {};

  // Required field validation with trim() to catch spaces-only input
  if (!formData.fullname || !formData.fullname.trim()) {
    newErrors.fullname = 'Họ và tên là bắt buộc';
  } else if (formData.fullname.trim().length < 2) {
    newErrors.fullname = 'Họ và tên phải có ít nhất 2 ký tự';
  }
  
  if (!formData.identificationNumber || !formData.identificationNumber.trim()) {
    newErrors.identificationNumber = 'Số CCCD/CMND là bắt buộc';
  } else {
    const idError = validateIdNumber(formData.identificationNumber);
    if (idError) newErrors.identificationNumber = idError;
  }
  
  if (!formData.address || !formData.address.trim()) {
    newErrors.address = 'Địa chỉ liên lạc là bắt buộc';
  }
  
  if (!formData.email || !formData.email.trim()) {
    newErrors.email = 'Email là bắt buộc';
  } else {
    const emailError = validateEmail(formData.email);
    if (emailError) newErrors.email = emailError;
  }
  
  if (!formData.phoneNumber || !formData.phoneNumber.trim()) {
    newErrors.phoneNumber = 'Số điện thoại là bắt buộc';
  } else {
    const phoneError = validatePhone(formData.phoneNumber);
    if (phoneError) newErrors.phoneNumber = phoneError;
  }
  
  if (!formData.password) {
    newErrors.password = 'Mật khẩu là bắt buộc';
  } else if (formData.password.length < 8) {
    newErrors.password = 'Mật khẩu phải có ít nhất 8 ký tự';
  } else if (passwordStrength.score < 3) {
    newErrors.password = 'Mật khẩu không đủ mạnh';
  }
  
  if (!formData.confirmPassword) {
    newErrors.confirmPassword = 'Vui lòng xác nhận mật khẩu';
  } else if (formData.password !== formData.confirmPassword) {
    newErrors.confirmPassword = 'Mật khẩu xác nhận không khớp';
  }
  
  if (!formData.dateOfBirth) {
    newErrors.dateOfBirth = 'Ngày sinh là bắt buộc';
  } else {
    // Kiểm tra ngày sinh hợp lệ (không phải tương lai, không quá cũ)
    const birthDate = new Date(formData.dateOfBirth);
    const today = new Date();
    const minDate = new Date(today.getFullYear() - 120, today.getMonth(), today.getDate());
    
    if (birthDate > today) {
      newErrors.dateOfBirth = 'Ngày sinh không thể là ngày trong tương lai';
    } else if (birthDate < minDate) {
      newErrors.dateOfBirth = 'Ngày sinh không hợp lệ';
    }
  }
  
  if (!formData.gender || formData.gender.trim() === '') {
    newErrors.gender = 'Vui lòng chọn giới tính';
  }
  
  if (!formData.bloodType || !formData.bloodType.trim()) {
    newErrors.bloodType = 'Vui lòng chọn nhóm máu';
  }
  
  // Emergency contact validation - all or nothing approach
  const hasAnyEmergencyInfo = formData.emergencyContactName.trim() || 
                             formData.emergencyRelationship.trim() || 
                             formData.emergencyPhoneNumber.trim();
  
  if (hasAnyEmergencyInfo) {
    if (!formData.emergencyContactName.trim()) {
      newErrors.emergencyContactName = 'Tên người liên hệ khẩn cấp là bắt buộc khi có thông tin liên hệ khẩn cấp';
    }
    if (!formData.emergencyRelationship.trim()) {
      newErrors.emergencyRelationship = 'Mối quan hệ là bắt buộc khi có thông tin liên hệ khẩn cấp';
    }
    if (!formData.emergencyPhoneNumber.trim()) {
      newErrors.emergencyPhoneNumber = 'Số điện thoại khẩn cấp là bắt buộc khi có thông tin liên hệ khẩn cấp';
    } else {
      const emergencyPhoneError = validatePhone(formData.emergencyPhoneNumber);
      if (emergencyPhoneError) newErrors.emergencyPhoneNumber = emergencyPhoneError;
    }
  }

  return newErrors;
};

// ====================== INPUT HANDLING FUNCTIONS ======================

export const handleInputChange = (
  field: string, 
  value: string, 
  formData: FormData,
  passwordStrength: PasswordStrength,
  setFormData: React.Dispatch<React.SetStateAction<FormData>>,
  setErrors: React.Dispatch<React.SetStateAction<Record<string, string>>>,
  setPasswordStrength: React.Dispatch<React.SetStateAction<PasswordStrength>>
) => {
  // No need for gender conversion anymore, it's already string
  setFormData(prev => ({
    ...prev,
    [field]: value
  }));
  
  // Real-time validation
  let error = '';
  
  switch (field) {
    case 'fullname':
      // Nếu user đang nhập (value có content) thì tạm thời ẩn lỗi "bắt buộc"
      if (!value.trim() && !value) {
        error = 'Họ và tên là bắt buộc';
      } else if (value.trim() && value.trim().length < 2) {
        error = 'Họ và tên phải có ít nhất 2 ký tự';
      }
      // Nếu đang nhập thì không hiện lỗi "bắt buộc"
      if (value && !value.trim()) {
        error = ''; // Tạm thời ẩn lỗi khi đang nhập
      }
      break;
    case 'email':
      // Nếu user đang nhập thì tạm thời ẩn lỗi "bắt buộc"
      if (!value.trim() && !value) {
        error = 'Email là bắt buộc';
      } else if (value.trim()) {
        error = validateEmail(value);
      }
      // Nếu đang nhập thì không hiện lỗi "bắt buộc"
      if (value && !value.trim()) {
        error = ''; // Tạm thời ẩn lỗi khi đang nhập
      }
      break;
    case 'phoneNumber':
      // Nếu user đang nhập thì tạm thời ẩn lỗi "bắt buộc"
      if (!value.trim() && !value) {
        error = 'Số điện thoại là bắt buộc';
      } else if (value.trim()) {
        error = validatePhone(value);
      }
      // Nếu đang nhập thì không hiện lỗi "bắt buộc"
      if (value && !value.trim()) {
        error = ''; // Tạm thời ẩn lỗi khi đang nhập
      }
      break;
    case 'identificationNumber':
      // Nếu user đang nhập thì tạm thời ẩn lỗi "bắt buộc"
      if (!value.trim() && !value) {
        error = 'Số CCCD/CMND là bắt buộc';
      } else if (value.trim()) {
        error = validateIdNumber(value);
      }
      // Nếu đang nhập thì không hiện lỗi "bắt buộc"
      if (value && !value.trim()) {
        error = ''; // Tạm thời ẩn lỗi khi đang nhập
      }
      break;
    case 'address':
      // Nếu user đang nhập thì tạm thời ẩn lỗi "bắt buộc"
      if (!value.trim() && !value) {
        error = 'Địa chỉ liên lạc là bắt buộc';
      }
      // Nếu đang nhập thì không hiện lỗi "bắt buộc"
      if (value && !value.trim()) {
        error = ''; // Tạm thời ẩn lỗi khi đang nhập
      }
      break;
    case 'dateOfBirth':
      if (!value) {
        error = 'Ngày sinh là bắt buộc';
      } else {
        // Kiểm tra ngày sinh hợp lệ (không phải tương lai, không quá cũ)
        const birthDate = new Date(value);
        const today = new Date();
        const minDate = new Date(today.getFullYear() - 120, today.getMonth(), today.getDate());
        
        if (birthDate > today) {
          error = 'Ngày sinh không thể là ngày trong tương lai';
        } else if (birthDate < minDate) {
          error = 'Ngày sinh không hợp lệ';
        }
      }
      break;
    case 'bloodType':
      if (!value) {
        error = 'Vui lòng chọn nhóm máu';
      }
      break;
    case 'gender':
      if (!value || value.trim() === '') {
        error = 'Vui lòng chọn giới tính';
      }
      break;
    case 'password':
      const newPasswordStrength = checkPasswordStrength(value);
      setPasswordStrength(newPasswordStrength);
      if (!value) {
        error = 'Mật khẩu là bắt buộc';
      } else if (value.length < 8) {
        error = 'Mật khẩu phải có ít nhất 8 ký tự';
      } else if (newPasswordStrength.score < 3) {
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
      if (!value) {
        error = 'Vui lòng xác nhận mật khẩu';
      } else if (value !== formData.password) {
        error = 'Mật khẩu xác nhận không khớp';
      }
      break;
    case 'emergencyContactName':
      // Optional field, only validate if any emergency contact info is filled
      if (formData.emergencyRelationship.trim() || formData.emergencyPhoneNumber.trim() || value.trim()) {
        if (!value.trim() && !value) {
          error = 'Tên người liên hệ khẩn cấp là bắt buộc';
        }
        // Nếu đang nhập thì không hiện lỗi "bắt buộc"
        if (value && !value.trim()) {
          error = ''; // Tạm thời ẩn lỗi khi đang nhập
        }
      }
      break;
    case 'emergencyRelationship':
      // Optional field, only validate if any emergency contact info is filled
      if (formData.emergencyContactName.trim() || formData.emergencyPhoneNumber.trim() || value.trim()) {
        if (!value.trim() && !value) {
          error = 'Mối quan hệ là bắt buộc';
        }
        // Nếu đang nhập thì không hiện lỗi "bắt buộc"
        if (value && !value.trim()) {
          error = ''; // Tạm thời ẩn lỗi khi đang nhập
        }
      }
      break;
    case 'emergencyPhoneNumber':
      // Optional field, only validate if any emergency contact info is filled
      if (formData.emergencyContactName.trim() || formData.emergencyRelationship.trim() || value.trim()) {
        if (!value.trim() && !value) {
          error = 'Số điện thoại khẩn cấp là bắt buộc';
        } else if (value.trim()) {
          error = validatePhone(value);
        }
        // Nếu đang nhập thì không hiện lỗi "bắt buộc"
        if (value && !value.trim()) {
          error = ''; // Tạm thời ẩn lỗi khi đang nhập
        }
      }
      break;
  }
  
  // Update errors
  setErrors(prev => ({
    ...prev,
    [field]: error
  }));
};

export const handleGenderChange = (
  genderString: string,
  handleInputChange: (field: string, value: string) => void
) => {
  console.log('🔄 handleGenderChange called with:', genderString);
  if (genderString === 'male') {
    console.log('👨 Setting gender to male (true)');
    return handleInputChange('gender', 'true');
  }
  if (genderString === 'female') {
    console.log('👩 Setting gender to female (false)');
    return handleInputChange('gender', 'false');
  }
  if (genderString === 'other') {
    console.log('🧑 Setting gender to other (null)');
    return handleInputChange('gender', 'null');
  }
  console.log('❌ Unknown gender string, setting to empty');
  return handleInputChange('gender', '');
};