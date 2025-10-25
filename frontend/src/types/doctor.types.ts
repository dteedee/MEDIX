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

export interface DoctorProfileDto {
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

export interface DoctorProfileDetails {
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

export interface DoctorRegisterProfile {
  id: string;
  fullName: string;
  email: string;
  specialization: string;
  createdAt: string;
}

export interface DoctorRegisterProfileList {
  totalPages: number;
  doctors: DoctorRegisterProfile[];
}

export interface DoctorProfileQuery {
  page: number;
  searchTerm: string;
}

export interface DoctorRegisterProfileDetails {
  fullName: string;
  userName: string;
  dob: string;
  gender: string;
  identificationNumber: string;
  email: string;
  phoneNumber: string;
  specialization: string;
  licenseUrl: string;
  licenseNumber: string;
  bio: string;
  education: string;
  yearsOfExperience: number;
}