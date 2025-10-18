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
  list: async (page = 1, pageSize = 10, keyword?: string): Promise<{ items: CategoryDTO[]; total?: number }> => {
    const params: any = { page, pageSize };
    let url = BASE;

    if (keyword && keyword.trim()) {
      url = `${BASE}/search`;
      params.keyword = keyword;
    }

    const r = await axios.get(url, { params, headers: authHeader() });
    const data = r.data;

    // Handle multiple response shapes from backend (direct array, or paged object)
    const rawItems = Array.isArray(data)
      ? data
      : data?.data ?? data?.item2 ?? [];

    const items: CategoryDTO[] = (rawItems || []).map((x: any) => ({
      id: x.id,
      name: x.name,
      slug: x.slug,
      description: x.description,
      isActive: x.isActive,
      parentId: x.parentId,
      parentName: x.parentName
    }));

    const total = data?.total ?? data?.item1 ?? (Array.isArray(data) ? data.length : undefined);
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
