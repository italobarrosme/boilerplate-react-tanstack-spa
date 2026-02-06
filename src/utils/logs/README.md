# Logs

Utilitários de logging baseados em **Pino** com saída legível em desenvolvimento e JSON em produção.

## Arquivos

- `logs.ts`: configuração do logger base, redaction e criação dos loggers de módulo.
- `pinoStream.ts`: stream usado em desenvolvimento para aplicar a formatação amigável.
- `pinoFormatter.ts`: formatação de linha com timestamp pt-BR, escopo e extras.
- `index.ts`: re-exporta todos os loggers para uso via `@/utils/logs`.

## Uso

```ts
import { authLogger, dashboardLogger, httpLogger, logger } from "@/utils/logs";

authLogger.info("Usuário logado com sucesso");
dashboardLogger.debug({ widget: "stats" }, "Dados do dashboard carregados");
httpLogger.error({ err: new Error("Falha") }, "Erro na chamada HTTP");
logger.debug({ feature: "generic" }, "Log geral");
```

## Testes

```bash
npm test -- src/utils/logs
```
