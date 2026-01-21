/**
 * TanStack Query client configuration
 */

import { QueryClient } from '@tanstack/react-query'

import { ApiError } from '@/infra/http'

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // Stale time: how long data is considered fresh
      staleTime: 1000 * 60 * 5, // 5 minutes

      // Cache time: how long inactive data stays in cache
      gcTime: 1000 * 60 * 30, // 30 minutes

      // Retry configuration
      retry: (failureCount, error) => {
        // Don't retry on auth errors
        if (ApiError.isApiError(error) && (error.status === 401 || error.status === 403)) {
          return false
        }

        // Don't retry on client errors (4xx except network issues)
        if (ApiError.isApiError(error) && error.status >= 400 && error.status < 500) {
          return false
        }

        // Retry up to 3 times for other errors
        return failureCount < 3
      },

      // Retry delay with exponential backoff
      retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),

      // Don't refetch on window focus in development
      refetchOnWindowFocus: import.meta.env.PROD,

      // Refetch on reconnect
      refetchOnReconnect: true,
    },
    mutations: {
      // Don't retry mutations by default
      retry: false,

      // Handle errors globally
      onError: (error) => {
        // Log mutation errors
        console.error('Mutation error:', error)
      },
    },
  },
})

// Query key factory helpers
export const queryKeys = {
  // Auth
  auth: {
    all: ['auth'] as const,
    session: () => [...queryKeys.auth.all, 'session'] as const,
    user: () => [...queryKeys.auth.all, 'user'] as const,
  },

  // Users module
  users: {
    all: ['users'] as const,
    lists: () => [...queryKeys.users.all, 'list'] as const,
    list: (params?: Record<string, unknown>) => [...queryKeys.users.lists(), params ?? {}] as const,
    details: () => [...queryKeys.users.all, 'detail'] as const,
    detail: (id: string) => [...queryKeys.users.details(), id] as const,
  },

  // Billing module
  billing: {
    all: ['billing'] as const,
    invoices: {
      all: () => [...queryKeys.billing.all, 'invoices'] as const,
      list: (params?: Record<string, unknown>) =>
        [...queryKeys.billing.invoices.all(), 'list', params ?? {}] as const,
      detail: (id: string) => [...queryKeys.billing.invoices.all(), 'detail', id] as const,
    },
  },

  // Reports module
  reports: {
    all: ['reports'] as const,
    list: (params?: Record<string, unknown>) =>
      [...queryKeys.reports.all, 'list', params ?? {}] as const,
    detail: (id: string) => [...queryKeys.reports.all, 'detail', id] as const,
  },
} as const

// Export for use in modules
export type QueryKeys = typeof queryKeys
