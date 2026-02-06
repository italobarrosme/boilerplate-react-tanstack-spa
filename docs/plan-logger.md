# Feature de Logs

Documentação da implementação do sistema de logging do projeto, baseado em **Pino** com formatação legível em desenvolvimento e saída JSON em produção.

---

## Visão geral

- **Biblioteca:** [Pino](https://getpino.io/)
- **Objetivo:** Logs estruturados, performáticos e seguros (redação de dados sensíveis).
- **Comportamento:** Em **desenvolvimento** os logs são exibidos em formato legível (cores, ícones, timestamp em pt-BR). Em **produção** a saída é JSON para ingestão em ferramentas (Datadog, CloudWatch, etc.).

---

## Arquitetura

```
src/utils/logs/
├── index.ts         # Re-export dos loggers (ponto de entrada público)
├── logs.ts          # Configuração do Pino e criação dos loggers por módulo
├── pinoStream.ts    # Stream customizado para dev (pretty print)
├── pinoFormatter.ts # Formatação legível (ícones, cores, timestamp, extras)
├── logs.spec.ts     # Testes do formatador
└── README.md        # Esta documentação
```

### Responsabilidades

| Arquivo              | Responsabilidade                                                                                                                                              |
| -------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **logs.ts**          | Instancia o Pino com nível, `base`, `redact` e escolhe destino (stdout em dev, JSON em prod). Cria loggers filhos por módulo (`auth`, `billing`, `ai`, etc.). |
| **pinoStream.ts**    | Implementa um stream com `write(chunk)` que recebe linhas JSON do Pino e as repassa ao formatador antes de escrever em `process.stdout`.                      |
| **pinoFormatter.ts** | Parse do JSON do Pino, formatação de timestamp (pt-BR), ícones/cores por nível, exibição de `module`/`context`, extras e stack de erros.                      |

---

## Configuração

### Variáveis de ambiente

| Variável    | Descrição                                                                 | Padrão                             |
| ----------- | ------------------------------------------------------------------------- | ---------------------------------- |
| `LOG_LEVEL` | Nível mínimo de log (`trace`, `debug`, `info`, `warn`, `error`, `fatal`). | `debug` em dev, `info` em produção |
| `NODE_ENV`  | Define se o pretty stream é usado: apenas quando **não** é `production`.  | -                                  |

### Níveis Pino (numéricos)

Os ícones e cores em dev seguem o mapeamento:

| Nível | Nome  | Ícone | Uso típico    |
| ----- | ----- | ----- | ------------- |
| 10    | trace | T     | Rastreio fino |
| 20    | debug | D     | Debug         |
| 30    | info  | I     | Informação    |
| 40    | warn  | W     | Avisos        |
| 50    | error | E     | Erros         |
| 60    | fatal | F     | Erros fatais  |

---

## Loggers disponíveis

Todos são exportados em `@/utils/logs` (ou `src/utils/logs`). Foram criados a partir dos módulos atuais do projeto para manter correspondência direta com o código existente.

| Logger            | Campo `module` | Uso recomendado                      |
| ----------------- | -------------- | ------------------------------------ |
| `logger`          | (nenhum)       | Uso genérico quando não houver outro |
| `authLogger`      | `auth`         | Fluxos de autenticação/login/logout  |
| `dashboardLogger` | `dashboard`    | Widgets e dados do dashboard         |
| `usersLogger`     | `users`        | Lista/detalhe de usuários            |
| `httpLogger`      | `http`         | Cliente HTTP (ex.: ky)              |
| `commonLogger`    | `common`       | Componentes compartilhados/infra UI  |

### Procedimento automatizado para novos loggers

1. Descobrir módulos: listar diretórios imediatos em `src/modules` e usar o nome de cada pasta como `module` do logger. Ex.: `src/modules/payments` → `paymentsLogger` com `module: "payments"`.
2. Infra auxiliar: incluir loggers para pastas de infra relevantes (hoje `src/infra/http` → `httpLogger`; se surgir `src/infra/<nome>`, replicar o padrão).
3. Criar loggers: em `logs.ts`, adicionar `logger.child({ module: '<nome>' })` para cada módulo encontrado e exportar em `index.ts` como `<nome>Logger`.
4. Documentar: atualizar a tabela acima com cada logger criado e seu uso recomendado.
5. Fallback: quando não houver logger específico, usar `logger` genérico.

### Exemplo de uso

```ts
import { authLogger, dashboardLogger } from "@/utils/logs";

// Mensagem simples
authLogger.info("Usuário logado com sucesso");

// Com objeto de contexto (aparece como "extras" no log)
dashboardLogger.info({ widget: "stats" }, "Dashboard carregado");

// Erro (stack formatada em dev)
authLogger.error({ err: new Error("Token inválido") }, "Falha na validação");
```

---

## Formatação

### Desenvolvimento

- **Stream:** `createPrettyStream()` em `pinoStream.ts`.
- **Fluxo:** Pino escreve JSON por linha → `pinoDevFormatter` parseia e chama `formatPrettyLog` → saída com ícone, `[timestamp]`, `[module:context]`, mensagem e extras em dim; se houver `err`, tipo, mensagem e até 5 linhas do stack.
- **Timestamp:** `toLocaleString('pt-BR', { day, month, year, hour, minute, second, hour12: false })`.

### Produção

- Sem pretty stream: Pino escreve JSON puro no stdout (uma linha por evento), ideal para pipelines e agregadores.

---

## Segurança (redação)

O logger está configurado com:

```ts
redact: ["password", "token", "secret", "authorization"];
```

Qualquer campo com um desses nomes (em qualquer nível do objeto) é substituído por `[Redacted]` na saída, evitando vazamento em logs.

---

## Testes

- **logs.spec.ts:** Testa `pinoDevFormatter`:
    - Formatação de log JSON com ícone, mensagem, timestamp e campos extras.
    - Fallback: se o chunk não for JSON válido, retorna o chunk original (fail-safe).

Execução:

```bash
npm test -- src/utils/logs
```

---

## Onde é (ou será) usado no projeto

- **Auth:** fluxos de login/logout/callback (`modules/auth`).
- **Dashboard:** cards e métricas (`modules/dashboard`).
- **Users:** listas e detalhes de usuários (`modules/users`).
- **Common:** componentes compartilhados (`modules/common`).
- **HTTP:** cliente `ky` em `src/infra/http`.

Para novos módulos, use o logger correspondente ao diretório. Se criar um módulo novo, replique o padrão: adicione `logger.child({ module: 'nome' })` em `logs.ts`, exporte em `index.ts` e documente na tabela acima.
