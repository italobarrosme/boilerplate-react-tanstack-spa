/**
 * Helpers para requisições de token e URLs do Keycloak.
 * Usados pelo keycloak-auth-provider.
 */

import { env } from '@/infra/config/env'
import type { KeycloakTokenResponse } from './keycloak-token'

/** Header Basic Auth para cliente público (client_id com secret vazio) — exigido por algumas versões do Keycloak */
export function basicAuthHeader(clientId: string): string {
  return `Basic ${btoa(`${clientId}:`)}`
}

export type TokenRequestParams = {
  grant_type: 'authorization_code' | 'refresh_token'
  code?: string
  redirect_uri?: string
  code_verifier?: string
  refresh_token?: string
}

export function buildTokenBody(clientId: string, params: TokenRequestParams): URLSearchParams {
  const body = new URLSearchParams({ grant_type: params.grant_type, client_id: clientId })

  if (params.code) body.set('code', params.code)
  if (params.redirect_uri) body.set('redirect_uri', params.redirect_uri)
  if (params.code_verifier) body.set('code_verifier', params.code_verifier)
  if (params.refresh_token) body.set('refresh_token', params.refresh_token)

  return body
}

/**
 * Troca authorization code por tokens ou renova usando refresh_token.
 *
 * @param endpoint - URL do endpoint /protocol/openid-connect/token
 * @param clientId - Client ID do Keycloak
 * @param params - Parâmetros do grant (code + code_verifier ou refresh_token)
 * @returns Resposta com access_token, refresh_token, etc.
 */
export async function requestTokens(
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
export function getKeycloakBaseUrlForRedirect(): string {
  return env.keycloak.url
}

/** URL base para fetch (token, refresh). Em dev com proxy, usa o proxy para evitar CORS. */
export function getKeycloakBaseUrlForFetch(): string {
  const { url, proxyPath } = env.keycloak
  if (env.isDev && proxyPath && typeof window !== 'undefined') {
    return `${window.location.origin}${proxyPath}`
  }
  return url
}
