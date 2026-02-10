/**
 * Serviço de usuários — chamadas à API via gateway.
 * Funções puras, sem uso direto do cliente HTTP.
 */

import { apiGateway } from '@/infra/http'

import type {
  CreateUserDTO,
  PaginatedResponse,
  UpdateUserDTO,
  User,
  UsersListParams,
} from '../types'

const BASE_PATH = 'users'

export const usersService = {
  list: async (params?: UsersListParams): Promise<PaginatedResponse<User>> => {
    return apiGateway.get<PaginatedResponse<User>>(BASE_PATH, {
      query: {
        page: params?.page,
        limit: params?.limit,
        search: params?.search,
        role: params?.role,
        status: params?.status,
      },
    })
  },

  getById: async (id: string): Promise<User> => {
    return apiGateway.get<User>(`${BASE_PATH}/${id}`)
  },

  create: async (data: CreateUserDTO): Promise<User> => {
    return apiGateway.post<User>(BASE_PATH, data)
  },

  update: async (id: string, data: UpdateUserDTO): Promise<User> => {
    return apiGateway.patch<User>(`${BASE_PATH}/${id}`, data)
  },

  delete: async (id: string): Promise<void> => {
    return apiGateway.delete(`${BASE_PATH}/${id}`)
  },
}
