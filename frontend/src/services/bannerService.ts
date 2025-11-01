import { BannerDTO, CreateBannerRequest, UpdateBannerRequest } from '../types/banner.types'
import { apiClient } from '../lib/apiClient'
const BASE = '/SiteBanners'

// Helper function to map API response to our DTO consistently
function mapToDTO(x: any): BannerDTO {
  console.log('Mapping banner data:', x);
  return {
    id: x.id,
    bannerTitle: x.bannerTitle ?? x.title ?? '',
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
  getAll: async (): Promise<BannerDTO[]> => {
    const r = await apiClient.get(BASE);
    const data = r.data;
    
    // Handle multiple response shapes from backend
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

    // Handle multiple response shapes from backend
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
      // Append fields directly to match [FromForm] SiteBannerCreateDto properties
      formData.append('BannerTitle', payload.bannerTitle);
      if (payload.bannerUrl) formData.append('BannerUrl', payload.bannerUrl);
      if (payload.displayOrder !== undefined) formData.append('DisplayOrder', payload.displayOrder.toString());
      formData.append('IsActive', String(payload.isActive));
      if (payload.startDate) formData.append('StartDate', payload.startDate);
      if (payload.endDate) formData.append('EndDate', payload.endDate);

      // Append the file if it exists
      if (payload.bannerFile) {
        formData.append('bannerFile', payload.bannerFile);
      }

      const r = await apiClient.postMultipart(BASE, formData);
      return mapToDTO(r.data)
    } catch (error: any) {
      if (error.response?.data?.errors) {
        const backendErrors = error.response.data.errors;
        console.error("Lỗi validation từ backend khi tạo banner:", JSON.stringify(backendErrors, null, 2));
        // Ném lại đối tượng lỗi để component có thể xử lý
        throw backendErrors;
      }
      throw error; // Ném lại các lỗi khác
    }
  },
  update: async (id: string, payload: UpdateBannerRequest): Promise<BannerDTO> => {
    try {
      console.log(`Updating banner ID: ${id}`);
      console.log('Payload received:', payload);

      // Always use FormData for update because the backend endpoint expects [FromForm]
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
      console.error('Error updating banner:', error);
      console.error('Error response:', error?.response?.data);
      
      if (error.response?.data?.errors) {
        const backendErrors = error.response.data.errors;
        console.error(`Lỗi validation từ backend khi cập nhật banner (ID: ${id}):`, JSON.stringify(backendErrors, null, 2));
        throw backendErrors;
      }
      throw error;
    }
  },
  lock: async (id: string): Promise<void> => {
    try {
      console.log('Locking banner with ID:', id);
      console.log('Endpoint:', `${BASE}/${id}/lock`);
      const response = await apiClient.put(`${BASE}/${id}/lock`, {});
      console.log('Lock response status:', response.status);
      return;
    } catch (error: any) {
      console.error('Error locking banner:', error);
      console.error('Error details:', {
        status: error?.response?.status,
        statusText: error?.response?.statusText,
        data: error?.response?.data,
        message: error?.message
      });
      throw error;
    }
  },
  unlock: async (id: string): Promise<void> => {
    try {
      console.log('Unlocking banner with ID:', id);
      console.log('Endpoint:', `${BASE}/${id}/unlock`);
      const response = await apiClient.put(`${BASE}/${id}/unlock`, {});
      console.log('Unlock response status:', response.status);
      return;
    } catch (error: any) {
      console.error('Error unlocking banner:', error);
      console.error('Error details:', {
        status: error?.response?.status,
        statusText: error?.response?.statusText,
        data: error?.response?.data,
        message: error?.message
      });
      throw error;
    }
  },
  remove: async (id: string): Promise<void> => {
    await apiClient.delete(`${BASE}/${id}`)
  }
}
