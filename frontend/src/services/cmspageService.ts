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
    const r = await axios.post(BASE, payload, { headers: authHeader() })
    return r.data
  },
  update: async (id: string, payload: UpdateCmsPageRequest): Promise<CmsPageDTO> => {
    const r = await axios.put(`${BASE}/${id}`, payload, { headers: authHeader() })
    return r.data
  },
  remove: async (id: string): Promise<void> => {
    await axios.delete(`${BASE}/${id}`, { headers: authHeader() })
  }
}
