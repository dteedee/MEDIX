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
}

export interface SpecializationUpdateDto {
  code: string;
  name: string;
  description?: string;
  imageUrl?: string;
  isActive: boolean;
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
    const response = await apiClient.post<SpecializationListDto>(
      '/Specialization',
      dto
    );
    return response.data;
  }

  /**
   * Cập nhật chuyên khoa
   */
  async update(id: string, dto: SpecializationUpdateDto): Promise<SpecializationListDto> {
    const response = await apiClient.put<SpecializationListDto>(
      `/Specialization/${id}`,
      dto
    );
    return response.data;
  }

  /**
   * Toggle trạng thái hoạt động (Lock/Unlock)
   */
  async toggleActive(id: string): Promise<{ id: string; isActive: boolean; message: string }> {
    const response = await apiClient.patch<{ id: string; isActive: boolean; message: string }>(
      `/Specialization/${id}/toggle-active`
    );
    return response.data;
  }
}

const specializationService = new SpecializationService();
export default specializationService;

