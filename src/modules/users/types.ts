/**
 * Users module types
 */

export type User = {
  id: string
  email: string
  name: string
  firstName?: string
  lastName?: string
  role: UserRole
  status: UserStatus
  createdAt: string
  updatedAt: string
}

export type UserRole = 'admin' | 'manager' | 'user'

export type UserStatus = 'active' | 'inactive' | 'pending'

export type CreateUserDTO = {
  email: string
  name: string
  firstName?: string
  lastName?: string
  role: UserRole
}

export type UpdateUserDTO = Partial<CreateUserDTO> & {
  status?: UserStatus
}

export type UsersListParams = {
  page?: number | undefined
  limit?: number | undefined
  search?: string | undefined
  role?: UserRole | undefined
  status?: UserStatus | undefined
}

export type PaginatedResponse<T> = {
  data: T[]
  meta: {
    page: number
    limit: number
    total: number
    totalPages: number
  }
}
