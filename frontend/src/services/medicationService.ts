import { apiClient } from '../lib/apiClient';

export interface MedicationDto {
  id: string;
  medicationName: string;
  genericName?: string;
  dosageForms?: string;
  commonUses?: string;
  sideEffects?: string;
  isActive: boolean;
  createdAt: string;
}

export interface MedicationCreateDto {
  medicationName: string;
  genericName?: string;
  dosageForms?: string;
  commonUses?: string;
  sideEffects?: string;
  isActive?: boolean;
}

export interface MedicationUpdateDto {
  medicationName: string;
  genericName?: string;
  dosageForms?: string;
  commonUses?: string;
  sideEffects?: string;
  isActive: boolean;
}

export interface MedicationSearchResult {
  id: string;
  name: string;
  dosage?: string;
  unit?: string;
}

class MedicationService {
  /**
   * Lấy tất cả thuốc (bao gồm cả inactive) - dành cho manager
   */
  async getAllIncludingInactive(): Promise<MedicationDto[]> {
    const response = await apiClient.get<MedicationDto[]>('/Medication/all');
    return response.data;
  }

  /**
   * Lấy chi tiết thuốc theo ID
   */
  async getById(id: string): Promise<MedicationDto> {
    const response = await apiClient.get<MedicationDto>(`/Medication/${id}`);
    return response.data;
  }

  /**
   * Tạo thuốc mới
   */
  async create(dto: MedicationCreateDto): Promise<MedicationDto> {
    const response = await apiClient.post<MedicationDto>('/Medication', dto);
    return response.data;
  }

  /**
   * Cập nhật thuốc
   */
  async update(id: string, dto: MedicationUpdateDto): Promise<MedicationDto> {
    const response = await apiClient.put<MedicationDto>(`/Medication/${id}`, dto);
    return response.data;
  }

  /**
   * Toggle trạng thái hoạt động (Lock/Unlock)
   */
  async toggleActive(id: string): Promise<{ id: string; isActive: boolean; message: string }> {
    const response = await apiClient.patch<{ id: string; isActive: boolean; message: string }>(
      `/Medication/${id}/toggle-active`
    );
    return response.data;
  }

  /**
   * Tìm kiếm thuốc để gợi ý khi kê đơn
   */
  async searchMedications(query: string): Promise<MedicationSearchResult[]> {
    const response = await apiClient.get<MedicationSearchResult[]>('/Medication/search', {
      params: { query },
    });
    return response.data;
  }
}

export const medicationService = new MedicationService();
export default medicationService;
