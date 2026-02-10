/**
 * Store de sessão de auth com Zustand.
 * - Persiste em sessionStorage (escopo por aba, não enviado ao servidor)
 * - Valida estrutura na reidratação; limpa dados inválidos
 * - Tokens nunca são logados ou expostos fora do store
 */

import { create } from 'zustand'
import { createJSONStorage, persist } from 'zustand/middleware'
import type { AuthSession } from './types'

const STORAGE_KEY = 'auth_session'

/** Margem antes do expiry para considerar a sessão expirada (ms) */
const EXPIRY_BUFFER_MS = 60 * 1000

/** Limiar padrão para "expirando em breve" (ms) */
const EXPIRING_SOON_THRESHOLD_MS = 5 * 60 * 1000

function isValidSession(value: unknown): value is AuthSession {
  if (!value || typeof value !== 'object') return false
  const s = value as Record<string, unknown>
  if (typeof s.accessToken !== 'string' || s.accessToken.length === 0) return false
  if (typeof s.expiresAt !== 'number' || Number.isNaN(s.expiresAt)) return false
  if (!Array.isArray(s.roles)) return false
  return true
}

type AuthSessionState = {
  session: AuthSession | null
  setSession: (session: AuthSession) => void
  clearSession: () => void
}

export const useAuthSessionStore = create<AuthSessionState>()(
  persist(
    (set) => ({
      session: null,
      setSession: (session) => set({ session }),
      clearSession: () => set({ session: null }),
    }),
    {
      name: STORAGE_KEY,
      storage: createJSONStorage(() => sessionStorage),
      partialize: (state) => ({ session: state.session }),
      onRehydrateStorage: () => (state) => {
        if (state?.session && !isValidSession(state.session)) {
          useAuthSessionStore.setState({ session: null })
        }
      },
    }
  )
)

/** Helpers de sessão (puros; não logam conteúdo da sessão) */
function isExpired(session: AuthSession | null): boolean {
  if (!session) return true
  return Date.now() >= session.expiresAt - EXPIRY_BUFFER_MS
}

function isExpiringSoon(
  session: AuthSession | null,
  thresholdMs = EXPIRING_SOON_THRESHOLD_MS
): boolean {
  if (!session) return true
  return Date.now() >= session.expiresAt - thresholdMs
}

/**
 * API imperativa para o auth provider (fora do React).
 * Mesmo contrato de antes para o keycloak-auth-provider não depender de React.
 */
export const sessionStorage_ = {
  save: (session: AuthSession): void => {
    if (!isValidSession(session)) return
    try {
      useAuthSessionStore.getState().setSession(session)
    } catch {
      useAuthSessionStore.getState().clearSession()
    }
  },

  get: (): AuthSession | null => {
    try {
      const session = useAuthSessionStore.getState().session
      if (!session || !isValidSession(session)) {
        useAuthSessionStore.getState().clearSession()
        return null
      }
      return session
    } catch {
      useAuthSessionStore.getState().clearSession()
      return null
    }
  },

  clear: (): void => {
    useAuthSessionStore.getState().clearSession()
  },

  isExpired,
  isExpiringSoon,
}
