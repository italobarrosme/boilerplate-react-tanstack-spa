/**
 * HTTP types for the API Gateway abstraction
 */

export type HttpMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE'

export type RequestOptions = {
  query?: Record<string, string | number | boolean | undefined>
  headers?: Record<string, string>
  body?: unknown
  signal?: AbortSignal
  /** Skip auth token attachment */
  skipAuth?: boolean
}

export interface ApiGateway {
  request<TResponse>(method: HttpMethod, path: string, options?: RequestOptions): Promise<TResponse>

  // Convenience methods
  get<TResponse>(path: string, options?: Omit<RequestOptions, 'body'>): Promise<TResponse>
  post<TResponse>(path: string, body?: unknown, options?: RequestOptions): Promise<TResponse>
  put<TResponse>(path: string, body?: unknown, options?: RequestOptions): Promise<TResponse>
  patch<TResponse>(path: string, body?: unknown, options?: RequestOptions): Promise<TResponse>
  delete<TResponse>(path: string, options?: RequestOptions): Promise<TResponse>
}
