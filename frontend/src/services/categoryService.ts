import axios from 'axios'
import { CategoryDTO, CreateCategoryRequest, UpdateCategoryRequest } from '../types/category.types'

const BASE = '/api/ContentCategory'

function authHeader() {
  try {
    const token = localStorage.getItem('accessToken') || localStorage.getItem('token')
    return token ? { Authorization: `Bearer ${token}` } : undefined
  } catch {
    return undefined
  }
}

export const categoryService = {
  list: async (page = 1, pageSize = 10): Promise<{ items: CategoryDTO[]; total?: number }> => {
    const r = await axios.get(BASE, { params: { page, pageSize }, headers: authHeader() })
    const data = r.data
    const items: CategoryDTO[] = data?.item2?.map((x: any) => ({
      id: x.id,
      name: x.name,
      slug: x.slug,
      description: x.description,
      isActive: x.isActive,
      parentId: x.parentId,
      parentName: x.parentName
    })) ?? []
    const total = data?.item1
    return { items, total }
  },
  get: async (id: string): Promise<CategoryDTO> => {
    const r = await axios.get(`${BASE}/${id}`, { headers: authHeader() })
    return r.data
  },
  create: async (payload: CreateCategoryRequest): Promise<CategoryDTO> => {
    const r = await axios.post(BASE, payload, { headers: authHeader() })
    return r.data
  },
  update: async (id: string, payload: UpdateCategoryRequest): Promise<CategoryDTO> => {
    const r = await axios.put(`${BASE}/${id}`, payload, { headers: authHeader() })
    return r.data
  },
  remove: async (id: string): Promise<void> => {
    await axios.delete(`${BASE}/${id}`, { headers: authHeader() })
  }
}
