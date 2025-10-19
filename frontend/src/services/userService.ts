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
      const accessToken = localStorage.getItem('accessToken');
      if (!accessToken) throw new Error('No access token found - please login');

      const updateDto = {
        id: null,
        username: data.username || '',
        fullName: data.fullName || '',
        email: data.email || '',
        phoneNumber: data.phoneNumber || null,
        address: data.address || null,
        dob: data.dob || null
      };

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
      const accessToken = localStorage.getItem('accessToken');
      if (!accessToken) throw new Error('No access token found - please login');

      const formData = new FormData();
      formData.append('file', imageFile);

      console.log('Upload attempt with fetch:');
      console.log('- File name:', imageFile.name);
      console.log('- File type:', imageFile.type);
      console.log('- File size:', imageFile.size);

      const response = await fetch(`${API_BASE_URL}/api/user/uploadAvatar`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`
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
      
      if (error.response?.status === 401) {
        throw new Error('Unauthorized - please login again');
      } else if (error.response?.status === 404) {
        throw new Error('Endpoint không tồn tại. Vui lòng kiểm tra backend API');
      } else if (error.response?.status === 413) {
        throw new Error('File quá lớn. Vui lòng chọn ảnh nhỏ hơn 5MB');
      } else if (error.response?.status === 400) {
        const responseData = error.response?.data;
        if (responseData?.errors) {
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

// --- Phần dành cho quản lý người dùng (Admin) ---
import { UserDTO, CreateUserRequest, UpdateUserRequest } from '../types/user.types';

const BASE = '/api/User'; // Base path for user-related actions

function authHeader() {
  try {
    const token = localStorage.getItem('accessToken') || localStorage.getItem('token');
    return token ? { Authorization: `Bearer ${token}` } : undefined;
  } catch {
    return undefined;
  }
}

export const userAdminService = {
  list: async (page = 1, pageSize = 10, search?: string): Promise<{ items: UserDTO[]; total?: number }> => {
    let response;
    const params: any = { page, pageSize };

    if (search && search.trim()) {
      params.keyword = search;
      response = await axios.get(`${BASE}/search`, { params, headers: authHeader() });
    } else {
      response = await axios.get(BASE, { params, headers: authHeader() });
    }

    const data = response.data;
    const items: UserDTO[] = data?.item2 ?? [];
    const total: number | undefined = data?.item1;
    return { items, total };
  },
  get: async (id: string): Promise<UserDTO> => {
    const r = await axios.get(`${BASE}/${id}`, { headers: authHeader() });
    return r.data;
  },
  create: async (payload: CreateUserRequest): Promise<UserDTO> => {
    const r = await axios.post(BASE, payload, { headers: authHeader() });
    return r.data;
  },
  update: async (id: string, payload: UpdateUserRequest): Promise<UserDTO> => {
    const r = await axios.put(`${BASE}/${id}`, payload, { headers: authHeader() });
    return r.data;
  },
  remove: async (id: string): Promise<void> => {
    await axios.delete(`${BASE}/${id}`, { headers: authHeader() });
  },
};
