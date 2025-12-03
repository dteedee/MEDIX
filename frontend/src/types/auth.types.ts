
export interface LoginRequest {
  email: string; 
  password: string;
}

export interface RegisterRequestPatient {
  email: string;
  password: string;
  passwordConfirmation: string; 
  fullName: string;
  phoneNumber?: string;
  address?: string; 
  dateOfBirth?: string; 
  identificationNumber?: string;
  genderCode?: string; 
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

export interface PatientRegistration {
  registerRequest: RegisterRequestPatient;
  patientDTO: PatientDTO;
}

export interface PasswordRequirements {
  minLength: boolean;
  hasUppercase: boolean;
  hasLowercase: boolean;
  hasNumber: boolean;
  hasSpecialChar: boolean;
}

export interface ValidationErrors {
  [key: string]: string[];
}