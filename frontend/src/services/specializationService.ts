import { apiClient } from '../lib/apiClient';

export interface SpecializationListDto {
  id: string;
  code: string;
  name: string;
  description?: string;
  imageUrl?: string;
  doctorCount: number;
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
}

const specializationService = new SpecializationService();
export default specializationService;

