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

export interface DoctorRegisterMetadata{
  specializations: SpecializationDto[];
}

export interface ReviewDto{
  rating: number;
  comment: string;
  date: string;
}

export interface DoctorProfileDto{
  avatarUrl: string;
  fullName: string;
  averageRating: number;
  numberOfReviews: number;
  specialization: string;
  biography: string;
  ratingByStar: number[];
  reviews: ReviewDto[];
  education: string;
}

export interface DoctorProfileDetails{
  userName: string;
  email: string;
  avatarUrl: string;
  phoneNumber: string;
  fullName: string;
  dateOfBirth: string;
  address: string;
  education: string;
  bio: string;
  yearsOfExperience: number;
  consultationFee: string;
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