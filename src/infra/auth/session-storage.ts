/**
 * Session storage for auth tokens
 * Uses sessionStorage for "per-tab" sessions
 */

import type { AuthSession } from './types'

const SESSION_KEY = 'auth_session'

export const sessionStorage_ = {
  save: (session: AuthSession): void => {
    try {
      sessionStorage.setItem(SESSION_KEY, JSON.stringify(session))
    } catch (error) {
      console.error('Failed to save session:', error)
    }
  },

  get: (): AuthSession | null => {
    try {
      const data = sessionStorage.getItem(SESSION_KEY)
      if (!data) return null

      const session = JSON.parse(data) as AuthSession

      // Validate session has required fields
      if (!session.accessToken || !session.expiresAt) {
        sessionStorage_.clear()
        return null
      }

      return session
    } catch (error) {
      console.error('Failed to get session:', error)
      sessionStorage_.clear()
      return null
    }
  },

  clear: (): void => {
    sessionStorage.removeItem(SESSION_KEY)
  },

  isExpired: (session: AuthSession | null): boolean => {
    if (!session) return true
    // Consider expired if less than 60 seconds remaining
    const bufferMs = 60 * 1000
    return Date.now() >= session.expiresAt - bufferMs
  },

  isExpiringSoon: (session: AuthSession | null, thresholdMs = 5 * 60 * 1000): boolean => {
    if (!session) return true
    return Date.now() >= session.expiresAt - thresholdMs
  },
}
