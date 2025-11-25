import { apiClient } from '../lib/apiClient';
import { ServicePackageDto, ServicePackageModel, ServicePackageUpdateRequest } from '../types/service-package.types';

const BASE = '/ServicePackage';

const toModel = (dto: ServicePackageDto): ServicePackageModel => {
  const rawFeatures = dto.features ?? '';
  const featuresList = rawFeatures
    .split(/[\r\n;,]/)
    .map((item) => item.trim())
    .filter(Boolean);

  return {
    ...dto,
    featuresList,
  };
};

export const servicePackageService = {
  async getTop(limit = 10): Promise<ServicePackageModel[]> {
    const response = await apiClient.get<ServicePackageDto[]>(`${BASE}/top`, {
      params: { limit },
    });
    const data = Array.isArray(response.data) ? response.data : [];
    return data.map(toModel);
  },

  async getById(id: string): Promise<ServicePackageModel> {
    const response = await apiClient.get<ServicePackageDto>(`${BASE}/${id}`);
    return toModel(response.data);
  },

  async updateBasicInfo(id: string, payload: ServicePackageUpdateRequest): Promise<ServicePackageModel> {
    const response = await apiClient.put<ServicePackageDto>(`${BASE}/${id}/basic-info`, payload);
    return toModel(response.data);
  },
};

