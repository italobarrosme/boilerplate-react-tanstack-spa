/**
 * Keycloak OIDC Auth Provider implementation
 * Implements Authorization Code Flow with PKCE
 */

import { env } from '@/infra/config/env'
import { generateNonce, generatePKCE, generateState, pkceStorage } from './pkce'
import { sessionStorage_ } from './session-storage'
import { buildSessionFromTokens, type KeycloakTokenResponse } from './keycloak-token'
import type { AuthProvider, AuthSession } from './types'

/** Basic auth header for public client (client_id with empty secret) - required by some Keycloak versions */
function basicAuthHeader(clientId: string): string {
  return `Basic ${btoa(`${clientId}:`)}`
}

type TokenRequestParams = {
  grant_type: 'authorization_code' | 'refresh_token'
  code?: string
  redirect_uri?: string
  code_verifier?: string
  refresh_token?: string
}

function buildTokenBody(clientId: string, params: TokenRequestParams): URLSearchParams {
  const body = new URLSearchParams({ grant_type: params.grant_type, client_id: clientId })

  if (params.code) body.set('code', params.code)
  if (params.redirect_uri) body.set('redirect_uri', params.redirect_uri)
  if (params.code_verifier) body.set('code_verifier', params.code_verifier)
  if (params.refresh_token) body.set('refresh_token', params.refresh_token)

  return body
}

async function requestTokens(
  endpoint: string,
  clientId: string,
  params: TokenRequestParams
): Promise<KeycloakTokenResponse> {
  const response = await fetch(endpoint, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      Authorization: basicAuthHeader(clientId),
    },
    body: buildTokenBody(clientId, params),
  })

  if (!response.ok) {
    const errorBody = await response.text()
    throw new Error(`Token request failed: ${errorBody || response.statusText}`)
  }

  return response.json()
}

/** URL base para redirects (login/logout). Sempre a URL real do Keycloak para a página de login carregar corretamente (CSS/JS do tema). */
function getKeycloakBaseUrlForRedirect(): string {
  return env.keycloak.url
}

/** URL base para fetch (token, refresh). Em dev com proxy, usa o proxy para evitar CORS. */
function getKeycloakBaseUrlForFetch(): string {
  const { url, proxyPath } = env.keycloak
  if (env.isDev && proxyPath && typeof window !== 'undefined') {
    return `${window.location.origin}${proxyPath}`
  }
  return url
}

export function createKeycloakAuthProvider(): AuthProvider {
  const { realm, clientId } = env.keycloak
  const { redirectUri, postLogoutRedirectUri } = env.auth

  const baseForRedirect = getKeycloakBaseUrlForRedirect()
  const baseForFetch = getKeycloakBaseUrlForFetch()

  const realmBaseRedirect = `${baseForRedirect}/realms/${realm}`
  const realmBaseFetch = `${baseForFetch}/realms/${realm}`

  const authEndpoint = `${realmBaseRedirect}/protocol/openid-connect/auth`
  const tokenEndpoint = `${realmBaseFetch}/protocol/openid-connect/token`
  const logoutEndpoint = `${realmBaseRedirect}/protocol/openid-connect/logout`

  let currentSession: AuthSession | null = null
  let refreshPromise: Promise<void> | null = null

  const persistSession = (tokens: KeycloakTokenResponse): void => {
    const session = buildSessionFromTokens(tokens, clientId)

    if (currentSession) {
      session.refreshToken = session.refreshToken ?? currentSession.refreshToken
      session.idToken = session.idToken ?? currentSession.idToken
    }

    currentSession = session
    sessionStorage_.save(session)
  }

  const clearSession = (): void => {
    currentSession = null
    sessionStorage_.clear()
  }

  const clearPkce = (): void => {
    pkceStorage.clearCodeVerifier()
    pkceStorage.clearState()
    pkceStorage.clearNonce()
  }

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
              clearSession()
            }
          } else {
            clearSession()
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

      window.location.href = `${authEndpoint}?${params.toString()}`
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
      const tokens = await requestTokens(tokenEndpoint, clientId, {
        grant_type: 'authorization_code',
        code,
        redirect_uri: redirectUri,
        code_verifier: codeVerifier,
      })

      persistSession(tokens)

      // Clean up PKCE storage (but keep returnTo for redirect)
      clearPkce()
    },

    async logout(): Promise<void> {
      const idToken = currentSession?.idToken

      // Clear local session
      clearSession()
      pkceStorage.clearAll()

      // Build logout URL
      const params = new URLSearchParams({
        post_logout_redirect_uri: postLogoutRedirectUri,
      })

      if (idToken) {
        params.set('id_token_hint', idToken)
      }

      window.location.href = `${logoutEndpoint}?${params.toString()}`
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

      const refreshToken = currentSession.refreshToken

      refreshPromise = (async () => {
        try {
          const tokens = await requestTokens(tokenEndpoint, clientId, {
            grant_type: 'refresh_token',
            refresh_token: refreshToken,
          })

          persistSession(tokens)
        } catch (error) {
          clearSession()
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
