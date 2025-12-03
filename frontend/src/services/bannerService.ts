import { BannerDTO, CreateBannerRequest, UpdateBannerRequest } from '../types/banner.types'
import { apiClient } from '../lib/apiClient'
const BASE = '/SiteBanners';

interface GetAllParams {
  page?: number;
  pageSize?: number;
}

function mapToDTO(x: any): BannerDTO {
  return {
    id: x.id,
    bannerTitle: x.bannerTitle || x.title || '',
    bannerImageUrl: x.bannerImageUrl ?? x.imageUrl,
    bannerUrl: x.bannerUrl ?? x.link,
    displayOrder: x.displayOrder ?? x.order ?? 0,
    isActive: x.isActive ?? false,
    isLocked: x.isLocked ?? false,
    createdAt: x.createdAt,
    startDate: x.startDate,
    endDate: x.endDate,
  };
}

export const bannerService = {
  getAll: async (params?: GetAllParams): Promise<BannerDTO[]> => {
    const r = await apiClient.get(BASE, { params });
    const data = r.data;
    
    const rawItems = Array.isArray(data)
      ? data
      : data?.data ?? data?.item2 ?? [];
    
    return (rawItems || []).map(mapToDTO);
  },
  list: async (page = 1, pageSize = 10, params?: { keyword?: string; status?: 'all' | 'active' | 'inactive' }): Promise<{ items: BannerDTO[]; total?: number }> => {
    const query: any = { page, pageSize };
    let url = BASE;

    if (params?.keyword && params.keyword.trim()) {
      url = `${BASE}/search`;
      query.name = params.keyword;
    }

    if (params?.status && params.status !== 'all') {
      query.isActive = params.status === 'active';
    }

    const r = await apiClient.get(url, { params: query });
    const data = r.data

    const rawItems = Array.isArray(data)
      ? data
      : data?.data ?? data?.item2 ?? []

    const items: BannerDTO[] = (rawItems || []).map(mapToDTO);
    const total = data?.total ?? data?.item1 ?? (Array.isArray(data) ? data.length : undefined);
    return { items, total }
  },
  get: async (id: string): Promise<BannerDTO> => {
    const r = await apiClient.get(`${BASE}/${id}`)
    return mapToDTO(r.data)
  },
  create: async (payload: CreateBannerRequest): Promise<BannerDTO> => {
    try {
      const formData = new FormData();
      formData.append('BannerTitle', payload.bannerTitle);
      if (payload.bannerUrl) formData.append('BannerUrl', payload.bannerUrl);
      if (payload.displayOrder !== undefined) formData.append('DisplayOrder', payload.displayOrder.toString());
      formData.append('IsActive', String(payload.isActive));
      if (payload.startDate) formData.append('StartDate', payload.startDate);
      if (payload.endDate) formData.append('EndDate', payload.endDate);

      if (payload.bannerFile) {
        formData.append('bannerFile', payload.bannerFile);
      }

      const r = await apiClient.postMultipart(BASE, formData);
      return mapToDTO(r.data)
    } catch (error: any) {
      if (error.response?.data?.errors) {
        const backendErrors = error.response.data.errors;
        throw backendErrors;
      }
      throw error;
    }
  },
  update: async (id: string, payload: UpdateBannerRequest): Promise<BannerDTO> => {
    try {

      const formData = new FormData();

      formData.append('BannerTitle', payload.bannerTitle || '');
      if (payload.bannerUrl) formData.append('BannerUrl', payload.bannerUrl);
      if (payload.displayOrder !== undefined) formData.append('DisplayOrder', payload.displayOrder.toString());
      formData.append('IsActive', payload.isActive !== undefined ? String(payload.isActive) : 'true');
      if (payload.startDate) formData.append('StartDate', payload.startDate);
      if (payload.endDate) formData.append('EndDate', payload.endDate);
      if (payload.bannerImageUrl) formData.append('BannerImageUrl', payload.bannerImageUrl);

      if (payload.bannerFile) {
        formData.append('bannerFile', payload.bannerFile);
      }

      const r = await apiClient.putMultipart(`${BASE}/${id}`, formData);
      return mapToDTO(r.data);
    } catch (error: any) {
      
      if (error.response?.data?.errors) {
        const backendErrors = error.response.data.errors;
        throw backendErrors;
      }
      throw error;
    }
  },
  lock: async (id: string): Promise<void> => {
    try {
      const response = await apiClient.put(`${BASE}/${id}/lock`, {});
      return;
    } catch (error: any) {
  
      throw error;
    }
  },
  unlock: async (id: string): Promise<void> => {
    try {
      const response = await apiClient.put(`${BASE}/${id}/unlock`, {});
      return;
    } catch (error: any) {
      
      throw error;
    }
  },
  remove: async (id: string): Promise<void> => {
    await apiClient.delete(`${BASE}/${id}`)
  }
}
