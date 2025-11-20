import { apiClient } from '../lib/apiClient';

const getDashboardData = async () => {
  try {
    const response = await apiClient.get('/Dashboard/admin');
    return response.data;
  } catch (error) {
    console.error('Error fetching admin dashboard data:', error);
    throw error;
  }
};

export const adminDashboardService = {
  getDashboardData,
};