import axios from 'axios'
import { BannerDTO, CreateBannerRequest, UpdateBannerRequest } from '../types/banner.types'
const BASE = '/api/SiteBanners'

function authHeader() {
  // try localStorage by default; adapt to AuthContext if available
  try {
    const token = localStorage.getItem('accessToken') || localStorage.getItem('token')
    return token ? { Authorization: `Bearer ${token}` } : undefined
  } catch {
    return undefined
  }
}

// Helper function to map API response to our DTO consistently
function mapToDTO(x: any): BannerDTO {
  return {
    id: x.id,
    title: x.bannerTitle ?? x.title ?? '',
    imageUrl: x.bannerImageUrl ?? x.imageUrl,
    link: x.bannerUrl ?? x.link,
    order: x.displayOrder ?? x.order,
    isActive: x.isActive ?? false,
    createdAt: x.createdAt,
  };
}

export const bannerService = {
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

    const r = await axios.get(url, { params: query, headers: authHeader() });
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
    const r = await axios.get(`${BASE}/${id}`, { headers: authHeader() })
    return mapToDTO(r.data)
  },
  create: async (payload: CreateBannerRequest): Promise<BannerDTO> => {
    const r = await axios.post(BASE, payload, { headers: authHeader() })
    return mapToDTO(r.data)
  },
  update: async (id: string, payload: UpdateBannerRequest): Promise<BannerDTO> => {
    const r = await axios.put(`${BASE}/${id}`, payload, { headers: authHeader() })
    return mapToDTO(r.data)
  },
  remove: async (id: string): Promise<void> => {
    await axios.delete(`${BASE}/${id}`, { headers: authHeader() })
  }
}
