import { apiClient } from '../lib/apiClient';

export interface SpecializationListDto {
  id: string;
  code: string;
  name: string;
  description?: string;
  imageUrl?: string;
  doctorCount: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface SpecializationCreateDto {
  code: string;
  name: string;
  description?: string;
  imageUrl?: string;
  isActive?: boolean;
  imageFile?: File;
}

export interface SpecializationUpdateDto {
  code: string;
  name: string;
  description?: string;
  imageUrl?: string;
  isActive: boolean;
  imageFile?: File;
}

export interface SpecializationDetailDto {
  id: string;
  code: string;
  name: string;
  description?: string;
  imageUrl?: string;
  doctorCount: number;
  overview?: string;
  services?: string;
  technology?: string;
}

class SpecializationService {
  /**
   * Lấy danh sách tất cả chuyên khoa
   */
  async getAll(activeOnly: boolean = true): Promise<SpecializationListDto[]> {
    const response = await apiClient.get<SpecializationListDto[]>(
      `/Specialization?activeOnly=${activeOnly}`
    );
    return response.data;
  }

  /**
   * Lấy chi tiết chuyên khoa theo ID
   */
  async getById(id: string): Promise<SpecializationDetailDto> {
    const response = await apiClient.get<SpecializationDetailDto>(
      `/Specialization/${id}`
    );
    return response.data;
  }

  /**
   * Lấy chi tiết chuyên khoa theo Code
   */
  async getByCode(code: string): Promise<SpecializationDetailDto> {
    const response = await apiClient.get<SpecializationDetailDto>(
      `/Specialization/code/${code}`
    );
    return response.data;
  }

  /**
   * Tạo chuyên khoa mới
   */
  async create(dto: SpecializationCreateDto): Promise<SpecializationListDto> {
    const formData = new FormData();
    formData.append('Code', dto.code || '');
    formData.append('Name', dto.name || '');
    // Always append Description, even if empty (backend expects it)
    if (dto.description !== undefined && dto.description !== null) {
      formData.append('Description', dto.description);
    } else {
      formData.append('Description', '');
    }
    // Always append ImageUrl, even if empty
    formData.append('ImageUrl', dto.imageUrl || '');
    formData.append('IsActive', String(dto.isActive ?? true));
    
    // Only append file if it exists and is a valid File object
    if (dto.imageFile && dto.imageFile instanceof File) {
      formData.append('imageFile', dto.imageFile);
    }


    const response = await apiClient.postMultipart<SpecializationListDto>(
      '/Specialization',
      formData
    );
    return response.data;
  }

  /**
   * Cập nhật chuyên khoa
   */
  async update(id: string, dto: SpecializationUpdateDto): Promise<SpecializationListDto> {
    const formData = new FormData();
    formData.append('Code', dto.code || '');
    formData.append('Name', dto.name || '');
    // Always append Description, even if empty (backend expects it)
    if (dto.description !== undefined && dto.description !== null) {
      formData.append('Description', dto.description);
    } else {
      formData.append('Description', '');
    }
    formData.append('ImageUrl', dto.imageUrl || '');
    formData.append('IsActive', String(dto.isActive));
    
    if (dto.imageFile && dto.imageFile instanceof File) {
      formData.append('imageFile', dto.imageFile);
    }

   

    const response = await apiClient.putMultipart<SpecializationListDto>(
      `/Specialization/${id}`,
      formData
    );
    return response.data;
  }

 
  async toggleActive(id: string): Promise<{ id: string; isActive: boolean; message: string }> {
    const response = await apiClient.patch<{ id: string; isActive: boolean; message: string }>(
      `/Specialization/${id}/toggle-active`
    );
    return response.data;
  }
}

const specializationService = new SpecializationService();
export default specializationService;

