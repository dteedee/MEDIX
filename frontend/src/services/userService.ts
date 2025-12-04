import { apiClient } from '../lib/apiClient';
import { UserDTO, CreateUserRequest, UpdateUserRequest } from '../types/user.types';

export interface UserBasicInfo {
  id: string;
  username: string;
  fullName: string;
  email: string;
  phoneNumber: string | null;
  address: string | null;
  dob: string | null; 
  imageURL?: string | null; 
  identificationNumber?: string | null; 
  createdAt: string;
  medicalRecordNumber?: string | null; 
  emergencyContactName?: string | null; 
  emergencyContactPhone?: string | null; 
  allergies?: string | null; 
  medicalHistory?: string | null; 
  bloodTypeCode?: string | null;
  genderCode?: string | null; // Giới tính (Male/Female/Other)
}

export interface UpdateUserInfo {
  username?: string;
  fullName?: string;
  email?: string;
  phoneNumber?: string;
  address?: string;
  dob?: string; // Will be converted to DateOnly on backend
  identificationNumber?: string; // Số CMND/CCCD
  genderCode?: string; // Giới tính (Male/Female/Other)
  emergencyContactName?: string;
  emergencyContactPhone?: string;
  medicalHistory?: string;
  allergies?: string;
  imageURL?: string;
  bloodTypeCode?: string; 
}

export const userService = {
  async getUserInfo(): Promise<UserBasicInfo> {
    try {
      const response = await apiClient.get<UserBasicInfo>('/user/getUserInfor');
      return response.data;
    } catch (error: any) {
     

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

      if (data.identificationNumber !== undefined) {
        updateDto.identificationNumber = data.identificationNumber;
      }
      if (data.genderCode !== undefined) {
        updateDto.genderCode = data.genderCode;
      }
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
      if (data.bloodTypeCode !== undefined) {
        updateDto.bloodTypeCode = data.bloodTypeCode;
      }

      const response = await apiClient.put<UserBasicInfo>('/user/updateUserInfor', updateDto);
      return response.data;
    } catch (error: any) {
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
      
      
      const userResponse = await apiClient.postMultipart<{ imageUrl: string }>('/user/uploadAvatar', formData);
      const imageUrl = userResponse.data.imageUrl;
      return { imageUrl };
    } catch (error: any) {
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
          throw new Error(`Validation Error: ${validationErrors.join('; ')}`);
        }
        const backendMessage = responseData?.message || responseData?.title || 'File không hợp lệ';
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
    await apiClient.post(`${BASE}/${id}/admin-reset-password`);
  },
};
