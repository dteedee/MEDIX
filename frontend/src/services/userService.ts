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
  imageURL?: string | null; // Match backend DTO field name
  createdAt: string;
}

export interface UpdateUserInfo {
  username?: string;
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
        username: data.username || '',
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
      
      console.log('UpdateUserInfo - Request payload:', updateDto);
      console.log('UpdateUserInfo - API response:', response.data);
      
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

  async uploadProfileImage(imageFile: File): Promise<{ imageUrl: string }> {
    try {
      // Get access token from localStorage
      const accessToken = localStorage.getItem('accessToken');
      
      if (!accessToken) {
        throw new Error('No access token found - please login');
      }

      // Create FormData for file upload
      const formData = new FormData();
      formData.append('file', imageFile);

      console.log('Upload attempt with fetch:');
      console.log('- File name:', imageFile.name);
      console.log('- File type:', imageFile.type);
      console.log('- File size:', imageFile.size);

      // Use native fetch instead of axios
      const response = await fetch(`${API_BASE_URL}/api/user/uploadAvatar`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`
          // Don't set Content-Type for FormData - browser will set it with boundary
        },
        body: formData
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Fetch error:', response.status, errorText);
        throw new Error(`Upload failed: ${response.status}`);
      }

      const result = await response.json();
      console.log('Upload successful:', result);
      
      return result;
    } catch (error: any) {
      console.error('Error uploading profile image:', error);
      console.error('Error response:', error.response);
      console.error('Full error details:', {
        status: error.response?.status,
        statusText: error.response?.statusText,
        data: error.response?.data,
        headers: error.response?.headers,
        config: {
          url: error.config?.url,
          method: error.config?.method,
          headers: error.config?.headers
        }
      });
      
      // Handle specific error cases
      if (error.response?.status === 401) {
        throw new Error('Unauthorized - please login again');
      } else if (error.response?.status === 404) {
        throw new Error('Endpoint không tồn tại. Vui lòng kiểm tra backend API');
      } else if (error.response?.status === 413) {
        throw new Error('File quá lớn. Vui lòng chọn ảnh nhỏ hơn 5MB');
      } else if (error.response?.status === 400) {
        // Handle ASP.NET Core validation errors
        const responseData = error.response?.data;
        
        if (responseData?.errors) {
          // Extract validation error messages
          const validationErrors = [];
          for (const [field, messages] of Object.entries(responseData.errors)) {
            if (Array.isArray(messages)) {
              validationErrors.push(`${field}: ${messages.join(', ')}`);
            } else {
              validationErrors.push(`${field}: ${messages}`);
            }
          }
          console.log('Validation errors:', validationErrors);
          throw new Error(`Validation Error: ${validationErrors.join('; ')}`);
        }
        
        // Fallback for other 400 errors
        const backendMessage = responseData?.message || responseData?.title || 'File không hợp lệ';
        console.log('Backend 400 error message:', backendMessage);
        throw new Error(`Backend Error: ${backendMessage}`);
      } else if (error.response?.status === 500) {
        throw new Error('Lỗi server khi upload ảnh. Vui lòng thử lại sau');
      } else if (error.code === 'NETWORK_ERROR' || !error.response) {
        throw new Error('Lỗi kết nối mạng. Vui lòng kiểm tra kết nối internet');
      } else {
        throw new Error(error.response?.data?.message || `Lỗi ${error.response?.status}: Không thể tải ảnh lên`);
      }
    }
  },
};
