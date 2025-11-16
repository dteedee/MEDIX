// Authentication related types - Updated to match backend models

export interface LoginRequest {
  email: string; // This will be used as identifier (email or username)
  password: string;
}

export interface RegisterRequestPatient {
  email: string;
  password: string;
  passwordConfirmation: string; // Match backend PasswordConfirmation
  fullName: string;
  phoneNumber?: string;
  address?: string; // Match backend address field
  dateOfBirth?: string; // DateOnly from backend
  identificationNumber?: string;
  genderCode?: string; // "Male", "Female", "Other"
}



export interface RegisterRequest {
  email: string;
  password: string;
  confirmPassword: string;
  firstName: string;
  lastName: string;
  phoneNumber?: string;
}

export interface ForgotPasswordRequest {
  email: string;
}

export interface ResetPasswordRequest {
  code: string;
  email: string;
  password: string;
  confirmPassword: string;
}

export interface RefreshTokenRequest {
  refreshToken: string;
}

export interface AuthResponse {
  accessToken: string;
  refreshToken: string;
  expiresAt: string;
  user: User;
}

export interface User {
  id: string;
  email: string;
  userName: string;
  fullName: string;
  phoneNumber?: string;
  role: string;
  emailConfirmed: boolean;
  dateOfBirth?: string;
  genderCode?: string;
  identificationNumber?: string;
  address?: string;
  avatarUrl?: string;
  isProfileCompleted: boolean;
  isTemporaryUsername?: boolean;
  createdAt: string;
  startDateBanner?: string;
  endDateBanner?: string;
}

export interface ApiError {
  message: string;
  errors?: Record<string, string[]>;
}

export interface BloodType {
  code: string;
  displayName: string;
  isActive: boolean;
}

export interface Gender {
  code: string;
  displayName: string;
  isActive: boolean;
}

// Updated to match backend PatientDTO
export interface PatientDTO {
  id?: string;
  userId?: string;
  medicalRecordNumber?: string;
  bloodTypeCode?: string;
  height?: number;
  weight?: number;
  medicalHistory?: string;
  allergies?: string;
  emergencyContactName?: string;
  emergencyContactPhone?: string;
  insuranceProvider?: string;
  insurancePolicyNumber?: string;
  isActive?: boolean;
}

// Updated to match backend RegistrationPayloadDTO
export interface PatientRegistration {
  registerRequest: RegisterRequestPatient;
  patientDTO: PatientDTO;
}

// Password validation requirements
export interface PasswordRequirements {
  minLength: boolean;
  hasUppercase: boolean;
  hasLowercase: boolean;
  hasNumber: boolean;
  hasSpecialChar: boolean;
}

// Form validation errors
export interface ValidationErrors {
  [key: string]: string[];
}