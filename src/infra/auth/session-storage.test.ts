/**
 * Testes unitários dos helpers de session storage (expiry e lógica de "expirando em breve").
 * Usados pelo auth provider para decidir quando dar refresh no access token.
 */

import { afterEach, describe, expect, it } from 'vitest'

import { sessionStorage_ } from './session-storage'
import type { AuthSession } from './types'

function makeSession(expiresAt: number): AuthSession {
  return {
    accessToken: 'eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOiJ0ZXN0In0.x',
    expiresAt,
    roles: [],
  }
}

describe('sessionStorage_.isExpired', () => {
  it('returns true when session is null', () => {
    expect(sessionStorage_.isExpired(null)).toBe(true)
  })

  it('returns true when current time is past expiresAt minus buffer (~60s)', () => {
    const now = Date.now()
    const session = makeSession(now + 30_000) // expires in 30s
    expect(sessionStorage_.isExpired(session)).toBe(true)
  })

  it('returns false when session has not reached expiry buffer', () => {
    const now = Date.now()
    const session = makeSession(now + 120_000) // expires in 2min
    expect(sessionStorage_.isExpired(session)).toBe(false)
  })
})

describe('sessionStorage_.isExpiringSoon', () => {
  it('returns true when session is null', () => {
    expect(sessionStorage_.isExpiringSoon(null)).toBe(true)
  })

  it('returns true when within default threshold (5 min) of expiry', () => {
    const now = Date.now()
    const session = makeSession(now + 2 * 60 * 1000) // expires in 2 min
    expect(sessionStorage_.isExpiringSoon(session)).toBe(true)
  })

  it('returns false when well before expiry', () => {
    const now = Date.now()
    const session = makeSession(now + 15 * 60 * 1000) // expires in 15 min
    expect(sessionStorage_.isExpiringSoon(session)).toBe(false)
  })

  it('respects custom threshold', () => {
    const now = Date.now()
    const session = makeSession(now + 10 * 60 * 1000) // expires in 10 min
    expect(sessionStorage_.isExpiringSoon(session, 5 * 60 * 1000)).toBe(false)
    expect(sessionStorage_.isExpiringSoon(session, 15 * 60 * 1000)).toBe(true)
  })
})

describe('sessionStorage_ save/get/clear', () => {
  afterEach(() => {
    sessionStorage_.clear()
  })

  it('persists valid session and returns it', () => {
    const session = makeSession(Date.now() + 600_000)
    sessionStorage_.save(session)
    expect(sessionStorage_.get()).toEqual(session)
  })

  it('clear removes session', () => {
    sessionStorage_.save(makeSession(Date.now() + 600_000))
    sessionStorage_.clear()
    expect(sessionStorage_.get()).toBeNull()
  })
})
