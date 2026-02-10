/**
 * Context e Provider de auth para React.
 * Expõe estado e métodos de auth para a aplicação.
 */

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import type { ReactNode } from 'react'

import { getAuthProvider } from './keycloak-auth-provider'
import type { AuthContextValue, AuthState, AuthUser } from './types'

const AuthContext = createContext<AuthContextValue | null>(null)

type AuthProviderProps = {
  children: ReactNode
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [state, setState] = useState<AuthState>({
    isAuthenticated: false,
    isLoading: true,
    session: null,
    user: null,
    error: null,
  })

  const authProvider = useMemo(() => getAuthProvider(), [])

  // Initialize auth on mount
  useEffect(() => {
    const initialize = async () => {
      try {
        await authProvider.init()
        const session = authProvider.getSession()

        setState({
          isAuthenticated: authProvider.isAuthenticated(),
          isLoading: false,
          session,
          user: session?.user ?? null,
          error: null,
        })
      } catch (error) {
        setState({
          isAuthenticated: false,
          isLoading: false,
          session: null,
          user: null,
          error: error instanceof Error ? error : new Error('Auth initialization failed'),
        })
      }
    }

    initialize()
  }, [authProvider])

  const login = useCallback(
    async (returnTo?: string) => {
      setState((prev) => ({ ...prev, isLoading: true, error: null }))
      try {
        await authProvider.login(returnTo)
      } catch (error) {
        setState((prev) => ({
          ...prev,
          isLoading: false,
          error: error instanceof Error ? error : new Error('Login failed'),
        }))
      }
    },
    [authProvider]
  )

  const logout = useCallback(async () => {
    setState((prev) => ({ ...prev, isLoading: true, error: null }))
    try {
      await authProvider.logout()
    } catch (error) {
      setState((prev) => ({
        ...prev,
        isLoading: false,
        error: error instanceof Error ? error : new Error('Logout failed'),
      }))
    }
  }, [authProvider])

  const hasRole = useCallback(
    (role: string) => {
      return authProvider.hasRole(role)
    },
    [authProvider]
  )

  const getAccessToken = useCallback(async () => {
    return authProvider.getAccessToken()
  }, [authProvider])

  const value = useMemo<AuthContextValue>(
    () => ({
      ...state,
      login,
      logout,
      hasRole,
      getAccessToken,
    }),
    [state, login, logout, hasRole, getAccessToken]
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}

// Hook for handling auth callback
export function useAuthCallback() {
  const authProvider = getAuthProvider()

  const handleCallback = useCallback(
    async (url: string) => {
      await authProvider.handleCallback(url)
    },
    [authProvider]
  )

  return { handleCallback }
}

// Export for router context
export { getAuthProvider }
export type { AuthUser }
