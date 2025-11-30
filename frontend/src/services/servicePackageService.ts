import { apiClient } from '../lib/apiClient';
import { DoctorServiceTier, DoctorServiceTierUpdateRequest } from '../types/doctor-service-tier.types';

const toModel = (dto: DoctorServiceTier): DoctorServiceTier => {
  let featuresList: string[] = [];
  try {
    featuresList = JSON.parse(dto.features || '[]');
    if (!Array.isArray(featuresList)) {
      featuresList = []; 
    }
  } catch (e) {
    featuresList = [];
  }

  return {
    ...dto,
    id: dto.serviceTierId,
    featuresList,
  };
};

export const servicePackageService = {
  async getAllTiers(): Promise<DoctorServiceTier[]> {
    const response = await apiClient.get<DoctorServiceTier[]>('/DoctorServiceTier/all');
    const data = Array.isArray(response.data) ? response.data : [];
    return data.map(toModel);
  },

  async getTierById(id: string): Promise<DoctorServiceTier> {
    const response = await apiClient.get<DoctorServiceTier>(`/DoctorServiceTier/${id}`);
    return toModel(response.data);
  },

  async updateTier(id: string, payload: DoctorServiceTierUpdateRequest): Promise<DoctorServiceTier> {
    const updatePayload = {
      serviceTierId: id,
      ...payload,
    };
    const response = await apiClient.put<DoctorServiceTier>('/DoctorServiceTier/update', updatePayload);
    return toModel(response.data);
  },
};
