import { BannerDTO, CreateBannerRequest, UpdateBannerRequest } from '../types/banner.types'
import { apiClient } from '../lib/apiClient'
const BASE = '/SiteBanners'

// Helper function to map API response to our DTO consistently
function mapToDTO(x: any): BannerDTO {
  return {
    id: x.id,
    bannerTitle: x.bannerTitle ?? x.title ?? '',
    bannerImageUrl: x.bannerImageUrl ?? x.imageUrl,
    bannerUrl: x.bannerUrl ?? x.link,
    displayOrder: x.displayOrder ?? x.order,
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
      // Append fields under 'request' prefix to match [FromForm] SiteBannerCreateDto request
      formData.append('request.BannerTitle', payload.bannerTitle);
      if (payload.bannerUrl) formData.append('request.BannerUrl', payload.bannerUrl);
      if (payload.displayOrder !== undefined) formData.append('request.DisplayOrder', payload.displayOrder.toString());
      formData.append('request.IsActive', String(payload.isActive));
      if (payload.startDate) formData.append('request.StartDate', payload.startDate);
      if (payload.endDate) formData.append('request.EndDate', payload.endDate);

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
      const formData = new FormData();
      // Append fields under 'request' prefix to match [FromForm] SiteBannerUpdateDto request
      if (payload.bannerTitle !== undefined) formData.append('request.BannerTitle', payload.bannerTitle);
      
      // Handle image URL: send existing URL if no new file, otherwise send empty to let backend know it might be removed or replaced.
      if (payload.bannerImageUrl && !payload.bannerFile) {
        formData.append('request.BannerImageUrl', payload.bannerImageUrl);
      } else if (!payload.bannerFile) {
        formData.append('request.BannerImageUrl', '');
      }

      if (payload.bannerUrl) formData.append('request.BannerUrl', payload.bannerUrl);
      if (payload.displayOrder !== undefined) formData.append('request.DisplayOrder', payload.displayOrder.toString());
      if (payload.isActive !== undefined) formData.append('request.IsActive', String(payload.isActive));
      if (payload.startDate) formData.append('request.StartDate', payload.startDate);
      if (payload.endDate) formData.append('request.EndDate', payload.endDate);

      // Append the file if it exists
      if (payload.bannerFile) {
        formData.append('bannerFile', payload.bannerFile);
      }

      const r = await apiClient.putMultipart(`${BASE}/${id}`, formData);
      return mapToDTO(r.data)
    } catch (error: any) {
      if (error.response?.data?.errors) {
        const backendErrors = error.response.data.errors;
        console.error(`Lỗi validation từ backend khi cập nhật banner (ID: ${id}):`, JSON.stringify(backendErrors, null, 2));
        throw backendErrors;
      }
      throw error;
    }
  },
  lock: async (id: string): Promise<void> => {
    await apiClient.put(`${BASE}/${id}/lock`)
  },
  unlock: async (id: string): Promise<void> => {
    await apiClient.put(`${BASE}/${id}/unlock`)
  },
  remove: async (id: string): Promise<void> => {
    await apiClient.delete(`${BASE}/${id}`)
  }
}
