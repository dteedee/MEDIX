import { CmsPageDTO, CreateCmsPageRequest, UpdateCmsPageRequest } from '../types/cmspage.types'
import { apiClient } from '../lib/apiClient'

const BASE = '/Cmspage'

function handleApiError(error: any, context: string) {
  if (error.response?.data?.errors) {
    const backendErrors = error.response.data.errors;
    
    const processedErrors: { [key: string]: string } = {};
    for (const key in backendErrors) {
      if (backendErrors[key] && backendErrors[key].length > 0) {
        processedErrors[key] = backendErrors[key][0];
      }
    }
    throw processedErrors;
  }
  throw error; 
}

export const cmspageService = {

  list: async (page = 1, pageSize = 10, keyword?: string): Promise<{ items: CmsPageDTO[]; total?: number }> => {
    const params: any = { page, pageSize };
    let url = BASE;

    if (keyword && keyword.trim()) {
      url = `${BASE}/search`;
      // API for CmsPage search uses 'name' parameter
      params.name = keyword;
      // Remove page/pageSize if search API doesn't support them, or keep if it does.
      // Assuming it supports them for now.
    }

    const r = await apiClient.get(url, { params });
    const data = r.data;

    // Handle multiple response shapes from backend (direct array, or paged object)
    const rawItems = Array.isArray(data)
      ? data
      : data?.data ?? data?.item2 ?? [];

    const items: CmsPageDTO[] = (rawItems || []).map((x: any) => x as CmsPageDTO);
    const total = data?.total ?? data?.item1 ?? (Array.isArray(data) ? data.length : undefined);
    return { items, total };
  },
  get: async (id: string): Promise<CmsPageDTO> => {
    const r = await apiClient.get(`${BASE}/${id}`)
    return r.data
  },
  create: async (payload: CreateCmsPageRequest): Promise<CmsPageDTO> => {
    try {
      const r = await apiClient.post(BASE, payload)
      return r.data
    } catch (error: any) {
      if (error.response?.data?.errors) {
        const backendErrors = error.response.data.errors;
        throw backendErrors;
      }
      throw error;
      handleApiError(error, 'tạo trang CMS');
    }
  },
  update: async (id: string, payload: UpdateCmsPageRequest): Promise<CmsPageDTO> => {
    try {
      const r = await apiClient.put(`${BASE}/${id}`, payload)
      return r.data
    } catch (error: any) {
      if (error.response?.data?.errors) {
        const backendErrors = error.response.data.errors;
        throw backendErrors;
      }
      throw error;
      handleApiError(error, `cập nhật trang CMS (ID: ${id})`);
    }
  },
  remove: async (id: string): Promise<void> => {
    await apiClient.delete(`${BASE}/${id}`)
  }
}
