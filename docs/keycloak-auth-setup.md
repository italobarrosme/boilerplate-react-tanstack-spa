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
   - **Valid redirect URIs**: URLs permitidas (ex: `http://localhost:5173/*`, `https://app.exemplo.com/*`)
   - **Valid post logout redirect URIs**: URLs de redirecionamento após logout
   - **Web origins**: `+` (usa os redirect URIs) ou liste explicitamente
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

## Variáveis de Ambiente

```env
# URL base do Keycloak
VITE_KEYCLOAK_URL=https://keycloak.exemplo.com

# Nome do realm
VITE_KEYCLOAK_REALM=meu-realm

# Client ID (deve ser público, sem secret)
VITE_KEYCLOAK_CLIENT_ID=minha-spa

# URLs de redirecionamento
VITE_AUTH_REDIRECT_URI=http://localhost:5173/auth/callback
VITE_AUTH_POST_LOGOUT_REDIRECT_URI=http://localhost:5173/auth/login
```

---

## Referências

- [OAuth 2.0 for Browser-Based Apps (Best Current Practice)](https://datatracker.ietf.org/doc/html/draft-ietf-oauth-browser-based-apps)
- [PKCE - RFC 7636](https://datatracker.ietf.org/doc/html/rfc7636)
- [Keycloak - Securing Applications](https://www.keycloak.org/docs/latest/securing_apps/)
- [OAuth 2.1 Draft](https://datatracker.ietf.org/doc/html/draft-ietf-oauth-v2-1-07)
