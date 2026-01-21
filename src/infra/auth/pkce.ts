/**
 * PKCE (Proof Key for Code Exchange) utilities
 * Used for OAuth2 Authorization Code Flow with PKCE
 */

function generateRandomString(length: number): string {
  const charset = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-._~'
  const randomValues = new Uint8Array(length)
  crypto.getRandomValues(randomValues)

  return Array.from(randomValues)
    .map((v) => charset[v % charset.length])
    .join('')
}

async function sha256(plain: string): Promise<ArrayBuffer> {
  const encoder = new TextEncoder()
  const data = encoder.encode(plain)
  return crypto.subtle.digest('SHA-256', data)
}

function base64UrlEncode(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer)
  let binary = ''
  for (const byte of bytes) {
    binary += String.fromCharCode(byte)
  }
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
}

export async function generatePKCE() {
  const codeVerifier = generateRandomString(64)
  const hashed = await sha256(codeVerifier)
  const codeChallenge = base64UrlEncode(hashed)

  return {
    codeVerifier,
    codeChallenge,
    codeChallengeMethod: 'S256' as const,
  }
}

export function generateState(): string {
  return generateRandomString(32)
}

export function generateNonce(): string {
  return generateRandomString(32)
}

// Storage keys for PKCE flow
const STORAGE_KEYS = {
  CODE_VERIFIER: 'auth_code_verifier',
  STATE: 'auth_state',
  NONCE: 'auth_nonce',
  RETURN_TO: 'auth_return_to',
} as const

export const pkceStorage = {
  saveCodeVerifier: (verifier: string) => {
    sessionStorage.setItem(STORAGE_KEYS.CODE_VERIFIER, verifier)
  },

  getCodeVerifier: (): string | null => {
    return sessionStorage.getItem(STORAGE_KEYS.CODE_VERIFIER)
  },

  clearCodeVerifier: () => {
    sessionStorage.removeItem(STORAGE_KEYS.CODE_VERIFIER)
  },

  saveState: (state: string) => {
    sessionStorage.setItem(STORAGE_KEYS.STATE, state)
  },

  getState: (): string | null => {
    return sessionStorage.getItem(STORAGE_KEYS.STATE)
  },

  clearState: () => {
    sessionStorage.removeItem(STORAGE_KEYS.STATE)
  },

  saveNonce: (nonce: string) => {
    sessionStorage.setItem(STORAGE_KEYS.NONCE, nonce)
  },

  getNonce: (): string | null => {
    return sessionStorage.getItem(STORAGE_KEYS.NONCE)
  },

  clearNonce: () => {
    sessionStorage.removeItem(STORAGE_KEYS.NONCE)
  },

  saveReturnTo: (returnTo: string) => {
    sessionStorage.setItem(STORAGE_KEYS.RETURN_TO, returnTo)
  },

  getReturnTo: (): string | null => {
    return sessionStorage.getItem(STORAGE_KEYS.RETURN_TO)
  },

  clearReturnTo: () => {
    sessionStorage.removeItem(STORAGE_KEYS.RETURN_TO)
  },

  clearAll: () => {
    sessionStorage.removeItem(STORAGE_KEYS.CODE_VERIFIER)
    sessionStorage.removeItem(STORAGE_KEYS.STATE)
    sessionStorage.removeItem(STORAGE_KEYS.NONCE)
    sessionStorage.removeItem(STORAGE_KEYS.RETURN_TO)
  },
}
