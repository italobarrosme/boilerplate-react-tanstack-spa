# Boilerplate React TanStack SPA

Boilerplate para aplicações SPA internas (Backoffice) com React, TanStack Router, TanStack Query e autenticação via Keycloak.

## Stack

- **React 19** + **TypeScript** - UI e tipagem
- **Vite** - Build e dev server
- **TanStack Router** - Roteamento type-safe
- **TanStack Query** - Gerenciamento de estado de servidor
- **Ky** - HTTP client (abstraído pelo API Gateway)
- **Tailwind CSS v4** - Estilização (tema: verde #008542 + gold)
- **Keycloak** - SSO (OIDC/OAuth2 + PKCE)
- **Vitest** + **Testing Library** - Testes unitários e de componentes
- **Biome** - Lint e formatação
- **Commitlint** - Validação de commits (Conventional Commits)
- **Lefthook** - Git hooks

## Pré-requisitos

- Node.js LTS (v20+)
- npm

## Setup

1. Clone o repositório
2. Copie o arquivo de ambiente:

```bash
cp .env.example .env
```

3. Configure as variáveis de ambiente no `.env`
4. Instale as dependências:

```bash
npm install
```

## Scripts

```bash
# Desenvolvimento
npm run dev

# Build de produção
npm run build

# Preview do build
npm run preview

# Lint
npm run lint

# Lint com fix automático
npm run lint:fix

# Formatação
npm run format

# Testes
npm run test           # watch mode
npm run test:run       # executa uma vez
npm run test:coverage  # com cobertura
```

## Commits

Este projeto usa **Conventional Commits**. Formato:

```
<type>(<scope>): <description>

[optional body]

[optional footer]
```

**Tipos permitidos:** `feat`, `fix`, `docs`, `style`, `refactor`, `perf`, `test`, `build`, `ci`, `chore`, `revert`

**Exemplos:**
```bash
git commit -m "feat(auth): add keycloak login flow"
git commit -m "fix(users): correct pagination params"
git commit -m "docs: update readme with test instructions"
```

## Estrutura do Projeto

```
src/
  app/                      # Bootstrap do app
    App.tsx                 # Componente raiz
    router.tsx              # Configuração do router
    routes/                 # Definição de rotas (file-based)

  infra/                    # Infraestrutura global
    auth/                   # Autenticação (Keycloak OIDC + PKCE)
    http/                   # HTTP Gateway (abstração do Ky)
    query/                  # TanStack Query client
    ui/                     # Componentes UI base
    config/                 # Configuração (env vars)

  modules/                  # Módulos de negócio
    auth/                   # Módulo de autenticação
    dashboard/              # Dashboard
    users/                  # Gestão de usuários

  shared/                   # Utilitários compartilhados
    utils/

  test/                     # Configuração de testes
    setup.ts                # Setup global (mocks)
    test-utils.tsx          # Render customizado com providers
```

## Variáveis de Ambiente

| Variável | Descrição |
|----------|-----------|
| `VITE_API_BASE_URL` | Base URL da API backend |
| `VITE_KEYCLOAK_URL` | URL do Keycloak |
| `VITE_KEYCLOAK_REALM` | Realm do Keycloak |
| `VITE_KEYCLOAK_CLIENT_ID` | Client ID da aplicação |
| `VITE_AUTH_REDIRECT_URI` | URI de callback OIDC |
| `VITE_AUTH_POST_LOGOUT_REDIRECT_URI` | URI após logout |

## Deploy (AWS Amplify)

1. Configure as variáveis de ambiente no Amplify Console
2. Configure o build:
   - Build command: `npm ci && npm run build`
   - Output directory: `dist`
3. Configure o rewrite para SPA:
   - Source: `/*`
   - Target: `/index.html`
   - Status: 200

## Documentação

Veja o arquivo [SPEC.md](./SPEC.md) para a especificação completa da arquitetura.
