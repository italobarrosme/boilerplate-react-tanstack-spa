export { apiGateway } from './api-gateway'
export type { ApiGateway, HttpMethod, RequestOptions } from './types'
export {
  ApiError,
  ForbiddenError,
  NetworkError,
  NotFoundError,
  UnauthorizedError,
  ValidationError,
} from './errors'
export type { ApiErrorDetails } from './errors'
export { setAuthErrorHandler } from './ky-client'
