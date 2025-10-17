import axios from 'axios'
import { CmsPageDTO, CreateCmsPageRequest, UpdateCmsPageRequest } from '../types/cmspage.types'
import { PagedResult } from '../types/common.types'

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
  list: async (page = 1, pageSize = 10, search?: string): Promise<PagedResult<CmsPageDTO>> => {
    // Redirect 'list' calls to the 'search' endpoint to ensure consistent pagination behavior.
    // The 'search' endpoint handles empty keywords by returning all items.
    return cmspageService.search(search ?? '', page, pageSize);
  },
  search: async (keyword: string, page = 1, pageSize = 10): Promise<PagedResult<CmsPageDTO>> => {
    const params: any = { page, pageSize };
    if (keyword && keyword.trim()) {
      params.keyword = keyword.trim();
    }
    const r = await axios.get(`${BASE}/search`, { params, headers: authHeader() });
    const data = r.data;
    const items: CmsPageDTO[] = data?.item2 ?? data?.items ?? [];
    const total: number = data?.item1 ?? data?.total ?? 0;
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
