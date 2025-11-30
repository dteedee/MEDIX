
import { VALIDATION_RULES, Gender } from '../types/common.types';
import { PasswordRequirements, ValidationErrors } from '../types/auth.types';


export const validatePassword = (password: string): PasswordRequirements => {
  return {
    minLength: password.length >= VALIDATION_RULES.PASSWORD.MIN_LENGTH,
    hasUppercase: /[A-Z]/.test(password),
    hasLowercase: /[a-z]/.test(password),
    hasNumber: /\d/.test(password),
    hasSpecialChar: /[\W_]/.test(password),
  };
};

export const isPasswordValid = (password: string): boolean => {
  const requirements = validatePassword(password);
  return Object.values(requirements).every(Boolean);
};


export const validateEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};


export const validatePhoneNumber = (phone: string): boolean => {
  if (!phone) return true; 
  const phoneRegex = /^(\+84|0)[1-9][0-9]{8}$/;
  return phoneRegex.test(phone.replace(/[\s\-\(\)]/g, ''));
};


export const validateFullName = (fullName: string): boolean => {
  return (
    fullName.length >= VALIDATION_RULES.FULL_NAME.MIN_LENGTH &&
    fullName.length <= VALIDATION_RULES.FULL_NAME.MAX_LENGTH
  );
};


export const validateIdentificationNumber = (idNumber: string): boolean => {
  if (!idNumber) return true; 
  return (
    idNumber.length <= VALIDATION_RULES.IDENTIFICATION_NUMBER.MAX_LENGTH &&
    /^\d+$/.test(idNumber)
  );
};


export const validateGenderCode = (genderCode: string): boolean => {
  if (!genderCode) return true; 
  return VALIDATION_RULES.GENDER_CODES.includes(genderCode as Gender);
};


export const validateDateOfBirth = (dateOfBirth: string): boolean => {
  if (!dateOfBirth) return true; 

  const date = new Date(dateOfBirth);
  const now = new Date();

  let age = now.getFullYear() - date.getFullYear();
  const monthDiff = now.getMonth() - date.getMonth();

  if (monthDiff < 0 || (monthDiff === 0 && now.getDate() < date.getDate())) {
    age--;
  }

  return !isNaN(date.getTime()) && age >= 18 && age <= 150;
};


export const validatePatientRegistrationForm = (formData: any): ValidationErrors => {
  const errors: ValidationErrors = {};

  if (!formData.fullName) {
    errors.fullName = ['Họ và tên là bắt buộc'];
  } else if (!validateFullName(formData.fullName)) {
    errors.fullName = [
      `Họ và tên phải từ ${VALIDATION_RULES.FULL_NAME.MIN_LENGTH} đến ${VALIDATION_RULES.FULL_NAME.MAX_LENGTH} ký tự`,
    ];
  }

  if (!formData.email) {
    errors.email = ['Email là bắt buộc'];
  } else if (!validateEmail(formData.email)) {
    errors.email = ['Email không hợp lệ'];
  }

  if (!formData.password) {
    errors.password = ['Mật khẩu là bắt buộc'];
  } else if (!isPasswordValid(formData.password)) {
    errors.password = [
      'Mật khẩu phải có ít nhất 1 chữ hoa, 1 chữ thường, 1 số và 1 ký tự đặc biệt',
    ];
  }

  if (!formData.passwordConfirmation) {
    errors.passwordConfirmation = ['Xác nhận mật khẩu là bắt buộc'];
  } else if (formData.password !== formData.passwordConfirmation) {
    errors.passwordConfirmation = ['Mật khẩu và xác nhận không khớp'];
  }

  if (formData.phoneNumber && !validatePhoneNumber(formData.phoneNumber)) {
    errors.phoneNumber = ['Số điện thoại không hợp lệ'];
  }

  if (formData.identificationNumber && !validateIdentificationNumber(formData.identificationNumber)) {
    errors.identificationNumber = ['Số CMND/CCCD không hợp lệ'];
  }

  if (formData.dateOfBirth && !validateDateOfBirth(formData.dateOfBirth)) {
    errors.dateOfBirth = ['Bạn phải đủ 18 tuổi để đăng ký'];
  }

  if (formData.genderCode && !validateGenderCode(formData.genderCode)) {
    errors.genderCode = ['Giới tính không hợp lệ'];
  }

  return errors;
};


export const getFieldError = (
  fieldName: string,
  value: any,
  allErrors: ValidationErrors
): string[] => {
  return allErrors[fieldName] || [];
};

export const hasFieldError = (fieldName: string, allErrors: ValidationErrors): boolean => {
  return !!allErrors[fieldName]?.length;
};


export const formatErrorMessage = (errors: string[]): string => {
  return errors.join(', ');
};


export const getPasswordStrength = (
  password: string
): { score: number; label: string; color: string } => {
  const requirements = validatePassword(password);
  const score = Object.values(requirements).filter(Boolean).length;

  if (score <= 2) return { score, label: 'Yếu', color: 'text-red-600' };
  if (score <= 3) return { score, label: 'Trung bình', color: 'text-yellow-600' };
  if (score <= 4) return { score, label: 'Khá', color: 'text-blue-600' };
  return { score, label: 'Mạnh', color: 'text-green-600' };
};
