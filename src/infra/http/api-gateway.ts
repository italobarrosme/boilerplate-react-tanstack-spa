/**
 * API Gateway - the single entry point for all HTTP calls from modules
 * Abstracts away the HTTP client implementation (Ky)
 */

import { kyClient, kyPublicClient } from './ky-client'
import type { ApiGateway, HttpMethod, RequestOptions } from './types'

function cleanQuery(
  query?: Record<string, string | number | boolean | undefined>
): Record<string, string> | undefined {
  if (!query) return undefined

  const cleaned: Record<string, string> = {}
  for (const [key, value] of Object.entries(query)) {
    if (value !== undefined) {
      cleaned[key] = String(value)
    }
  }

  return Object.keys(cleaned).length > 0 ? cleaned : undefined
}

function createGateway(): ApiGateway {
  const request = async <TResponse>(
    method: HttpMethod,
    path: string,
    options?: RequestOptions
  ): Promise<TResponse> => {
    const client = options?.skipAuth ? kyPublicClient : kyClient

    const kyOptions = {
      method,
      searchParams: cleanQuery(options?.query),
      headers: {
        ...options?.headers,
        ...(options?.skipAuth ? { 'X-Skip-Auth': 'true' } : {}),
      },
      json: options?.body,
      signal: options?.signal ?? null,
    }

    // Remove undefined json to avoid sending empty body
    if (options?.body === undefined) {
      ;(kyOptions as Record<string, unknown>).json = undefined
    }

    const response = await client(path, kyOptions)

    // Handle empty responses (204 No Content)
    if (response.status === 204) {
      return undefined as TResponse
    }

    // Try to parse JSON, fall back to text
    const contentType = response.headers.get('content-type')
    if (contentType?.includes('application/json')) {
      return response.json<TResponse>()
    }

    return (await response.text()) as TResponse
  }

  return {
    request,

    get: <TResponse>(path: string, options?: Omit<RequestOptions, 'body'>) =>
      request<TResponse>('GET', path, options),

    post: <TResponse>(path: string, body?: unknown, options?: RequestOptions) =>
      request<TResponse>('POST', path, { ...options, body }),

    put: <TResponse>(path: string, body?: unknown, options?: RequestOptions) =>
      request<TResponse>('PUT', path, { ...options, body }),

    patch: <TResponse>(path: string, body?: unknown, options?: RequestOptions) =>
      request<TResponse>('PATCH', path, { ...options, body }),

    delete: <TResponse>(path: string, options?: RequestOptions) =>
      request<TResponse>('DELETE', path, options),
  }
}

// Singleton instance
export const apiGateway = createGateway()

// Re-export types
export type { ApiGateway, HttpMethod, RequestOptions } from './types'
