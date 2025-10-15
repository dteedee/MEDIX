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
  list: async (): Promise<CmsPageDTO[]> => {
    const r = await axios.get(BASE, { headers: authHeader() })
    return r.data as CmsPageDTO[]
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
