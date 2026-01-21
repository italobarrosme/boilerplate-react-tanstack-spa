/**
 * Keycloak OIDC Auth Provider implementation
 * Implements Authorization Code Flow with PKCE
 */

import { env } from '@/infra/config/env'
import { generateNonce, generatePKCE, generateState, pkceStorage } from './pkce'
import { sessionStorage_ } from './session-storage'
import type { AuthProvider, AuthSession, AuthUser } from './types'

type TokenResponse = {
  access_token: string
  refresh_token?: string
  id_token?: string
  expires_in: number
  token_type: string
}

type TokenPayload = {
  sub: string
  email?: string
  name?: string
  given_name?: string
  family_name?: string
  preferred_username?: string
  realm_access?: {
    roles?: string[]
  }
  resource_access?: Record<
    string,
    {
      roles?: string[]
    }
  >
  exp: number
}

function decodeJwtPayload(token: string): TokenPayload {
  const base64Url = token.split('.')[1]
  if (!base64Url) throw new Error('Invalid token format')

  const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/')
  const jsonPayload = decodeURIComponent(
    atob(base64)
      .split('')
      .map((c) => `%${`00${c.charCodeAt(0).toString(16)}`.slice(-2)}`)
      .join('')
  )

  return JSON.parse(jsonPayload)
}

function extractRoles(payload: TokenPayload, clientId: string): string[] {
  const roles: string[] = []

  // Realm roles
  if (payload.realm_access?.roles) {
    roles.push(...payload.realm_access.roles)
  }

  // Client-specific roles
  if (payload.resource_access?.[clientId]?.roles) {
    roles.push(...payload.resource_access[clientId].roles)
  }

  return [...new Set(roles)]
}

function extractUser(payload: TokenPayload): AuthUser {
  return {
    id: payload.sub,
    email: payload.email ?? payload.preferred_username ?? '',
    name: payload.name ?? payload.preferred_username ?? '',
    firstName: payload.given_name,
    lastName: payload.family_name,
  }
}

export function createKeycloakAuthProvider(): AuthProvider {
  const { url, realm, clientId } = env.keycloak
  const { redirectUri, postLogoutRedirectUri } = env.auth

  const baseUrl = `${url}/realms/${realm}/protocol/openid-connect`

  let currentSession: AuthSession | null = null
  let refreshPromise: Promise<void> | null = null

  const provider: AuthProvider = {
    async init(): Promise<void> {
      // Load session from storage
      const stored = sessionStorage_.get()

      if (stored) {
        if (sessionStorage_.isExpired(stored)) {
          // Try to refresh if we have a refresh token
          if (stored.refreshToken) {
            try {
              await provider.refreshIfNeeded()
              return
            } catch {
              sessionStorage_.clear()
            }
          } else {
            sessionStorage_.clear()
          }
        } else {
          currentSession = stored
        }
      }
    },

    async login(returnTo?: string): Promise<void> {
      const pkce = await generatePKCE()
      const state = generateState()
      const nonce = generateNonce()

      // Store PKCE values
      pkceStorage.saveCodeVerifier(pkce.codeVerifier)
      pkceStorage.saveState(state)
      pkceStorage.saveNonce(nonce)

      if (returnTo) {
        pkceStorage.saveReturnTo(returnTo)
      }

      // Build authorization URL
      const params = new URLSearchParams({
        response_type: 'code',
        client_id: clientId,
        redirect_uri: redirectUri,
        scope: 'openid profile email',
        state,
        nonce,
        code_challenge: pkce.codeChallenge,
        code_challenge_method: pkce.codeChallengeMethod,
      })

      window.location.href = `${baseUrl}/auth?${params.toString()}`
    },

    async handleCallback(url: string): Promise<void> {
      const urlParams = new URLSearchParams(new URL(url).search)
      const code = urlParams.get('code')
      const state = urlParams.get('state')
      const error = urlParams.get('error')
      const errorDescription = urlParams.get('error_description')

      if (error) {
        pkceStorage.clearAll()
        throw new Error(errorDescription ?? error)
      }

      if (!code || !state) {
        pkceStorage.clearAll()
        throw new Error('Missing code or state in callback')
      }

      // Validate state
      const savedState = pkceStorage.getState()
      if (state !== savedState) {
        pkceStorage.clearAll()
        throw new Error('State mismatch - possible CSRF attack')
      }

      // Get code verifier
      const codeVerifier = pkceStorage.getCodeVerifier()
      if (!codeVerifier) {
        pkceStorage.clearAll()
        throw new Error('Missing code verifier')
      }

      // Exchange code for tokens
      const tokenResponse = await fetch(`${baseUrl}/token`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
          grant_type: 'authorization_code',
          client_id: clientId,
          code,
          redirect_uri: redirectUri,
          code_verifier: codeVerifier,
        }),
      })

      if (!tokenResponse.ok) {
        pkceStorage.clearAll()
        const errorBody = await tokenResponse.text()
        throw new Error(`Token exchange failed: ${errorBody}`)
      }

      const tokens: TokenResponse = await tokenResponse.json()

      // Parse token to extract user info and roles
      const payload = decodeJwtPayload(tokens.access_token)

      // Create session
      currentSession = {
        accessToken: tokens.access_token,
        refreshToken: tokens.refresh_token,
        idToken: tokens.id_token,
        expiresAt: Date.now() + tokens.expires_in * 1000,
        user: extractUser(payload),
        roles: extractRoles(payload, clientId),
      }

      // Save session
      if (currentSession) {
        sessionStorage_.save(currentSession)
      }

      // Clean up PKCE storage (but keep returnTo for redirect)
      pkceStorage.clearCodeVerifier()
      pkceStorage.clearState()
      pkceStorage.clearNonce()
    },

    async logout(): Promise<void> {
      const idToken = currentSession?.idToken

      // Clear local session
      currentSession = null
      sessionStorage_.clear()
      pkceStorage.clearAll()

      // Build logout URL
      const params = new URLSearchParams({
        post_logout_redirect_uri: postLogoutRedirectUri,
      })

      if (idToken) {
        params.set('id_token_hint', idToken)
      }

      window.location.href = `${baseUrl}/logout?${params.toString()}`
    },

    getSession(): AuthSession | null {
      return currentSession
    },

    async getAccessToken(): Promise<string | null> {
      await provider.refreshIfNeeded()
      return currentSession?.accessToken ?? null
    },

    async refreshIfNeeded(): Promise<void> {
      // Prevent multiple concurrent refresh requests
      if (refreshPromise) {
        return refreshPromise
      }

      if (!currentSession?.refreshToken) {
        return
      }

      if (!sessionStorage_.isExpiringSoon(currentSession)) {
        return
      }

      refreshPromise = (async () => {
        try {
          const response = await fetch(`${baseUrl}/token`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/x-www-form-urlencoded',
            },
            body: new URLSearchParams({
              grant_type: 'refresh_token',
              client_id: clientId,
              refresh_token: currentSession?.refreshToken ?? '',
            }),
          })

          if (!response.ok) {
            throw new Error('Refresh token failed')
          }

          const tokens: TokenResponse = await response.json()
          const payload = decodeJwtPayload(tokens.access_token)

          currentSession = {
            accessToken: tokens.access_token,
            refreshToken: tokens.refresh_token ?? currentSession?.refreshToken,
            idToken: tokens.id_token ?? currentSession?.idToken,
            expiresAt: Date.now() + tokens.expires_in * 1000,
            user: extractUser(payload),
            roles: extractRoles(payload, clientId),
          }

          if (currentSession) {
            sessionStorage_.save(currentSession)
          }
        } catch (error) {
          // Refresh failed - clear session
          currentSession = null
          sessionStorage_.clear()
          throw error
        } finally {
          refreshPromise = null
        }
      })()

      return refreshPromise
    },

    isAuthenticated(): boolean {
      return currentSession !== null && !sessionStorage_.isExpired(currentSession)
    },

    hasRole(role: string): boolean {
      return currentSession?.roles.includes(role) ?? false
    },
  }

  return provider
}

// Singleton instance
let authProviderInstance: AuthProvider | null = null

export function getAuthProvider(): AuthProvider {
  if (!authProviderInstance) {
    authProviderInstance = createKeycloakAuthProvider()
  }
  return authProviderInstance
}
