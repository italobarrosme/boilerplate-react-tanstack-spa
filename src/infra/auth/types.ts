/**
 * Auth types - interface-based for SSO provider abstraction
 */

export type AuthSession = {
  accessToken: string
  refreshToken?: string | undefined
  idToken?: string | undefined
  expiresAt: number // epoch ms
  user?: AuthUser | undefined
  roles: string[]
}

export type AuthUser = {
  id: string
  email: string
  name: string
  firstName?: string | undefined
  lastName?: string | undefined
}

export type AuthState = {
  isAuthenticated: boolean
  isLoading: boolean
  session: AuthSession | null
  user: AuthUser | null
  error: Error | null
}

export interface AuthProvider {
  init(): Promise<void>
  login(returnTo?: string): Promise<void>
  handleCallback(url: string): Promise<void>
  logout(): Promise<void>

  getSession(): AuthSession | null
  getAccessToken(): Promise<string | null>
  refreshIfNeeded(): Promise<void>
  isAuthenticated(): boolean
  hasRole(role: string): boolean
}

export type AuthContextValue = AuthState & {
  login: (returnTo?: string) => Promise<void>
  logout: () => Promise<void>
  hasRole: (role: string) => boolean
  getAccessToken: () => Promise<string | null>
}
