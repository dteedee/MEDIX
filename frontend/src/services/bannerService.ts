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

export const bannerService = {
  list: async (page = 1, pageSize = 10): Promise<{ items: BannerDTO[]; total?: number }> => {
    const r = await axios.get(BASE, { params: { page, pageSize }, headers: authHeader() })
    const data = r.data

    // Accept multiple response shapes from backend:
    // 1) { total: number, data: [...] } (named tuple)
    // 2) { item1: number, item2: [...] } (legacy)
    // 3) [...] (direct array)

    const rawItems = Array.isArray(data)
      ? data
      : data?.data ?? data?.item2 ?? []

    const items: BannerDTO[] = (rawItems || []).map((x: any) => ({
      id: x.id,
      title: x.bannerTitle ?? x.bannerTitle ?? x.title ?? '',
      imageUrl: x.bannerImageUrl ?? x.bannerImageUrl ?? x.imageUrl ?? undefined,
      link: x.bannerUrl ?? x.bannerUrl ?? x.link ?? undefined,
      order: x.displayOrder ?? x.displayOrder ?? x.order ?? undefined,
      isActive: x.isActive ?? false,
      createdAt: x.createdAt ?? undefined
    }))

    const total = data?.total ?? data?.item1 ?? undefined
    return { items, total }
  },
  get: async (id: string): Promise<BannerDTO> => {
    const r = await axios.get(`${BASE}/${id}`, { headers: authHeader() })
    const x = r.data
    return {
      id: x.id,
      title: x.bannerTitle,
      imageUrl: x.bannerImageUrl,
      link: x.bannerUrl,
      order: x.displayOrder,
      isActive: x.isActive,
      createdAt: x.createdAt
    }
  },
  create: async (payload: CreateBannerRequest): Promise<BannerDTO> => {
    const r = await axios.post(BASE, payload, { headers: authHeader() })
    const x = r.data
    return {
      id: x.id,
      title: x.bannerTitle,
      imageUrl: x.bannerImageUrl,
      link: x.bannerUrl,
      order: x.displayOrder,
      isActive: x.isActive,
      createdAt: x.createdAt
    }
  },
  update: async (id: string, payload: UpdateBannerRequest): Promise<BannerDTO> => {
    const r = await axios.put(`${BASE}/${id}`, payload, { headers: authHeader() })
    const x = r.data
    return {
      id: x.id,
      title: x.bannerTitle,
      imageUrl: x.bannerImageUrl,
      link: x.bannerUrl,
      order: x.displayOrder,
      isActive: x.isActive,
      createdAt: x.createdAt
    }
  },
  remove: async (id: string): Promise<void> => {
    await axios.delete(`${BASE}/${id}`, { headers: authHeader() })
  }
}
