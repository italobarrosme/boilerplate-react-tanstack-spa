# Mapa Mental — Fluxo de Login (OIDC + PKCE)

## Visão geral

O app usa **Authorization Code Flow com PKCE** via Keycloak (OIDC). Fluxo em etapas:

---

## Fluxo de Sequência (passo a passo)

**1. ACESSO A ROTA PROTEGIDA**

- Usuário navega para rota `/_authenticated`
- App chama `beforeLoad` e verifica `context.auth.isAuthenticated`
- AuthContext consulta Provider: `getSession()` / `isAuthenticated()`
- Se não autenticado: redirect para `/auth/login?redirect=...`

**2. TELA DE LOGIN**

- Usuário acessa `/auth/login`
- LoginPage renderiza com `useAuth()`
- Usuário clica "Entrar com SSO"
- Chama `login(search.redirect ?? '/')` no AuthContext
- AuthContext chama `provider.login(returnTo)`

**3. PREPARAÇÃO PKCE**

- Provider chama `generatePKCE()` → codeVerifier e codeChallenge
- Gera `state` e `nonce`
- Salva em pkceStorage: codeVerifier, state, nonce, returnTo
- Monta URL de autorização com todos os params

**4. REDIRECIONAMENTO AO KEYCLOAK**

- `window.location.href = authEndpoint + params`
- Usuário é enviado ao Keycloak
- Keycloak exibe página de login

**5. USUÁRIO AUTENTICA NO KEYCLOAK**

- Usuário insere credenciais
- Keycloak valida e redireciona: `redirect_uri?code=...&state=...`

**6. CALLBACK**

- Navegador carrega `/auth/callback?code=...&state=...`
- CallbackPage monta e chama `handleCallback(window.location.href)`

**7. VALIDAÇÃO E TROCA DE CÓDIGO**

- Provider extrai `code` e `state` da URL
- Valida `state` com pkceStorage (anti-CSRF)
- Obtém `codeVerifier` do storage
- POST no endpoint de token com code, code_verifier, redirect_uri
- Recebe: access_token, refresh_token, id_token

**8. PERSISTÊNCIA**

- `buildSessionFromTokens()` decodifica JWT e extrai user/roles
- `persistSession()` salva em sessionStorage
- `clearPkce()` limpa verifier, state, nonce

**9. REDIRECIONAMENTO FINAL**

- Obtém `returnTo` do pkceStorage (ou `/`)
- `window.location.href = returnTo` (reload completo para reinit auth)

---

## Mapa Mental (estrutura)

**1. GUARDA (Proteção de rotas)**

- Rota `_authenticated` com beforeLoad
- Verifica `context.auth.isAuthenticated === false`
- Redirect para `/auth/login?redirect={URL_original}`

**2. TELA DE LOGIN** (`/auth/login`)

- LoginPage
- useAuth() expõe login, isAuthenticated, isLoading
- Se já autenticado: navigate(redirect ?? '/')
- onClick "Entrar com SSO": login(search.redirect ?? '/')

**3. PREPARAÇÃO PKCE** (antes do redirect)

- `generatePKCE()` — codeVerifier (64 chars), codeChallenge (SHA256 base64url)
- `generateState()` — anti-CSRF
- `generateNonce()` — anti-replay (OpenID)
- pkceStorage (sessionStorage): code_verifier, state, nonce, return_to
- Params na auth: response_type=code, client_id, redirect_uri, scope, state, nonce, code_challenge, code_challenge_method

**4. REDIRECIONAMENTO AO KEYCLOAK**

- `window.location.href = authEndpoint + params`
- Usuário vê página de login do Keycloak
- Keycloak valida credenciais

**5. CALLBACK** (`/auth/callback`)

- Keycloak redireciona: `redirect_uri?code=...&state=...`
- redirect_uri = VITE_AUTH_REDIRECT_URI (ex: `/auth/callback`)
- CallbackPage monta e chama `handleCallback(window.location.href)`

**6. VALIDAÇÃO E TROCA DE CÓDIGO**

- Extrair: code, state, error, error_description da URL
- Se error: throw, clearAll
- Validar state === pkceStorage.getState() (CSRF)
- Obter codeVerifier
- POST /token: grant_type=authorization_code, code, redirect_uri, code_verifier
- Resposta: access_token, refresh_token, id_token, expires_in

**7. PERSISTÊNCIA DA SESSÃO**

- buildSessionFromTokens() — decode JWT, extrair user/roles
- sessionStorage_ (Zustand + sessionStorage)
- clearPkce() — limpa verifier, state, nonce
- Mantém returnTo para redirect final

**8. REDIRECIONAMENTO FINAL**

- returnTo = pkceStorage.getReturnTo() ?? '/'
- pkceStorage.clearReturnTo()
- window.location.href = returnTo (reload para reinit auth)

**9. INICIALIZAÇÃO** (AuthProvider/init)

- sessionStorage_.get()
- Se expirado + tem refresh_token: refreshIfNeeded()
- Se expirado sem refresh: clearSession()
- Se válido: currentSession = stored

**10. REFRESH DE TOKEN**

- refreshIfNeeded() — chamado por getAccessToken()
- Condição: isExpiringSoon (5 min antes)
- POST /token: grant_type=refresh_token
- persistSession(tokens)

---

## Componentes e responsabilidades

**AuthContext** — Estado global, init(), login(), logout(), getAccessToken()

**KeycloakAuthProvider** — Implementação OIDC: login, handleCallback, refresh, logout

**pkceStorage** — Armazena code_verifier, state, nonce, return_to (sessionStorage)

**sessionStorage_** — Persiste AuthSession (Zustand + sessionStorage)

**LoginPage** — UI login, chama login(redirect)

**CallbackPage** — Processa URL de callback, handleCallback(), redirect final

**_authenticated** — beforeLoad: redirect para /auth/login se não autenticado

---

## URLs e endpoints

**Auth (redirect):** `{KEYCLOAK_URL}/realms/{realm}/protocol/openid-connect/auth`

**Token (fetch):** `{KEYCLOAK_URL ou proxy}/realms/{realm}/protocol/openid-connect/token`

**Logout:** `{KEYCLOAK_URL}/realms/{realm}/protocol/openid-connect/logout`

**redirect_uri:** VITE_AUTH_REDIRECT_URI (ex: `http://localhost:5173/auth/callback`)

---

## Segurança

- **PKCE:** code_verifier nunca vai na URL; code_challenge (hash) vai na auth
- **State:** validação anti-CSRF no callback
- **Nonce:** associado ao ID token, anti-replay
- **SessionStorage:** sessão por aba; não envia cookies para servidor
