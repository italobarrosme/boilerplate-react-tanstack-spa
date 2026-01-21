# Web SPA (Vite + React + TanStack + Keycloak) — Deploy AWS Amplify

## 1. Visão Geral do Projeto

Este projeto é um **Backoffice Web interno**, construído como uma **SPA 100% client-side**, sem SSR e sem necessidade de SEO.
O frontend consome um backend externo via APIs e será hospedado no **AWS Amplify** (Static Hosting/CDN).

### Características-chave:

- **Sem SEO e sem SSR**
- **Client-side only** (React + Vite)
- Integração via API externa (sem backend no repo)
- SSO corporativo via Keycloak (OIDC/OAuth2 com PKCE)
- Organização por módulos de negócio e padrões de separação de responsabilidades
- Deploy exclusivo no AWS Amplify, com suporte a rotas SPA (rewrite para `index.html`)

## 2. Objetivos Técnicos

- **Previsibilidade e escalabilidade**: arquitetura modular, com fronteiras claras por domínio.

- **Type-safety end-to-end no frontend**: rotas type-safe, hooks tipados, contratos de API tipados.

- **Baixo acoplamento entre camadas**:
  - Auth não acoplado ao Router nem ao HTTP Client
  - HTTP Client isolado por um API Gateway interno (abstração para troca futura do Ky)

- **Experiência moderna de SPA**:
  - cache, sincronização e refetch controlado com TanStack Query
  - roteamento type-safe com TanStack Router

- **Deploy simples e confiável no Amplify**: build estático, rewrite SPA, cache adequado e env vars.

## 3. Stack e Justificativas (decisões fixas)

### 3.1 Core

- **Vite**: build rápido, pipeline simples para static hosting.
- **React**: UI client-side, ecossistema maduro para SPAs internas.
- **TypeScript**: previsibilidade e robustez com tipagem explícita.

### 3.2 Roteamento & Estado de Servidor

- **TanStack Router**: rotas type-safe, composição de rotas por módulo e guards previsíveis.
- **TanStack Query**: padrão único para estado de servidor: cache, invalidation, retries, dedupe.

### 3.3 HTTP / Networking

- **Ky**: client HTTP leve e moderno.
- **API Gateway interno obrigatório**: nenhum módulo chama Ky diretamente.
  - **Motivo**: permitir substituição futura do client HTTP sem refatorar módulos.

### 3.4 Autenticação

- **Keycloak (OIDC/OAuth2 + PKCE)**: SSO corporativo.
- Arquitetura preparada para troca de IdP futuramente (Auth0/Cognito/outro):
  - **Motivo**: reduzir lock-in e manter auth como componente de infraestrutura.

### 3.5 UI / Estilização

- **Tailwind CSS v4**
- **shadcn/ui** apenas como base de componentes
- Componentes presentational (sem regra de negócio embutida)
- Tokens e estilos centralizados (tema, tipografia, espaçamentos, etc.)

### 3.6 Code Quality & Git Hooks

- **Biome**: linter e formatter all-in-one, substitui ESLint + Prettier.
  - **Motivo**: performance superior, configuração unificada, zero dependências.
  - Configuração em `biome.json`

- **Lefthook**: gerenciador de git hooks.
  - **Motivo**: leve, rápido, configuração declarativa em YAML.
  - Configuração em `lefthook.yml`
  - Hooks configurados:
    - `pre-commit`: lint + format + typecheck
    - `commit-msg`: validação de commit message (commitlint)
    - `pre-push`: build + tests

- **Commitlint**: validação de mensagens de commit.
  - **Motivo**: garante consistência nas mensagens seguindo Conventional Commits.
  - Configuração em `commitlint.config.js`
  - Tipos permitidos: `feat`, `fix`, `docs`, `style`, `refactor`, `perf`, `test`, `build`, `ci`, `chore`, `revert`

**Scripts npm disponíveis:**

```bash
npm run lint        # Verifica erros de lint
npm run lint:fix    # Corrige erros automaticamente
npm run format      # Formata código
npm run check       # Lint + format em uma execução
```

### 3.7 Testes

- **Vitest**: test runner rápido, compatível com Vite.
  - **Motivo**: integração nativa com Vite, API compatível com Jest, performance superior.
  - Configuração em `vitest.config.ts`

- **Testing Library**: utilitários para testes de componentes React.
  - `@testing-library/react`: renderização e queries
  - `@testing-library/user-event`: simulação de interações do usuário
  - `@testing-library/jest-dom`: matchers customizados para DOM

**Estrutura de testes:**

```
src/
  test/
    setup.ts          # Configuração global (mocks, cleanup)
    test-utils.tsx    # Providers e render customizado
  
  infra/ui/components/
    Button.test.tsx   # Exemplo de teste de componente
```

**Scripts npm disponíveis:**

```bash
npm run test           # Executa testes em watch mode
npm run test:run       # Executa testes uma vez
npm run test:coverage  # Executa testes com cobertura
```

**Convenções de teste:**

- Arquivos de teste: `*.test.tsx` ou `*.spec.tsx`
- Testes ficam próximos ao código testado
- Usar `render` do `@/test/test-utils` para ter providers

## 4. Arquitetura Geral (alto nível)

### 4.1 Camadas e responsabilidades

#### Infra (global, fora dos módulos)

- Auth Provider (Keycloak OIDC/PKCE)
- HTTP Gateway (Ky + interceptores + adaptação)
- Query Client (TanStack Query)
- Router Setup (TanStack Router)
- UI base (tokens, tema, componentes globais)

#### Módulos de negócio (`src/modules/...`)

Cada módulo contém:

- `components/` → UI pura (presentational)
- `hooks/` → regras de negócio do módulo (orquestra estado de servidor e UI)
- `services/` → comunicação com API (via gateway)
- `routes.tsx` → rotas do módulo
- `types.ts` → tipos do domínio do módulo

### 4.2 Fluxo de dependências (regra)

- `modules/*/services` dependem de `infra/api-gateway`
- `modules/*/hooks` dependem de `services` e de TanStack Query
- `modules/*/components` dependem apenas de props/tipos (sem fetch, sem auth, sem gateway)
- Router/Guards consultam Auth Provider, mas Auth Provider **não depende** do router
- HTTP Gateway consulta Auth Provider para token (via interface), mas Auth Provider **não depende** do gateway

## 5. Organização de Pastas (obrigatória)

```
src/
  app/                      # bootstrap do app (router, providers)
    main.tsx
    router.tsx
    providers.tsx

  infra/                    # infraestrutura global (fora dos módulos)
    auth/
      types.ts
      auth-provider.ts
      keycloak-auth-provider.ts
      useAuth.ts
    http/
      types.ts
      api-gateway.ts
      ky-client.ts
      errors.ts
    query/
      query-client.ts
    ui/
      tokens/
      theme/
      components/           # wrappers globais (ex: Layout, Shell, etc.)
    config/
      env.ts

  modules/
    auth/
      components/
      hooks/
      services/
      routes.tsx
      types.ts
    billing/
      components/
      hooks/
      services/
      routes.tsx
      types.ts
    users/
      components/
      hooks/
      services/
      routes.tsx
      types.ts
    reports/
      components/
      hooks/
      services/
      routes.tsx
      types.ts

  shared/                   # utilitários puros e tipos compartilháveis
    types/
    utils/
```

### Regras:

- Nada em `modules/*` importa diretamente `ky`.
- Nada em `modules/*/components` usa `useQuery`, `useAuth`, `navigate`, `localStorage`, etc.
- `Infra` é responsável por providers, gateway, query client e integrações.

## 6. Padrões de Desenvolvimento

### 6.1 Presentational Components (obrigatório)

- Sem efeitos colaterais (sem fetch, sem auth, sem storage).
- Recebem tudo via props.
- Não importam services, gateway, query, auth.

**Exemplo de assinatura:**

```typescript
type UserListProps = {
  users: User[]
  isLoading: boolean
  onRefresh: () => void
}

export function UserList({ users, isLoading, onRefresh }: UserListProps) {
  // apenas render
}
```

### 6.2 Hooks como camada de regra de negócio do módulo

`hooks/` orquestra:

- chamadas de `services/` (via gateway)
- cache e sincronização (TanStack Query)
- mapeamentos de DTO ↔️ tipos do domínio

**Exemplo de intenção:**

`useUsersList()` retorna `{ data, isLoading, refetch, actions }`

### 6.3 Services (chamada de API) com gateway

- `services/` expõe funções puras: `listUsers()`, `getReport()`, etc.
- Nunca instanciam Ky diretamente; usam `infra/http/api-gateway`.

## 7. Estratégia de Autenticação (Keycloak OIDC + PKCE)

### 7.1 Objetivo

Implementar autenticação SSO via Keycloak usando **Authorization Code Flow com PKCE**, com:

- Login
- Callback
- Logout
- Sessão (decisão explícita)
- Refresh/expiração
- Proteção de rotas no TanStack Router
- Tratamento global de 401 e 403
- Separação clara entre Auth Provider, HTTP client e Router Guards

### 7.2 Fluxo OIDC com PKCE (passo a passo)

#### 1) Usuário acessa rota protegida

Router Guard exige sessão válida → se não houver, redireciona para `/auth/login`.

#### 2) Login inicia OIDC

O Auth Provider gera `code_verifier` e `code_challenge` (PKCE), e redireciona para o endpoint `/authorize` do Keycloak com:

- `response_type=code`
- `client_id`
- `redirect_uri`
- `scope=openid profile email`
- `code_challenge`
- `code_challenge_method=S256`
- `state` e `nonce`

#### 3) Callback (`/auth/callback`)

Keycloak redireciona com `code` + `state`.
O Auth Provider valida `state`, troca `code` por tokens em `/token` usando `code_verifier`.

#### 4) Sessão estabelecida

Tokens são armazenados de forma definida (ver 7.3).
App redireciona para a rota originalmente solicitada (armazenada em memória de navegação/param).

#### 5) Requests autenticados

HTTP Gateway obtém access token via Auth Provider e envia como `Authorization: Bearer <token>`.

#### 6) Expiração / Refresh

Antes de requests (ou em schedule), se token expirar/estiver perto de expirar, Auth Provider executa refresh.

#### 7) Logout

Logout invalida sessão local e redireciona para endpoint de logout do Keycloak, voltando para uma rota pública.

### 7.3 Armazenamento de sessão (decisão explícita)

**Decisão:** armazenar tokens no `sessionStorage`.

#### Motivos:

- SPA interna, sessão deve ser "por aba".
- Evita persistência longa no dispositivo (como ocorreria no `localStorage`).
- Reduz impacto de recuperação automática após fechar navegador.

#### Regras:

`sessionStorage` guarda:

- `access_token`
- `refresh_token`
- `id_token` (se necessário para claims)
- metadados de expiração (`expires_at`)

Ao inicializar o app, Auth Provider:

- carrega sessão do `sessionStorage`
- valida expiração
- tenta refresh se necessário

### 7.4 Separação obrigatória: Auth Provider, Router Guards, HTTP Client

#### Auth Provider (`infra/auth`)

**Responsável por:**

- iniciar login e callback
- armazenar/recuperar sessão
- fornecer token atual (`getAccessToken()`)
- refresh (`refreshIfNeeded()`)
- logout

**Interface obrigatória (para suportar troca de SSO):**

```typescript
export type AuthSession = {
  accessToken: string
  refreshToken?: string
  idToken?: string
  expiresAt: number // epoch ms
  roles?: string[]
}

export interface AuthProvider {
  init(): Promise<void>
  login(returnTo?: string): Promise<void>
  handleCallback(url: string): Promise<void>
  logout(): Promise<void>

  getSession(): AuthSession | null
  getAccessToken(): Promise<string | null>
  refreshIfNeeded(): Promise<void>
  isAuthenticated(): boolean
  hasRole(role: string): boolean
}
```

#### Router Guards (TanStack Router)

**Responsável por:**

- bloquear acesso a rotas protegidas
- redirecionar para login
- validar permissões (roles)

**Regra:** Router não implementa login nem token; ele consulta o Auth Provider.

#### HTTP Gateway

**Responsável por:**

- anexar token nos headers
- lidar com 401/403 globalmente
- disparar refresh via Auth Provider quando necessário
- normalizar erros HTTP (com tipos)

### 7.5 Proteção de rotas no TanStack Router

**Regra:** rotas privadas devem declarar meta/flag de proteção.

**Exemplo de intenção (estrutura):**

- rotas públicas: `/auth/login`, `/auth/callback`
- rotas privadas: todo o restante (ou por segmento)

**Critérios:**

- Se `!auth.isAuthenticated()` → redirect para `/auth/login`
- Se rota exige role e `!auth.hasRole(requiredRole)` → redirect para `/forbidden`

### 7.6 Estratégia de refresh / expiração

**Regras obrigatórias:**

- Sempre que possível, refresh antes de expirar (ex: janela de 60s antes).
- Se refresh falhar → sessão é limpa e usuário é redirecionado para login.
- O gateway chama `auth.refreshIfNeeded()` antes de requests que exigem token.

### 7.7 Tratamento global de 401 / 403

#### 401 (Unauthorized)

Significa token ausente/inválido/expirado.

**Ação:**

- tentar `refreshIfNeeded()`
- se persistir → limpar sessão e redirecionar para `/auth/login`

#### 403 (Forbidden)

Token válido, mas sem permissão.

**Ação:**

- redirecionar para `/forbidden`
- não tenta refresh

## 8. Estratégia de Data Fetching (TanStack Query)

### 8.1 Princípios

- Toda chamada ao backend vai via `services/` + `api-gateway`.
- Todo estado remoto é gerenciado por TanStack Query.
- O hook do módulo é o ponto único de orquestração (query + regras).

### 8.2 Convenções obrigatórias

**queryKey** sempre em formato estável e previsível:

- `['users', 'list', params]`
- `['billing', 'invoices', invoiceId]`

`services/` não conhece TanStack Query (é agnóstico).

`hooks/` define:

- `useQuery` / `useMutation`
- invalidation após mutações
- mapeamento DTO → domínio

### 8.3 Padrão de erros

Gateway normaliza erros para um tipo único:

- `ApiError` com `status`, `code`, `message`, `details`

UI decide apresentação via componentes (toasts, banners, etc.)

## 9. HTTP / API Gateway Interno (abstração para substituir Ky)

### 9.1 Objetivo

Garantir que Ky seja um detalhe de infraestrutura, substituível sem impacto nos módulos.

### 9.2 Contrato do gateway

```typescript
export type HttpMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE'

export type RequestOptions = {
  query?: Record<string, string | number | boolean | undefined>
  headers?: Record<string, string>
  body?: unknown
  signal?: AbortSignal
}

export interface ApiGateway {
  request<TResponse>(method: HttpMethod, path: string, options?: RequestOptions): Promise<TResponse>
}
```

### 9.3 Implementação com Ky (`infra/http`)

`ky-client.ts` configura:

- `prefixUrl` (base URL)
- headers comuns
- timeout e retry padronizados
- hooks para anexar token e tratar erros

**Regra:** módulos não importam `ky-client.ts`, apenas `api-gateway.ts`.

### 9.4 Integração com Auth Provider

Antes de request:

- `await auth.refreshIfNeeded()`
- `token = await auth.getAccessToken()`
- se token existe → `Authorization` header

## 10. UI / Design System (Tailwind v4 + shadcn/ui)

### 10.1 Tailwind v4

- Tokens centralizados em `infra/ui/tokens/` e `infra/ui/theme/`.
- Padrões de classes e escala:
  - fontes, espaçamentos, radius, shadows e cores devem derivar dos tokens.

### 10.2 shadcn/ui

Usado somente como base para:

- botões, inputs, dialogs, dropdowns, tables, etc.

Componentes shadcn devem ser:

- encapsulados/ajustados para o design do projeto
- mantidos como UI pura (presentational)

### 10.3 Regra de composição

- Componentes globais de layout (Shell, Topbar, Sidebar) ficam em `infra/ui/components`.
- Componentes de negócio ficam no módulo correspondente.

## 11. Deploy no AWS Amplify (CRÍTICO)

### 11.1 Configuração de build (Amplify)

**Build command:**

```bash
npm ci
npm run build
```

**Output directory:**

```
dist
```

**Observação:** Vite gera build estático em `dist/` por padrão.

### 11.2 SPA Rewrite (todas as rotas → index.html)

**Obrigatório:** qualquer rota do TanStack Router deve ser resolvida pelo `index.html`.

Configurar no Amplify:

**Rewrites and redirects:**

- Source: `</^[^.]+$|\\.(?!(css|gif|ico|jpg|js|png|txt|svg|woff|woff2)$)([^.]+$)/>`
- Target: `/index.html`
- Type: 200 (Rewrite)

**Ou regra simples (quando aplicável):**

- Source: `/*`
- Target: `/index.html`
- Status: 200

**Resultado:** refresh em rota profunda funciona sem 404.

### 11.3 Variáveis de ambiente no Amplify

**Regras:**

- Variáveis usadas no frontend devem ser expostas como `VITE_*` (Vite).
- Configurar no Amplify → Environment variables.

**Exemplos obrigatórios:**

- `VITE_API_BASE_URL`
- `VITE_KEYCLOAK_URL`
- `VITE_KEYCLOAK_REALM`
- `VITE_KEYCLOAK_CLIENT_ID`
- `VITE_AUTH_REDIRECT_URI`

### 11.4 Considerações de cache/CDN

- Assets com hash (JS/CSS gerados pelo Vite) podem ter cache agressivo.
- `index.html` deve ter cache mais conservador, pois referencia bundles versionados.
- Evitar cache que "trave" deploy:
  - sempre garantir que o `index.html` reflita a versão mais recente.

### 11.5 Observações importantes sobre limites do Amplify para SPA

- O Amplify hospeda build estático; não há runtime Node para SSR.
- Rotas devem funcionar via rewrite.
- Variáveis de ambiente são aplicadas no build; alterações exigem novo build/deploy.
- Logs e debugging dependem do pipeline do Amplify e do browser (SPA).

## 12. Variáveis de Ambiente (contrato)

Arquivo de validação e leitura centralizada: `src/infra/config/env.ts`

**Obrigatório:**

- Ler via `import.meta.env`
- Exportar um objeto `env` tipado e imutável

### Lista mínima:

| Variável | Obrigatória | Exemplo | Uso |
|----------|-------------|---------|-----|
| `VITE_API_BASE_URL` | ✅ | `https://api.externa.com` | Base URL do backend |
| `VITE_KEYCLOAK_URL` | ✅ | `https://sso.empresa.com` | Host do Keycloak |
| `VITE_KEYCLOAK_REALM` | ✅ | `backoffice` | Realm |
| `VITE_KEYCLOAK_CLIENT_ID` | ✅ | `backoffice-spa` | Client ID |
| `VITE_AUTH_REDIRECT_URI` | ✅ | `https://app.com/auth/callback` | Callback OIDC |
| `VITE_AUTH_POST_LOGOUT_REDIRECT_URI` | ✅ | `https://app.com/auth/login` | Pós-logout |

## 13. Setup Inicial (do zero)

### 13.1 Requisitos

- Node.js LTS
- npm (padrão do projeto)

### 13.2 Instalação

```bash
npm ci
```

### 13.3 Rodar local

```bash
npm run dev
```

### 13.4 Build

```bash
npm run build
npm run preview
```

## 14. Convenções e Boas Práticas (obrigatórias)

### 14.1 Tipagem

- `types.ts` por módulo define tipos do domínio.
- DTOs (backend) devem ser mapeados para tipos do domínio no `hooks/` ou `services/`.

### 14.2 Tratamento de erros

- Nunca retornar erro "cru" do Ky para UI.
- Sempre normalizar em `ApiError`.

### 14.3 Imports e limites

- `modules/*` não importa de outro módulo diretamente (evitar acoplamento cruzado).
- Compartilhamento só via `shared/`.

### 14.4 Estrutura de rotas por módulo

- Cada módulo exporta suas rotas em `routes.tsx`.
- `app/router.tsx` compõe todas as rotas dos módulos.

## 15. Pontos de Evolução Futura (sem retrabalho)

### Troca de SSO (Auth0/Cognito/outro)

- Implementar novo `XAuthProvider` respeitando `AuthProvider` interface.
- Router Guards e HTTP Gateway permanecem iguais.

### Troca do client HTTP (Ky → outro)

- Substituir implementação em `infra/http/*`.
- Módulos continuam chamando `ApiGateway`.

### Permissões avançadas

- Expandir `hasRole` para políticas (RBAC/ABAC) mantendo Auth isolado.

### Observabilidade

- Instrumentação de requests e erros a partir do gateway (ponto único).

### Design System interno

- Evoluir tokens e componentes globais sem impactar regras de negócio.

## 16. Critérios de "feito" do Setup

O projeto é considerado corretamente instalado e configurado quando:

- ✅ `npm run dev` sobe a SPA localmente
- ✅ Login via Keycloak funciona com PKCE
- ✅ Rotas protegidas redirecionam corretamente para login
- ✅ Callback estabelece sessão e retorna para rota original
- ✅ Requests autenticados incluem `Authorization` via gateway
- ✅ 401 tenta refresh e, ao falhar, redireciona para login
- ✅ 403 leva para tela de acesso negado
- ✅ Build gera `dist/`
- ✅ Deploy no Amplify serve SPA com rewrite para `index.html`
- ✅ Variáveis `VITE_*` configuradas no Amplify refletem no build final
