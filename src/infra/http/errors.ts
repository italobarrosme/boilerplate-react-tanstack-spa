/**
 * Tipos e tratamento de erros da API.
 */

export type ApiErrorDetails = {
  field?: string
  message: string
  code?: string
}

export class ApiError extends Error {
  readonly status: number
  readonly code: string
  readonly details?: ApiErrorDetails[] | undefined
  readonly isApiError = true

  constructor(
    message: string,
    status: number,
    code = 'UNKNOWN_ERROR',
    details?: ApiErrorDetails[]
  ) {
    super(message)
    this.name = 'ApiError'
    this.status = status
    this.code = code
    this.details = details
  }

  static isApiError(error: unknown): error is ApiError {
    return error instanceof ApiError || (error as ApiError)?.isApiError === true
  }

  static fromResponse(status: number, body?: unknown): ApiError {
    if (typeof body === 'object' && body !== null) {
      const errorBody = body as Record<string, unknown>
      return new ApiError(
        (errorBody.message as string) ?? 'An error occurred',
        status,
        (errorBody.code as string) ?? `HTTP_${status}`,
        errorBody.details as ApiErrorDetails[] | undefined
      )
    }

    return new ApiError(getDefaultMessage(status), status, `HTTP_${status}`)
  }
}

function getDefaultMessage(status: number): string {
  switch (status) {
    case 400:
      return 'Bad Request'
    case 401:
      return 'Unauthorized'
    case 403:
      return 'Forbidden'
    case 404:
      return 'Not Found'
    case 409:
      return 'Conflict'
    case 422:
      return 'Validation Error'
    case 429:
      return 'Too Many Requests'
    case 500:
      return 'Internal Server Error'
    case 502:
      return 'Bad Gateway'
    case 503:
      return 'Service Unavailable'
    default:
      return 'An error occurred'
  }
}

// Specific error types for common cases
export class UnauthorizedError extends ApiError {
  constructor(message = 'Unauthorized') {
    super(message, 401, 'UNAUTHORIZED')
  }
}

export class ForbiddenError extends ApiError {
  constructor(message = 'Forbidden') {
    super(message, 403, 'FORBIDDEN')
  }
}

export class NotFoundError extends ApiError {
  constructor(message = 'Not Found') {
    super(message, 404, 'NOT_FOUND')
  }
}

export class ValidationError extends ApiError {
  constructor(message = 'Validation Error', details?: ApiErrorDetails[]) {
    super(message, 422, 'VALIDATION_ERROR', details)
  }
}

export class NetworkError extends Error {
  readonly isNetworkError = true

  constructor(message = 'Network error') {
    super(message)
    this.name = 'NetworkError'
  }

  static isNetworkError(error: unknown): error is NetworkError {
    return error instanceof NetworkError || (error as NetworkError)?.isNetworkError === true
  }
}
