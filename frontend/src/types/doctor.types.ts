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

export interface DoctorProfileDto {
  doctorID?: string;
  avatarUrl?: string;
  fullName: string;
  consulationFee: number;
  averageRating: number;
  numberOfReviews: number;
  specialization: string;
  biography?: string;
  ratingByStar: number[];
  reviews: ReviewDto[];
  education?: string;
  schedules: DoctorScheduleDto[];
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
}

// Types for Service Tier API with Pagination
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
}

export interface DoctorList {
  totalPages: number;
  items: DoctorDto[];
}