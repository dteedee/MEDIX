// Common types used across the application - Updated to match backend

export interface ApiResponse<T = any> {
  success: boolean;
  data: T;
  message?: string;
  errors?: Record<string, string[]>;
}

export interface PaginatedResponse<T> {
  data: T[];
  totalCount: number;
  pageSize: number;
  currentPage: number;
  totalPages: number;
  hasNext: boolean;
  hasPrevious: boolean;
}

export interface SelectOption {
  value: string;
  label: string;
}

// Updated to match backend Role values
export enum UserRole {
  ADMIN = "Admin",
  DOCTOR = "Doctor", 
  PATIENT = "Patient",
  MANAGER = "MANAGER",
  USER = "User" // Default role
}

// Updated to match backend GenderCode validation
export enum Gender {
  MALE = "Male",
  FEMALE = "Female", 
  OTHER = "Other"
}

export enum AppointmentStatus {
  PENDING = "Pending",
  CONFIRMED = "Confirmed",
  IN_PROGRESS = "InProgress",
  COMPLETED = "Completed",
  CANCELLED = "Cancelled"
}

export interface BaseEntity {
  id: string;
  createdAt: string;
  updatedAt: string;
}

// Backend entity mappings
export interface UserEntity extends BaseEntity {
  userName: string;
  normalizedUserName: string;
  email: string;
  normalizedEmail: string;
  phoneNumber?: string;
  phoneNumberConfirmed: boolean;
  emailConfirmed: boolean;
  fullName: string;
  role: string;
  dateOfBirth?: string; // DateOnly
  genderCode?: string;
  identificationNumber?: string;
  address?: string;
  avatarUrl?: string;
  status: number;
  isProfileCompleted: boolean;
  lockoutEnd?: string;
  lockoutEnabled: boolean;
  accessFailedCount: number;
}

export interface PatientEntity extends BaseEntity {
  userId: string;
  medicalRecordNumber: string;
  bloodTypeCode?: string;
  height?: number;
  weight?: number;
  medicalHistory?: string;
  allergies?: string;
  emergencyContactName?: string;
  emergencyContactPhone?: string;
}

export interface DoctorEntity extends BaseEntity {
  userId: string;
  specializationId: string;
  serviceTierId?: string;
  licenseNumber: string;
  licenseImageUrl: string;
  bio?: string;
  education?: string;
  yearsOfExperience: number;
  consultationFee: number;
  averageRating: number;
  totalReviews: number;
  isVerified: boolean;
  isAcceptingAppointments: boolean;
}

// Validation constants
export const VALIDATION_RULES = {
  PASSWORD: {
    MIN_LENGTH: 6,
    REQUIRE_UPPERCASE: true,
    REQUIRE_LOWERCASE: true,
    REQUIRE_DIGIT: true,
    REQUIRE_SPECIAL_CHAR: true,
  },
  FULL_NAME: {
    MIN_LENGTH: 2,
    MAX_LENGTH: 100,
  },
  IDENTIFICATION_NUMBER: {
    MAX_LENGTH: 20,
  },
  GENDER_CODES: ['Male', 'Female', 'Other'],
  PHONE_NUMBER: {
    PATTERN: /^[0-9+\-\s\(\)]+$/,
  }
} as const;

export interface BloodTypeDTO {
  code: string;
  displayName: string;
}
