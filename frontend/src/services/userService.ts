import axios from 'axios';

// Base URL for API - có thể config trong .env file
const API_BASE_URL = (import.meta as any).env?.VITE_API_BASE_URL || 'https://localhost:55883';

// Create axios instance with default config
const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

export interface UserBasicInfo {
  id: string;
  username: string;
  fullName: string;
  email: string;
  phoneNumber: string | null;
  address: string | null;
  dob: string | null; // ISO date string 'YYYY-MM-DD'
  createdAt: string;
}

export interface UpdateUserInfo {
  fullName?: string;
  email?: string;
  phoneNumber?: string;
  address?: string;
  dob?: string; // Will be converted to DateOnly on backend
}

export const userService = {
  async getUserInfo(): Promise<UserBasicInfo> {
    try {
      // Get access token from localStorage
      const accessToken = localStorage.getItem('accessToken');
      
      if (!accessToken) {
        throw new Error('No access token found - please login');
      }

      // Use shared api client with explicit Authorization header
      const response = await apiClient.get<UserBasicInfo>('/api/user/getUserInfor', {
        headers: {
          'Authorization': `Bearer ${accessToken}`
        }
      });
      return response.data;
    } catch (error: any) {
      console.error('Error fetching user info:', error);
      
      // Handle specific error cases
      if (error.response?.status === 401) {
        throw new Error('Unauthorized - please login again');
      } else if (error.response?.status === 404) {
        throw new Error('User not found');
      } else {
        throw new Error(error.response?.data?.message || 'Failed to fetch user information');
      }
    }
  },

  async updateUserInfo(data: UpdateUserInfo): Promise<UserBasicInfo> {
    try {
      // Get access token from localStorage
      const accessToken = localStorage.getItem('accessToken');
      
      if (!accessToken) {
        throw new Error('No access token found - please login');
      }

      // Format data to match UpdateUserDto structure
      const updateDto = {
        id: null, // Will be set by backend from JWT token
        fullName: data.fullName || '',
        email: data.email || '',
        phoneNumber: data.phoneNumber || null,
        address: data.address || null,
        dob: data.dob || null
      };

      // Use shared api client with explicit Authorization header
      const response = await apiClient.put<UserBasicInfo>('/api/user/updateUserInfor', updateDto, {
        headers: {
          'Authorization': `Bearer ${accessToken}`
        }
      });
      return response.data;
    } catch (error: any) {
      console.error('Error updating user info:', error);
      
      // Handle specific error cases
      if (error.response?.status === 401) {
        throw new Error('Unauthorized - please login again');
      } else if (error.response?.status === 404) {
        throw new Error('User not found');
      } else if (error.response?.status === 400) {
        throw new Error(error.response?.data?.message || 'Invalid data provided');
      } else {
        throw new Error(error.response?.data?.message || 'Failed to update user information');
      }
    }
  },
};
