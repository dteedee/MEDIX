import { apiClient } from '../lib/apiClient';
import { DoctorReview } from '../types/review.types';

export interface CreateReviewDto {
  appointmentId: string;
  rating: number;
  comment?: string;
}

export interface CreateReviewResponse {
  id: string;
  appointmentId: string;
  patientId: string;
  doctorId: string;
  rating: number;
  comment?: string;
  createdAt: string;
  message?: string;
}

const getReviewsForCurrentDoctor = async (): Promise<DoctorReview[]> => {
  try {
    // API sẽ tự xác định bác sĩ dựa trên token xác thực
    const response = await apiClient.get<DoctorReview[]>('/Review/me');
    return response.data;
  } catch (error) {
    console.error('Error fetching reviews for doctor:', error);
    throw error;
  }
};

const createReview = async (dto: CreateReviewDto): Promise<CreateReviewResponse> => {
  try {
    const response = await apiClient.post<CreateReviewResponse>('/Review', dto);
    return response.data;
  } catch (error) {
    console.error('Error creating review:', error);
    throw error;
  }
};

const getAllReviews = async (): Promise<DoctorReview[]> => {
  try {
    const response = await apiClient.get<DoctorReview[]>('/Review');
    return response.data;
  } catch (error) {
    console.error('Error fetching all reviews:', error);
    throw error;
  }
};

export const reviewService = {
  getReviewsForCurrentDoctor,
  getAllReviews,
  createReview,
};