/**
 * Configuração do cliente HTTP Ky.
 * Detalhe de implementação interno — os módulos devem usar api-gateway.ts.
 */

import ky from 'ky'
import type { KyInstance } from 'ky'

import { getAuthProvider } from '@/infra/auth'
import { env } from '@/infra/config/env'
import { ApiError, NetworkError } from './errors'

// Event bus for auth errors
type AuthErrorHandler = (status: 401 | 403) => void
let authErrorHandler: AuthErrorHandler | null = null

export function setAuthErrorHandler(handler: AuthErrorHandler) {
  authErrorHandler = handler
}

export const kyClient: KyInstance = ky.create({
  prefixUrl: env.apiBaseUrl,
  timeout: 30000,
  retry: {
    limit: 2,
    methods: ['get', 'head', 'options'],
    statusCodes: [408, 429, 500, 502, 503, 504],
    backoffLimit: 3000,
  },
  hooks: {
    beforeRequest: [
      async (request) => {
        // Skip auth for requests marked as public
        if (request.headers.get('X-Skip-Auth') === 'true') {
          request.headers.delete('X-Skip-Auth')
          return
        }

        const authProvider = getAuthProvider()

        try {
          // Refresh token if needed before making request
          await authProvider.refreshIfNeeded()
          const token = await authProvider.getAccessToken()

          if (token) {
            request.headers.set('Authorization', `Bearer ${token}`)
          }
        } catch (error) {
          // If refresh fails, continue without token
          // The request will likely fail with 401, which will be handled below
          console.warn('Failed to refresh token before request:', error)
        }
      },
    ],
    beforeError: [
      async (error) => {
        const { response } = error

        if (!response) {
          throw new NetworkError('Network error - please check your connection')
        }

        // Handle auth errors
        if (response.status === 401) {
          authErrorHandler?.(401)
        } else if (response.status === 403) {
          authErrorHandler?.(403)
        }

        // Parse error body
        let body: unknown
        try {
          body = await response.json()
        } catch {
          body = await response.text()
        }

        throw ApiError.fromResponse(response.status, body)
      },
    ],
  },
})

// Create a version without auth for public endpoints
export const kyPublicClient: KyInstance = ky.create({
  prefixUrl: env.apiBaseUrl,
  timeout: 30000,
  retry: {
    limit: 2,
    methods: ['get', 'head', 'options'],
    statusCodes: [408, 429, 500, 502, 503, 504],
    backoffLimit: 3000,
  },
  hooks: {
    beforeError: [
      async (error) => {
        const { response } = error

        if (!response) {
          throw new NetworkError('Network error - please check your connection')
        }

        let body: unknown
        try {
          body = await response.json()
        } catch {
          body = await response.text()
        }

        throw ApiError.fromResponse(response.status, body)
      },
    ],
  },
})
