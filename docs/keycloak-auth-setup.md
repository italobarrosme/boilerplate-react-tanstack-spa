# Keycloak Authentication Setup

## Visão Geral

Este projeto utiliza **OAuth2/OIDC com PKCE** (Proof Key for Code Exchange) para autenticação via Keycloak.

O **PKCE** é o padrão recomendado pelo OAuth 2.1 para aplicações client-side (SPAs), pois permite autenticação segura **sem expor secrets** no frontend.

---

## Por que PKCE?

Em SPAs, todo o código JavaScript é acessível ao usuário (via DevTools). Por isso:

- ❌ **Client secrets não devem ser usados** — seriam expostos no bundle
- ✅ **PKCE substitui o secret** — usa um `code_verifier` gerado dinamicamente
- ✅ **Proteção contra interceptação** — mesmo que o `authorization_code` seja interceptado, não pode ser usado sem o `code_verifier` original

---

## Fluxo de Autenticação

```
┌─────────┐                              ┌──────────┐                              ┌──────────┐
│   SPA   │                              │ Keycloak │                              │   API    │
└────┬────┘                              └────┬─────┘                              └────┬─────┘
     │                                        │                                         │
     │  1. Gera code_verifier + code_challenge│                                         │
     │────────────────────────────────────────>                                         │
     │  2. Redireciona para /auth             │                                         │
     │        (com code_challenge)            │                                         │
     │                                        │                                         │
     │  3. Usuário faz login                  │                                         │
     │<───────────────────────────────────────│                                         │
     │  4. Retorna authorization_code         │                                         │
     │                                        │                                         │
     │  5. POST /token                        │                                         │
     │        (com code + code_verifier)      │                                         │
     │────────────────────────────────────────>                                         │
     │  6. Retorna access_token               │                                         │
     │<───────────────────────────────────────│                                         │
     │                                        │                                         │
     │  7. Requisições autenticadas           │                                         │
     │─────────────────────────────────────────────────────────────────────────────────>│
     │                                        │                                         │
```

---

## Configuração do Keycloak (Admin)

Para que SPAs funcionem corretamente com PKCE, o client **deve ser configurado como público**.

### Keycloak 17+ (Quarkus)

1. Acesse **Clients** → selecione ou crie o client
2. Na aba **Settings**:
   - **Client authentication**: `OFF` ✅
   - **Authorization**: `OFF`
3. Em **Authentication flow**:
   - ✅ `Standard flow` (Authorization Code Flow)
   - ❌ Desmarque `Direct access grants` (não recomendado para SPAs)
4. Em **Login settings**:
   - **Valid redirect URIs**: URLs permitidas (ex: `http://localhost:3000/auth/callback`, `https://app.exemplo.com/auth/callback`)
   - **Valid post logout redirect URIs**: URLs de redirecionamento após logout
   - **Web origins**: **obrigatório para evitar CORS** — use `+` (replica os redirect URIs) ou liste a origem exata (ex: `http://localhost:3000`, `https://app.exemplo.com`). Sem isso, o navegador bloqueia o `fetch` ao endpoint `/token`.
5. Salve

### Keycloak 16 e anteriores (WildFly)

1. Acesse **Clients** → selecione ou crie o client
2. Na aba **Settings**:
   - **Access Type**: `public` ✅
   - **Standard Flow Enabled**: `ON`
   - **Direct Access Grants Enabled**: `OFF`
3. Configure as URLs:
   - **Valid Redirect URIs**: URLs permitidas
   - **Web Origins**: `+` ou liste explicitamente
4. Salve

---

## Erro Comum: Client Confidential

Se ao tentar autenticar você receber o erro:

```json
{
  "error": "unauthorized_client",
  "error_description": "Client secret not provided in request"
}
```

**Causa:** O client está configurado como `confidential` no Keycloak.

**Solução:** O administrador do Keycloak deve alterar a configuração:

- **Keycloak 17+**: Desativar `Client authentication`
- **Keycloak 16-**: Alterar `Access Type` para `public`

---

## Erro: URI de redirecionamento inválido (logout)

Se ao fazer logout aparecer a mensagem **"URI de redirecionamento inválido"** na tela do Keycloak:

**Causa:** O valor de `VITE_AUTH_POST_LOGOUT_REDIRECT_URI` (ex.: `http://localhost:3000/auth/login`) não está cadastrado no cliente do Keycloak.

**Solução:** No Keycloak Admin, abra o client do realm (ex.: `brhml`) e em **Settings** → **Valid post logout redirect URIs** adicione exatamente a mesma URL que está no seu `.env`:

- Desenvolvimento: `http://localhost:3000/auth/login`
- Produção: a URL completa da sua aplicação após logout (ex.: `https://app.exemplo.com/auth/login`)

Salve o client e tente o logout novamente. O Keycloak só aceita URIs que estejam nessa lista.

---

## Erro Comum: CORS (Access-Control-Allow-Origin)

Se o console do navegador mostrar:

```
Access to fetch at 'https://.../protocol/openid-connect/token' has been blocked by CORS policy:
No 'Access-Control-Allow-Origin' header is present on the requested resource.
```

**Causa:** O Keycloak não está enviando o header CORS para a origem da sua aplicação (ex.: `http://localhost:3000`).

**Solução recomendada (Keycloak):** No client do Keycloak, em **Web origins**, adicione a origem da aplicação (ex.: `http://localhost:3000` para dev) ou use `+` para permitir as mesmas origens dos **Valid redirect URIs**. Assim o Keycloak inclui `Access-Control-Allow-Origin` nas respostas do endpoint de token.

**Contorno em desenvolvimento (sem alterar Keycloak):** Este projeto suporta um proxy no Vite. Defina no `.env`:

```env
VITE_KEYCLOAK_PROXY_PATH=/auth-proxy
```

Com isso, em dev apenas as chamadas **fetch** ao endpoint de token (troca de código e refresh) passam pelo proxy. O **redirect de login** continua indo para a URL real do Keycloak, assim a página de login (tema, CSS, JS) carrega corretamente. O CORS só afeta o `fetch` ao `/token`, por isso o proxy resolve sem quebrar o tema do Keycloak. **Em produção**, remova ou deixe vazio `VITE_KEYCLOAK_PROXY_PATH` e garanta que o Keycloak tenha **Web origins** configurado.

---

## Variáveis de Ambiente

```env
# URL base do Keycloak
VITE_KEYCLOAK_URL=https://keycloak.exemplo.com

# Nome do realm
VITE_KEYCLOAK_REALM=meu-realm

# Client ID (deve ser público, sem secret)
VITE_KEYCLOAK_CLIENT_ID=minha-spa

# URLs de redirecionamento
VITE_AUTH_REDIRECT_URI=http://localhost:3000/auth/callback
VITE_AUTH_POST_LOGOUT_REDIRECT_URI=http://localhost:3000/auth/login

# Opcional (só em dev): proxy para evitar CORS. Ex.: /auth-proxy
# VITE_KEYCLOAK_PROXY_PATH=/auth-proxy
```

---

## Como testar se o PKCE está funcionando

### 1. Testes automatizados

O módulo PKCE tem testes unitários que validam o algoritmo S256 (RFC 7636):

```bash
npm run test -- src/infra/auth/pkce.test.ts
```

Os testes verificam: geração de `state`/`nonce`, formato do `code_verifier` e do `code_challenge`, relação `code_challenge = BASE64URL(SHA256(code_verifier))` e o storage em `sessionStorage`.

### 2. Teste manual no navegador (DevTools)

1. **Antes do login**  
   Abra DevTools → **Application** (ou **Armazenamento**) → **Session Storage** → sua origem. Antes de clicar em “Login”, não deve haver chaves `auth_code_verifier`, `auth_state`, etc.

2. **Clique em “Login”**  
   Você é redirecionado para o Keycloak. Na **barra de endereços**, a URL deve conter:
   - `code_challenge=` (string em base64url)
   - `code_challenge_method=S256`  
     Se esses parâmetros existirem, o fluxo está enviando o challenge corretamente.

3. **No Session Storage**  
   Depois do redirecionamento para o Keycloak (mesmo em outra aba), na origem da sua app (`http://localhost:3000`) deve aparecer:
   - `auth_code_verifier`
   - `auth_state`  
     (O verifier fica só no navegador da sua app; o Keycloak nunca o vê até a troca do código.)

4. **Após fazer login no Keycloak**  
   Na aba **Network** (Rede), filtre por “token” ou pelo host do Keycloak. Deve haver um **POST** para `/protocol/openid-connect/token` com corpo (Form Data) contendo:
   - `grant_type=authorization_code`
   - `code=...`
   - `code_verifier=...`
   - `redirect_uri=...`  
     Se esse POST existir e a resposta for 200 com `access_token`, o PKCE foi usado com sucesso: o servidor validou o `code_verifier` contra o `code_challenge` enviado no passo 2.

**Resumo:**

- URL de login com `code_challenge` + `code_challenge_method=S256` → envio do PKCE.
- POST `/token` com `code_verifier` e resposta 200 → troca com PKCE aceita pelo Keycloak.

---

## Como testar o refresh token

O refresh token é usado para renovar o `access_token` quando ele está próximo de expirar (por padrão, 5 minutos antes), sem o usuário precisar fazer login de novo.

### 1. Testes automatizados

A lógica de “quando refrescar” e a montagem da sessão a partir da resposta do Keycloak são cobertas por testes:

```bash
# Expiração e “expirando em breve” (session-storage)
npm run test -- src/infra/auth/session-storage.test.ts

# Montagem da sessão a partir dos tokens (inclui refresh_token na sessão)
npm run test -- src/infra/auth/keycloak-token.test.ts
```

- **session-storage**: `isExpired` e `isExpiringSoon` (limiar de 5 min) e persistência.
- **keycloak-token**: `buildSessionFromTokens` (expiresAt, refresh_token, id_token, user, roles).

### 2. Teste manual no navegador (DevTools)

1. **Fazer login**  
   Faça login normalmente e deixe a aplicação carregada (ex.: dashboard).

2. **Abrir a aba Network**  
   DevTools → **Network** (Rede). Filtre por “token” ou pelo host do Keycloak. Deixe a aba aberta.

3. **Provocar um refresh**  
   O refresh só acontece quando o access token está “expirando em breve” (por padrão, nos últimos 5 minutos da validade). Duas formas de testar:
   - **Opção A – Esperar:** Se o Keycloak estiver configurado com access token de vida curta (ex.: 1 minuto), espere cerca de 1 minuto e então navegue ou recarregue a página, ou use uma tela que chame `getAccessToken()` (ex.: uma chamada à API).
   - **Opção B – Reduzir tempo no Keycloak (recomendado):** No admin do Keycloak, no **realm** → **Realm settings** → **Tokens**, reduza temporariamente **Access Token Lifespan** (ex.: 1 minuto). Faça login de novo, espere ~1 minuto e navegue/recarregue ou dispare uma ação que use o token.

4. **Conferir o POST de refresh**  
   Na aba **Network**, deve aparecer um **POST** para `/protocol/openid-connect/token` com **Form Data** contendo:
   - `grant_type=refresh_token`
   - `refresh_token=...`
   - `client_id=...`  
     Resposta **200** com novo `access_token` e, em geral, novo `refresh_token` e `expires_in`. Se isso ocorrer, o fluxo de refresh está funcionando.

5. **Session Storage**  
   Em **Application** → **Session Storage** → sua origem, a chave `auth_session` (Zustand) deve ser atualizada após o refresh com o novo `accessToken` e `expiresAt`.

**Resumo:**

- Testes unitários garantem a lógica de expiração e a construção da sessão.
- No manual: após o access token estar “expirando em breve”, um POST `/token` com `grant_type=refresh_token` e resposta 200 indica que o refresh token está sendo usado corretamente.

---

## Referências

- [OAuth 2.0 for Browser-Based Apps (Best Current Practice)](https://datatracker.ietf.org/doc/html/draft-ietf-oauth-browser-based-apps)
- [PKCE - RFC 7636](https://datatracker.ietf.org/doc/html/rfc7636)
- [Keycloak - Securing Applications](https://www.keycloak.org/docs/latest/securing_apps/)
- [OAuth 2.1 Draft](https://datatracker.ietf.org/doc/html/draft-ietf-oauth-v2-1-07)
