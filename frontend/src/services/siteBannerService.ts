import axios from 'axios'
import { SiteBannerDTO, CreateSiteBannerRequest, UpdateSiteBannerRequest } from '../types/siteBanner.types'

const BASE = '/api/SiteBanners'

function authHeader() {
  try {
    const token = localStorage.getItem('accessToken') || localStorage.getItem('token')
    return token ? { Authorization: `Bearer ${token}` } : undefined
  } catch {
    return undefined
  }
}

export const siteBannerService = {
  list: async (page = 1, pageSize = 10, search?: string): Promise<{ items: SiteBannerDTO[]; total: number }> => {
    const params: any = { page, pageSize };
    if (search) {
      params.search = search;
    }
    const r = await axios.get(BASE, { params, headers: authHeader() });
    const data = r.data;
    // Backend returns a tuple (int total, IEnumerable<data>) which is serialized to { item1, item2 }
    const items: SiteBannerDTO[] = data?.item2 ?? data?.data ?? [];
    const total: number = data?.item1 ?? data?.total ?? 0;
    return { items, total };
  },
  // Dedicated search endpoint
  search: async (name: string | undefined, page = 1, pageSize = 10): Promise<{ items: SiteBannerDTO[]; total: number }> => {
    const params: any = { page, pageSize };
    if (name) params.name = name;
    const r = await axios.get(`${BASE}/search`, { params, headers: authHeader() });
    const data = r.data;
    const items: SiteBannerDTO[] = data?.item2 ?? data?.data ?? [];
    const total: number = data?.item1 ?? data?.total ?? 0;
    return { items, total };
  },
  get: async (id: string): Promise<SiteBannerDTO> => {
    const r = await axios.get(`${BASE}/${id}`, { headers: authHeader() })
    return r.data
  },
  create: async (payload: CreateSiteBannerRequest): Promise<SiteBannerDTO> => {
    const r = await axios.post(BASE, payload, { headers: authHeader() })
    return r.data
  },
  update: async (id:string, payload: UpdateSiteBannerRequest): Promise<SiteBannerDTO> => {
    const r = await axios.put(`${BASE}/${id}`, payload, { headers: authHeader() })
    return r.data
  },
  remove: async (id: string): Promise<void> => {
    await axios.delete(`${BASE}/${id}`, { headers: authHeader() })
  }
}