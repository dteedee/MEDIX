import axios from 'axios'
import { CmsPageDTO, CreateCmsPageRequest, UpdateCmsPageRequest } from '../types/cmspage.types'

const BASE = '/api/Cmspage'

function authHeader() {
  try {
    const token = localStorage.getItem('accessToken') || localStorage.getItem('token')
    return token ? { Authorization: `Bearer ${token}` } : undefined
  } catch {
    return undefined
  }
}

// Helper function to process and re-throw API validation errors
function handleApiError(error: any, context: string) {
  if (error.response?.data?.errors) {
    const backendErrors = error.response.data.errors;
    console.error(`Lỗi validation từ backend khi ${context}:`, JSON.stringify(backendErrors, null, 2));
    
    // Trích xuất thông báo lỗi đầu tiên từ mỗi trường
    const processedErrors: { [key: string]: string } = {};
    for (const key in backendErrors) {
      if (backendErrors[key] && backendErrors[key].length > 0) {
        processedErrors[key] = backendErrors[key][0];
      }
    }
    throw processedErrors;
  }
  throw error; // Re-throw other types of errors
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

    const r = await axios.get(url, { params, headers: authHeader() });
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
    const r = await axios.get(`${BASE}/${id}`, { headers: authHeader() })
    return r.data
  },
  create: async (payload: CreateCmsPageRequest): Promise<CmsPageDTO> => {
    try {
      const r = await axios.post(BASE, payload, { headers: authHeader() })
      return r.data
    } catch (error: any) {
      if (error.response?.data?.errors) {
        const backendErrors = error.response.data.errors;
        console.error("Lỗi validation từ backend khi tạo trang CMS:", JSON.stringify(backendErrors, null, 2));
        throw backendErrors;
      }
      throw error;
      handleApiError(error, 'tạo trang CMS');
    }
  },
  update: async (id: string, payload: UpdateCmsPageRequest): Promise<CmsPageDTO> => {
    try {
      const r = await axios.put(`${BASE}/${id}`, payload, { headers: authHeader() })
      return r.data
    } catch (error: any) {
      if (error.response?.data?.errors) {
        const backendErrors = error.response.data.errors;
        console.error(`Lỗi validation từ backend khi cập nhật trang CMS (ID: ${id}):`, JSON.stringify(backendErrors, null, 2));
        throw backendErrors;
      }
      throw error;
      handleApiError(error, `cập nhật trang CMS (ID: ${id})`);
    }
  },
  remove: async (id: string): Promise<void> => {
    await axios.delete(`${BASE}/${id}`, { headers: authHeader() })
  }
}
