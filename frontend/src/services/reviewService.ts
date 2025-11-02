import { apiClient } from '../lib/apiClient';
import { DoctorReview } from '../types/review.types';

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

export const reviewService = {
  getReviewsForCurrentDoctor,
};