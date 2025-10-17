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
}