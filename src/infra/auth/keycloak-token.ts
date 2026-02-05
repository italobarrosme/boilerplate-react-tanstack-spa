import type { AuthSession, AuthUser } from './types'

export type KeycloakTokenResponse = {
  access_token: string
  refresh_token?: string
  id_token?: string
  expires_in: number
  token_type: string
}

export type KeycloakTokenPayload = {
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

function decodeJwtPayload(token: string): KeycloakTokenPayload {
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

function extractRoles(payload: KeycloakTokenPayload, clientId: string): string[] {
  const roles: string[] = []

  if (payload.realm_access?.roles) {
    roles.push(...payload.realm_access.roles)
  }

  if (payload.resource_access?.[clientId]?.roles) {
    roles.push(...payload.resource_access[clientId].roles)
  }

  return [...new Set(roles)]
}

function extractUser(payload: KeycloakTokenPayload): AuthUser {
  return {
    id: payload.sub,
    email: payload.email ?? payload.preferred_username ?? '',
    name: payload.name ?? payload.preferred_username ?? '',
    firstName: payload.given_name,
    lastName: payload.family_name,
  }
}

export function buildSessionFromTokens(
  tokens: KeycloakTokenResponse,
  clientId: string
): AuthSession {
  const payload = decodeJwtPayload(tokens.access_token)

  return {
    accessToken: tokens.access_token,
    refreshToken: tokens.refresh_token,
    idToken: tokens.id_token,
    expiresAt: Date.now() + tokens.expires_in * 1000,
    user: extractUser(payload),
    roles: extractRoles(payload, clientId),
  }
}
