import axios from 'axios'
import { UserDTO, CreateUserRequest, UpdateUserRequest } from '../types/user.types'

const BASE = '/api/User'

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
    const params: any = { page, pageSize }
    if (search) params.search = search
    const r = await axios.get(BASE, { params, headers: authHeader() })
    const data = r.data
    const items: UserDTO[] = data?.data?.map((x: any) => ({
      id: x.id,
      email: x.email,
      fullName: x.fullName,
      phoneNumber: x.phoneNumber,
      role: x.role,
      emailConfirmed: x.emailConfirmed,
      createdAt: x.createdAt
    })) ?? []
    const total = data?.total
    return { items, total }
  },
  // search endpoint returns an array of matching users (no pagination)
  search: async (term: string): Promise<UserDTO[]> => {
    const params: any = {}
    if (term) params.search = term
    const r = await axios.get(`${BASE}/search`, { params, headers: authHeader() })
    // backend returns an array of user objects
    return r.data as UserDTO[]
  },
  get: async (id: string): Promise<UserDTO> => {
    const r = await axios.get(`${BASE}/${id}`, { headers: authHeader() })
    return r.data
  },
  create: async (payload: CreateUserRequest): Promise<UserDTO> => {
    const r = await axios.post(BASE, payload, { headers: authHeader() })
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
