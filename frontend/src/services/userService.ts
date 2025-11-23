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
  identificationNumber?: string | null; // Số CMND/CCCD
  createdAt: string;
  medicalRecordNumber?: string | null; // Somente leitura
  emergencyContactName?: string | null; // Editável
  emergencyContactPhone?: string | null; // Editável
  allergies?: string | null; // Match backend DTO field name
  medicalHistory?: string | null; // Match backend DTO field name
}

export interface UpdateUserInfo {
  username?: string;
  fullName?: string;
  email?: string;
  phoneNumber?: string;
  address?: string;
  dob?: string; // Will be converted to DateOnly on backend
  identificationNumber?: string; // Số CMND/CCCD
  emergencyContactName?: string;
  emergencyContactPhone?: string;
  medicalHistory?: string;
  allergies?: string;
  imageURL?: string; // Avatar URL
}

export const userService = {
  async getUserInfo(): Promise<UserBasicInfo> {
    try {
      console.log('🔄 userService - Calling API: /user/getUserInfor');
      const response = await apiClient.get<UserBasicInfo>('/user/getUserInfor');
      console.log('✅ userService - API response received:', response.data);
      return response.data;
    } catch (error: any) {
      console.error('❌ userService - Error fetching user info:', error);
      console.error('❌ userService - Error details:', {
        status: error.response?.status,
        statusText: error.response?.statusText,
        data: error.response?.data,
        message: error.message
      });

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
        dob: data.dob || null,
        emergencyContactName: data.emergencyContactName || null,
        emergencyContactPhone: data.emergencyContactPhone || null
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
      if (data.imageURL !== undefined) {
        updateDto.imageURL = data.imageURL;
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
      
      // Try using the File/upload endpoint first (available endpoint)
      let imageUrl: string;
      try {
        const uploadResponse = await apiClient.postMultipart<{ url: string }>('/classification/File/upload', formData);
        console.log('Upload successful:', uploadResponse.data);
        imageUrl = uploadResponse.data.url;
      } catch (uploadError: any) {
        // If classification endpoint fails, try the user endpoint (might be uncommented)
        if (uploadError.response?.status === 404 || uploadError.response?.status === 405) {
          console.log('Classification endpoint not available, trying user endpoint...');
          const userResponse = await apiClient.postMultipart<{ imageUrl: string }>('/user/uploadAvatar', formData);
          imageUrl = userResponse.data.imageUrl;
        } else {
          throw uploadError;
        }
      }
      
      // After successful upload, update user info with the new image URL
      if (imageUrl) {
        try {
          await this.updateUserInfo({ imageURL: imageUrl });
          console.log('User avatar URL updated successfully');
        } catch (updateError) {
          console.warn('Failed to update user avatar URL, but image was uploaded:', updateError);
          // Don't throw error here - image was uploaded successfully
        }
      }
      
      return { imageUrl };
    } catch (error: any) {
      console.error('Error uploading profile image:', error);
      if (error.response?.status === 401) {
        throw new Error('Unauthorized - please login again');
      } else if (error.response?.status === 404) {
        throw new Error('Endpoint không tồn tại. Vui lòng kiểm tra backend API');
      } else if (error.response?.status === 405) {
        throw new Error('Lỗi 405: Phương thức không được phép. Endpoint upload ảnh có thể chưa được kích hoạt trong backend.');
      } else if (error.response?.status === 413) {
        throw new Error('File quá lớn. Vui lòng chọn ảnh nhỏ hơn 10MB');
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

  async updatePassword(payload: FormData): Promise<any> {
    await apiClient.put('user/update-password', payload);
  }
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
  getRoles: async (): Promise<{ code: string; displayName: string }[]> => {
    const r = await apiClient.get(`${BASE}/roles`);
    return r.data;
  },
  /**
   * Sends a request for an admin to reset a user's password.
   * A new temporary password will be generated and emailed to the user.
   * @param id The ID of the user.
   */
  adminResetPassword: async (id: string): Promise<void> => {
    // This calls the POST /api/User/{id}/admin-reset-password endpoint you created.
    await apiClient.post(`${BASE}/${id}/admin-reset-password`);
  },
};
