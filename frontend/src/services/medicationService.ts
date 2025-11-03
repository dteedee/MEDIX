import { apiClient } from '../lib/apiClient';

// Định nghĩa kiểu dữ liệu cho kết quả tìm kiếm, khớp với MedicationSearchDto của backend
export interface MedicationSearchResult {
  id: string;
  name: string;
  dosage: string | null;
  unit: string | null;
}

const searchMedications = async (query: string): Promise<MedicationSearchResult[]> => {
  if (!query || query.length < 2) {
    return [];
  }
  const response = await apiClient.get<MedicationSearchResult[]>('/Medication/search', {
    params: { query },
  });
  return response.data;
};

export const medicationService = {
  searchMedications,
};