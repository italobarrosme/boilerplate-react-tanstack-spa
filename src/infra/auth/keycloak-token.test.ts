/**
 * Testes unitários de parsing de tokens Keycloak e construção de sessão.
 * Valida buildSessionFromTokens (usado após login e após refresh).
 */

import { describe, expect, it } from 'vitest'

import { buildSessionFromTokens } from './keycloak-token'

function base64urlEncode(obj: object): string {
  const json = JSON.stringify(obj)
  const binary = Array.from(new TextEncoder().encode(json))
    .map((b) => String.fromCharCode(b))
    .join('')
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
}

function makeAccessToken(payload: Record<string, unknown>): string {
  const header = { alg: 'HS256', typ: 'JWT' }
  return `${base64urlEncode(header)}.${base64urlEncode(payload)}.signature`
}

describe('buildSessionFromTokens', () => {
  const clientId = 'test-client'

  it('sets expiresAt from expires_in (seconds to ms)', () => {
    const before = Date.now()
    const token = makeAccessToken({ sub: 'user-1', exp: Math.floor(before / 1000) + 300 })
    const session = buildSessionFromTokens(
      { access_token: token, expires_in: 120, token_type: 'Bearer' },
      clientId
    )
    const after = Date.now()
    expect(session.expiresAt).toBeGreaterThanOrEqual(before + 120_000)
    expect(session.expiresAt).toBeLessThanOrEqual(after + 120_000 + 10)
  })

  it('preserves refresh_token and id_token from response', () => {
    const token = makeAccessToken({ sub: 'u', exp: 999 })
    const session = buildSessionFromTokens(
      {
        access_token: token,
        expires_in: 60,
        token_type: 'Bearer',
        refresh_token: 'refresh-xyz',
        id_token: 'id-xyz',
      },
      clientId
    )
    expect(session.refreshToken).toBe('refresh-xyz')
    expect(session.idToken).toBe('id-xyz')
  })

  it('extracts user from access_token payload (sub, email, name)', () => {
    const token = makeAccessToken({
      sub: 'user-123',
      email: 'u@example.com',
      name: 'User Name',
      given_name: 'User',
      family_name: 'Name',
      exp: 999,
    })
    const session = buildSessionFromTokens(
      { access_token: token, expires_in: 60, token_type: 'Bearer' },
      clientId
    )
    expect(session.user?.id).toBe('user-123')
    expect(session.user?.email).toBe('u@example.com')
    expect(session.user?.name).toBe('User Name')
    expect(session.user?.firstName).toBe('User')
    expect(session.user?.lastName).toBe('Name')
  })

  it('extracts realm and client roles', () => {
    const token = makeAccessToken({
      sub: 'u',
      exp: 999,
      realm_access: { roles: ['realm-role'] },
      resource_access: { [clientId]: { roles: ['client-role'] } },
    })
    const session = buildSessionFromTokens(
      { access_token: token, expires_in: 60, token_type: 'Bearer' },
      clientId
    )
    expect(session.roles).toContain('realm-role')
    expect(session.roles).toContain('client-role')
  })

  it('throws on invalid token format', () => {
    expect(() =>
      buildSessionFromTokens(
        { access_token: 'not-three-parts', expires_in: 60, token_type: 'Bearer' },
        clientId
      )
    ).toThrow('Invalid token format')
  })
})
