/**
 * Implementação do Auth Provider OIDC com Keycloak.
 * Implementa o fluxo Authorization Code com PKCE.
 */

import { env } from '@/infra/config/env'
import {
  getKeycloakBaseUrlForFetch,
  getKeycloakBaseUrlForRedirect,
  requestTokens,
} from './keycloak-auth-helpers'
import { type KeycloakTokenResponse, buildSessionFromTokens } from './keycloak-token'
import { generateNonce, generatePKCE, generateState, pkceStorage } from './pkce'
import { sessionStorage_ } from './session-storage'
import type { AuthProvider, AuthSession } from './types'

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
    // biome-ignore lint/complexity/noExcessiveCognitiveComplexity: <explanation>
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
