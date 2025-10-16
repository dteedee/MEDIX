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
  list: async (page = 1, pageSize = 10, search?: string): Promise<{ items: CmsPageDTO[]; total: number }> => {
    const params: any = { page, pageSize };
    if (search) {
      params.search = search;
    }
    const r = await axios.get(BASE, { params, headers: authHeader() });
    const data = r.data;
    // Backend returns a tuple (int total, IEnumerable<data>) which is serialized to { item1, item2 }
    const items: CmsPageDTO[] = data?.item2 ?? [];
    const total: number = data?.item1 ?? 0;
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
