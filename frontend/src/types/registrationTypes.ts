// src/types/registrationTypes.ts

export interface FormData {
  // Personal Info - matching RegisterDTO
  email: string;
  password: string;
  confirmPassword: string; // for UI validation only
  fullname: string;
  phoneNumber: string;
  gender: 'male' | 'female' | 'other' | ''; // Changed from boolean | null to string
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
export interface BloodTypeDTO {
  code: string;
  displayName: string;
}
export interface PasswordStrength {
  hasLowercase: boolean;
  hasUppercase: boolean;
  hasNumbers: boolean;
  hasSpecialChars: boolean;
  isLongEnough: boolean;
  score: number;
}

export const initialFormData: FormData = {
  email: '',
  password: '',
  confirmPassword: '',
  fullname: '',
  phoneNumber: '',
  gender: '', // Changed from null to empty string
  identificationNumber: '',
  address: '',
  dateOfBirth: '',
  bloodType: '',
  emergencyContactName: '',
  emergencyRelationship: '',
  emergencyPhoneNumber: '',
  chronicDiseases: '',
  allergies: ''
};


export interface RegisterDTO {
  Email: string;
  Password: string;
  FullName: string;
  PhoneNumber?: string;
  DateOfBirth?: string; // DateOnly trong C# sẽ được chuyển thành string ISO
  IdentificationNumber?: string;
  GenderCode?: string; // string thay vì boolean
}

// Interface cho PatientDTO theo backend API
export interface PatientDTO {
  Id?: string; // Guid sẽ được tạo ở backend
  BloodTypeCode?: string;
  MedicalHistory?: string;
  Allergies?: string;
  EmergencyContactName?: string;
  EmergencyContactPhone?: string;
  InsuranceProvider?: string;
  InsurancePolicyNumber?: string;
  RegistrationDate?: string; // DateTime sẽ được set ở backend
  IsActive?: boolean; // Mặc định là true
}

// Interface cho response từ API
export interface ApiResponse<T = any> {
  success: boolean;
  message?: string;
  data?: T;
  error?: string;
}

// Interface cho payload gửi lên server - khớp với backend RegistrationPayload
export interface RegistrationPayload {
  RegisterDTo: RegisterDTO;
  PatientDTO: PatientDTO;
}
