/**
 * Environment variables with runtime validation
 * All VITE_* variables are exposed to the client
 */

function getEnvVar(key: string, required = true): string {
  const value = import.meta.env[key]

  if (required && !value) {
    throw new Error(`Missing required environment variable: ${key}`)
  }

  return (value ?? '') as string
}

export const env = {
  // API
  apiBaseUrl: getEnvVar('VITE_API_BASE_URL'),

  // Keycloak
  keycloak: {
    url: getEnvVar('VITE_KEYCLOAK_URL'),
    realm: getEnvVar('VITE_KEYCLOAK_REALM'),
    clientId: getEnvVar('VITE_KEYCLOAK_CLIENT_ID'),
    /** Em dev: path do proxy no Vite para evitar CORS (ex: /auth-proxy). Deixe vazio em prod. */
    proxyPath: getEnvVar('VITE_KEYCLOAK_PROXY_PATH', false),
  },

  // Auth Redirects
  auth: {
    redirectUri: getEnvVar('VITE_AUTH_REDIRECT_URI'),
    postLogoutRedirectUri: getEnvVar('VITE_AUTH_POST_LOGOUT_REDIRECT_URI'),
  },

  // Runtime info
  isDev: import.meta.env.DEV,
  isProd: import.meta.env.PROD,
  mode: import.meta.env.MODE,
} as const

// Type for env
export type Env = typeof env
