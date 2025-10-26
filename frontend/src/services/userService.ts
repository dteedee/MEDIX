import { apiClient } from '../lib/apiClient';
import { UserDTO, CreateUserRequest, UpdateUserRequest } from '../types/user.types';

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
  emergencyContactName?: string;
  emergencyContactPhone?: string;
  medicalHistory?: string;
  allergies?: string;
}

export const userService = {
  async getUserInfo(): Promise<UserBasicInfo> {
    try {
      const response = await apiClient.get<UserBasicInfo>('/user/getUserInfor');
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
      const updateDto: any = {
        id: null,
        username: data.username || '',
        fullName: data.fullName || '',
        email: data.email || '',
        phoneNumber: data.phoneNumber || null,
        address: data.address || null,
        dob: data.dob || null
      };
      
      // Add patient-specific fields if they exist
      if (data.emergencyContactName !== undefined) {
        updateDto.emergencyContactName = data.emergencyContactName;
      }
      if (data.emergencyContactPhone !== undefined) {
        updateDto.emergencyContactPhone = data.emergencyContactPhone;
      }
      if (data.medicalHistory !== undefined) {
        updateDto.medicalHistory = data.medicalHistory;
      }
      if (data.allergies !== undefined) {
        updateDto.allergies = data.allergies;
      }
      
      const response = await apiClient.put<UserBasicInfo>('/user/updateUserInfor', updateDto);
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
      const formData = new FormData();
      formData.append('file', imageFile);
      console.log('Upload profile image:');
      console.log('- File name:', imageFile.name);
      console.log('- File type:', imageFile.type);
      console.log('- File size:', imageFile.size);
      const response = await apiClient.postMultipart<{ imageUrl: string }>('/user/uploadAvatar', formData);
      console.log('Upload successful:', response.data);
      return response.data;
    } catch (error: any) {
      console.error('Error uploading profile image:', error);
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
const BASE = '/User'; // Base path (apiClient đã có /api)
export const userAdminService = {
  list: async (page = 1, pageSize = 10, search?: string): Promise<{ items: UserDTO[]; total?: number }> => {
    let response;
    const params: any = { page, pageSize };
    if (search && search.trim()) {
      params.keyword = search;
      response = await apiClient.get(`${BASE}/search`, { params });
    } else {
      response = await apiClient.get(BASE, { params });
    }
    const data = response.data;
    const items: UserDTO[] = data?.item2 ?? [];
    const total: number | undefined = data?.item1;
    return { items, total };
  },
  get: async (id: string): Promise<UserDTO> => {
    const r = await apiClient.get(`${BASE}/${id}`);
    return r.data;
  },
  create: async (payload: CreateUserRequest): Promise<UserDTO> => {
    const r = await apiClient.post(BASE, payload);
    return r.data;
  },
  update: async (id: string, payload: UpdateUserRequest): Promise<UserDTO> => {
    const r = await apiClient.put(`${BASE}/${id}`, payload);
    return r.data;
  },
  remove: async (id: string): Promise<void> => {
    await apiClient.delete(`${BASE}/${id}`);
  },
};
