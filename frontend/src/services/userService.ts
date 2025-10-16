import axios from 'axios'
import { UserDTO, CreateUserRequest, UpdateUserRequest } from '../types/user.types'

const BASE = '/api/User' // Base path for user-related actions

function authHeader() {
  try {
    const token = localStorage.getItem('accessToken') || localStorage.getItem('token')
    return token ? { Authorization: `Bearer ${token}` } : undefined
  } catch {
    return undefined
  }
}

export const userService = {
  list: async (page = 1, pageSize = 10, search?: string): Promise<{ items: UserDTO[]; total?: number }> => {
    let response;
    const params: any = { page, pageSize };

    if (search && search.trim()) {
      // Use the new search endpoint when a search keyword is provided
      params.keyword = search;
      response = await axios.get(`${BASE}/search`, { params, headers: authHeader() });
    } else {
      // Fallback to the general paged list endpoint
      response = await axios.get(BASE, { params, headers: authHeader() });
    }

    const data = response.data;
    // Backend returns a Tuple (Item1: total, Item2: data)
    const items: UserDTO[] = data?.item2 ?? [];
    const total: number | undefined = data?.item1;
    return { items, total }
  },
  get: async (id: string): Promise<UserDTO> => {
    const r = await axios.get(`${BASE}/${id}`, { headers: authHeader() })
    return r.data
  },
  create: async (payload: CreateUserRequest): Promise<UserDTO> => {
    const r = await axios.post(BASE, payload, { headers: authHeader() });
    return r.data
  },
  update: async (id: string, payload: UpdateUserRequest): Promise<UserDTO> => {
    const r = await axios.put(`${BASE}/${id}`, payload, { headers: authHeader() })
    return r.data
  },
  remove: async (id: string): Promise<void> => {
    await axios.delete(`${BASE}/${id}`, { headers: authHeader() })
  }
}
