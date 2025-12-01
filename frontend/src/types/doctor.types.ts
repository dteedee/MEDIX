import { BaseEntity } from './common.types';

export interface Doctor extends BaseEntity {
  userId: string;
  specialization: string;
  licenseNumber: string;
  yearsOfExperience: number;
  education: string;
  certifications?: string;
  availableHours: string;
  consultationFee: number;
  bio?: string;
  profileImage?: string;
  rating: number;
  totalReviews: number;
  isVerified: boolean;
  status: DoctorStatus;
}

export interface DoctorRegistration {
  specialization: string;
  licenseNumber: string;
  yearsOfExperience: number;
  education: string;
  certifications?: string;
  consultationFee: number;
  bio?: string;
}

export enum DoctorStatus {
  PENDING = 'Pending',
  APPROVED = 'Approved',
  REJECTED = 'Rejected',
  SUSPENDED = 'Suspended'
}

export interface SpecializationDto {
  id: string;
  name: string;
}

export interface DoctorRegisterMetadata {
  specializations: SpecializationDto[];
}

export interface ReviewDto {
  rating: number;
  comment: string;
  date: string;
  adminResponse?: string | null;
  patientName?: string;
  patientAvatar?: string;
}

export interface DoctorScheduleDto {
  id: string;
  doctorId: string;
  dayOfWeek: number;
  startTime: string;
  endTime: string;
  isAvailable: boolean;
}
export interface DoctorTypeDegreeDto {
  code: string;
  description: string;
}

export interface AppointmentBookedDto {
  startTime: string; 
  endTime: string; 
}

export interface DoctorProfileDto {
  doctorID?: string;
  avatarUrl?: string;
  fullName: string;
  consulationFee: number; 
  price?: number; 
  yearsOfExperience?: number | string; 
  experience?: number | string;
  experiece?: number | string; 
  averageRating: number;
  numberOfReviews: number;
  specialization: string;
  biography?: string;
  ratingByStar: number[];
  reviews: ReviewDto[];
  education?: string;
  schedules: DoctorScheduleDto[];
  scheduleOverride?: DoctorScheduleOverrideDto[]; 
  appointmentBookedDtos?: AppointmentBookedDto[]; 
}

export interface DoctorScheduleOverrideDto {
  id: string;
  doctorId: string;
  overrideDate: string; 
  startTime: string; 
  endTime: string; 
  isAvailable: boolean;
  reason?: string;
  createdAt: string;
  updatedAt: string;
  overrideType: boolean; 
}

export interface DoctorProfileDetails {
  avatarUrl: string;
  userName: string;
  fullName: string;
  email: string;
  phoneNumber: string;
  address: string;
  dob: string;
  identificationNumber: string;
  genderCode: string;
  specialization: string;
  licenseNumber: string;
  education: string;
  serviceTier: string;
  yearsOfExperience: string;
  bio: string;
  licenseImageUrl: string;
  degreeFilesUrl: string;
  startDateBanned?: string;
  endDateBanned?: string;
}

export interface DoctorInTier {
  userId: string;
  doctorId: string;
  doctorName: string;
  specialization: string;
  education: string;
  experience: string;
  price: number;
  bio: string;
  rating: number;
  isAcceptingAppointments?: boolean; 
  totalDone?: number; 
  totalAppointments?: number; 
  successPercentage?: number; 
  totalReviews?: number; 
  totalCases?: number;
  successfulCases?: number;
  successRate?: number;
  averageResponseTime?: number; 
  reviewCount?: number;
}

export interface PaginationParams {
  pageNumber: number;
  pageSize: number;
}

export interface DoctorQueryParameters extends PaginationParams {
  educationCode?: string;
  specializationCode?: string;
  minPrice?: number;
  maxPrice?: number;
  page?: number;
}

export interface PaginatedListDto<T> {
  items: T[];
  pageNumber: number;
  pageSize: number;
  totalCount: number;
  totalPages: number;
}

export interface ServiceTierWithPaginatedDoctorsDto {
  id: string;
  name: string;
  description: string;
  doctors: PaginatedListDto<DoctorInTier>;
}

export interface DoctorInEducation {
  userId: string;
  doctorId: string;
  doctorName: string;
  specializationCode: string;
  specialization: string;
  avatarUrl?: string;
  educationcode: string;
  education: string;
  experience: string;
  price: number;
  bio: string;
  rating: number;
  isAcceptingAppointments?: boolean; 
  totalDone?: number; 
  totalAppointments?: number; 
  successPercentage?: number; 
  totalReviews?: number; 
  totalCases?: number;
  successfulCases?: number;
  successRate?: number;
  averageResponseTime?: number; 
  reviewCount?: number;
}

export interface EducationGroupWithPaginatedDoctorsDto {
  educationCode: string;
  education: string;
  description: string;
  doctors: PaginatedListDto<DoctorInEducation>;
}

export interface DoctorRegisterFormList {
  totalPages: number;
  doctors: DoctorRegisterForm[];
}

export interface DoctorQuery {
  page: number;
  searchTerm: string;
  pageSize: number;
}

export interface DoctorRegisterFormDetails {
  id: string;
  avatarUrl: string;
  fullName: string;
  userName: string;
  dob: string;
  gender: string;
  identificationNumber: string;
  email: string;
  phoneNumber: string;
  specialization: string;
  licenseImageUrl: string;
  licenseNumber: string;
  degreeFilesUrl: string;
  bio: string;
  education: string;
  yearsOfExperience: number;
  createdAt: string;
  identityCardImageUrl: string;
}

export interface DoctorRegisterForm {
  id: string;
  fullName: string;
  email: string;
  specialization: string;
  createdAt: string;
}

export interface DoctorDto {
  id: string;
  avatarUrl: string;
  fullName: string;
  email: string;
  phoneNumber: string;
  specialization: string;
  education: string;
  yearsOfExperience?: number;
  rating: number;
  reviewCount: number;
  statusCode: number;
  createdAt: string;
  serviceTier: string;
  price: string;
  licenseNumber: string;
  licenseImageUrl: string;
  degreeFilesUrl: string;
  bio: string;
}

export interface DoctorList {
  totalPages: number;
  items: DoctorDto[];
}

export interface DoctorSalary{
  id: string;
  periodStartDate: string;
  periodEndDate: string;
  totalAppointments: number;
  totalEarnings: number;
  commissionDeductions: number;
  netSalary: number;
  paidAt: string;
}

export interface DoctorPerformanceDto {
  doctorId: string;
  doctorName: string;
  specialization: string;
  averageRating: number;
  reviewCount: number;
  successfulCases: number;
  totalCases: number;
  successRate: number;
  compositeScore: number;
  imageUrl: string | null;
  formattedRating: string;
  formattedSuccessRate: string;
  consultationFee: number | null;
}