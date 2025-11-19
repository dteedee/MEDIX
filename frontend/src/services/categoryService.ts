import { CategoryDTO, CreateCategoryRequest, UpdateCategoryRequest } from '../types/category.types'
import { apiClient } from '../lib/apiClient'

const BASE = '/ContentCategory'

export const categoryService = {
  list: async (page = 1, pageSize = 10, keyword?: string, sortBy?: string): Promise<{ items: CategoryDTO[]; total?: number }> => {
    const params: any = { page, pageSize };
    let url = BASE;

    if (keyword && keyword.trim()) {
      url = `${BASE}/search`;
      params.keyword = keyword;
    }

    if (sortBy) {
      params.sortBy = sortBy;
    }

    const r = await apiClient.get(url, { params });
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
    const r = await apiClient.get(`${BASE}/${id}`)
    return r.data
  },
  create: async (payload: CreateCategoryRequest): Promise<CategoryDTO> => {
    try {
      const r = await apiClient.post(BASE, payload)
      return r.data
    } catch (error: any) {
      if (error.response?.data?.errors) {
        const backendErrors = error.response.data.errors;
        console.error("Lỗi validation từ backend khi tạo danh mục:", JSON.stringify(backendErrors, null, 2));
        // Ném lại đối tượng lỗi đã được chia nhỏ để component có thể xử lý
        throw backendErrors;
      }
      // Ném lại các lỗi khác (mạng, server 500, etc.)
      throw error;
    }
  },
  update: async (id: string, payload: UpdateCategoryRequest): Promise<CategoryDTO> => {
    try {
      const r = await apiClient.put(`${BASE}/${id}`, payload);
      return r.data;
    } catch (error: any) {
      if (error.response?.data?.errors) {
        const backendErrors = error.response.data.errors;
        console.error(`Lỗi validation từ backend khi cập nhật danh mục (ID: ${id}):`, JSON.stringify(backendErrors, null, 2));
        throw backendErrors;
      }
      throw error;
    }
  },
  remove: async (id: string): Promise<void> => {
    await apiClient.delete(`${BASE}/${id}`)
  },
  checkUniqueness: async (field: 'slug' | 'name', value: string, excludeId?: string): Promise<void> => {
    const params = new URLSearchParams()
    params.append('field', field)
    params.append('value', value)
    if (excludeId) {
      params.append('excludeId', excludeId)
    }
    // This endpoint should be implemented in the backend.
    // It is expected to return a 2xx status code if the value is unique,
    // and a 4xx status code (e.g., 409 Conflict) if it's not.
    // The `axios` call will automatically throw an error for 4xx/5xx responses,
    // which is caught in the CategoryForm component.
    await apiClient.get(`${BASE}/check-uniqueness`, { params })
  }
}
