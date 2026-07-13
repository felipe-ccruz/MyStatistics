# MyStatistics

Aplicação pessoal para registrar métricas do dia a dia, registros pessoais e estatísticas de estudo — e transformar isso em análise (tendências, médias, comparação entre períodos).

Monorepo pnpm com Bun como runtime.

```
apps/web         React 19 + Vite + Tailwind 4 + shadcn/ui   → http://localhost:5173
apps/server      Bun + Elysia + Drizzle (Postgres)          → http://localhost:3333
packages/shared  Contratos de API compartilhados
```

## Rodando

```bash
cp .env.example .env
pnpm install
pnpm db:up      # sobe o Postgres
pnpm dev        # sobe front e server juntos
```

Todos os comandos rodam da **raiz** — não é preciso entrar nas pastas.

| Comando | O que faz |
| --- | --- |
| `pnpm dev` | Front + server juntos |
| `pnpm dev:web` | Só o front |
| `pnpm dev:server` | Só a API |
| `pnpm typecheck` | Checagem de tipos em todos os pacotes |
| `pnpm test` | Testes |
| `pnpm build` | Build de produção |
| `pnpm db:up` / `pnpm db:down` | Postgres via Docker |
| `pnpm db:generate` / `pnpm db:migrate` | Gera e aplica migrações (Drizzle) |
| `pnpm db:studio` | Drizzle Studio |

O front chama `/api/...` e o Vite faz proxy para a API — o front nunca conhece a porta do server.

## Documentos

- [ACCEPTANCE.md](ACCEPTANCE.md) — critérios de aceite: o que a aplicação precisa fazer e quando uma feature está pronta.
- [CLAUDE.md](CLAUDE.md) — regras de trabalho da IA neste repositório.
