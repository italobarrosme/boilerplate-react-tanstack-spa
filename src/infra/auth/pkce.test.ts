/**
 * Testes unitários dos utilitários PKCE (Proof Key for Code Exchange).
 * Valida derivação do challenge S256 e comportamento do storage.
 */

import { createHash } from 'node:crypto'
import { afterEach, beforeAll, describe, expect, it, vi } from 'vitest'

import { generateNonce, generatePKCE, generateState, pkceStorage } from './pkce'

// Base64URL encode (same algorithm as pkce.ts) for assertion
function base64UrlEncode(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer)
  let binary = ''
  for (const byte of bytes) {
    binary += String.fromCharCode(byte)
  }
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
}

function sha256Node(plain: string): ArrayBuffer {
  const hash = createHash('sha256').update(plain, 'utf8').digest()
  return hash.buffer
}

const PKCE_CHARSET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-._~'

describe('generateState', () => {
  it('returns string with 32 characters', () => {
    expect(generateState()).toHaveLength(32)
  })

  it('returns only PKCE-allowed characters', () => {
    const state = generateState()
    for (const char of state) {
      expect(PKCE_CHARSET).toContain(char)
    }
  })

  it('returns different values on each call', () => {
    expect(generateState()).not.toBe(generateState())
  })
})

describe('generateNonce', () => {
  it('returns string with 32 characters', () => {
    expect(generateNonce()).toHaveLength(32)
  })

  it('returns only PKCE-allowed characters', () => {
    const nonce = generateNonce()
    for (const char of nonce) {
      expect(PKCE_CHARSET).toContain(char)
    }
  })
})

describe('generatePKCE', () => {
  const originalCrypto = globalThis.crypto

  beforeAll(() => {
    // jsdom may not provide crypto.subtle; replace entire crypto with one that has subtle (Node-based)
    vi.stubGlobal('crypto', {
      getRandomValues: (arr: Uint8Array) => originalCrypto.getRandomValues(arr),
      randomUUID: () => originalCrypto.randomUUID?.(),
      subtle: {
        digest(_algo: string, data: ArrayBuffer | Uint8Array): Promise<ArrayBuffer> {
          const bytes = new Uint8Array(data)
          const str = new TextDecoder().decode(bytes)
          return Promise.resolve(sha256Node(str))
        },
      },
    })
  })

  it('returns codeVerifier, codeChallenge and codeChallengeMethod S256', async () => {
    const pkce = await generatePKCE()
    expect(pkce).toHaveProperty('codeVerifier')
    expect(pkce).toHaveProperty('codeChallenge')
    expect(pkce.codeChallengeMethod).toBe('S256')
  })

  it('codeVerifier has 64 characters from allowed charset', async () => {
    const pkce = await generatePKCE()
    expect(pkce.codeVerifier).toHaveLength(64)
    for (const char of pkce.codeVerifier) {
      expect(PKCE_CHARSET).toContain(char)
    }
  })

  it('codeChallenge is base64url (no +, / or padding =)', async () => {
    const pkce = await generatePKCE()
    expect(pkce.codeChallenge).not.toContain('+')
    expect(pkce.codeChallenge).not.toContain('/')
    expect(pkce.codeChallenge).not.toMatch(/=+$/)
  })

  it('codeChallenge equals BASE64URL(SHA256(codeVerifier)) per RFC 7636', async () => {
    const pkce = await generatePKCE()
    const expectedChallenge = base64UrlEncode(sha256Node(pkce.codeVerifier))
    expect(pkce.codeChallenge).toBe(expectedChallenge)
  })
})

describe('pkceStorage', () => {
  afterEach(() => {
    pkceStorage.clearAll()
  })

  it('persists and retrieves code_verifier', () => {
    expect(pkceStorage.getCodeVerifier()).toBeNull()
    pkceStorage.saveCodeVerifier('my-verifier')
    expect(pkceStorage.getCodeVerifier()).toBe('my-verifier')
    pkceStorage.clearCodeVerifier()
    expect(pkceStorage.getCodeVerifier()).toBeNull()
  })

  it('persists and retrieves state', () => {
    expect(pkceStorage.getState()).toBeNull()
    pkceStorage.saveState('my-state')
    expect(pkceStorage.getState()).toBe('my-state')
    pkceStorage.clearState()
    expect(pkceStorage.getState()).toBeNull()
  })

  it('persists and retrieves returnTo', () => {
    expect(pkceStorage.getReturnTo()).toBeNull()
    pkceStorage.saveReturnTo('/dashboard')
    expect(pkceStorage.getReturnTo()).toBe('/dashboard')
    pkceStorage.clearReturnTo()
    expect(pkceStorage.getReturnTo()).toBeNull()
  })

  it('clearAll removes all keys', () => {
    pkceStorage.saveCodeVerifier('v')
    pkceStorage.saveState('s')
    pkceStorage.saveReturnTo('/')
    pkceStorage.clearAll()
    expect(pkceStorage.getCodeVerifier()).toBeNull()
    expect(pkceStorage.getState()).toBeNull()
    expect(pkceStorage.getReturnTo()).toBeNull()
  })
})
