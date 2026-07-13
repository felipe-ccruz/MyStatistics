# CLAUDE.md

Regras de operação da IA neste projeto. Leia antes de qualquer alteração.

## Idioma

Converse comigo em **português (pt-BR)**. Código, nomes de variáveis e mensagens de commit em inglês.

---

## Regra 1 — Prompts com prefixo `feat:`

Quando eu iniciar uma mensagem com **`feat:`**, é uma nova feature. **Não comece a implementar.**

Antes de escrever qualquer código:

1. **Investigue primeiro.** Leia o código existente que a feature toca e o [ACCEPTANCE.md](ACCEPTANCE.md). Não me pergunte o que você consegue descobrir sozinho lendo o repositório.
2. **Faça perguntas detalhadas** até a decisão ser mútua. Cubra o que ainda estiver ambíguo:
   - **Escopo**: o que está dentro e o que fica de fora desta entrega?
   - **Comportamento**: fluxo feliz, casos de borda, o que acontece quando dá erro ou o dado não existe?
   - **Contrato**: quais rotas/tipos entram em `packages/shared`? Qual formato de request/response?
   - **UI**: onde a feature vive na interface, quais estados (vazio, carregando, erro)?
   - **Dados**: de onde vêm, onde persistem, o que acontece no reload?
   - **Trade-offs**: quando houver mais de um caminho, apresente as opções com o custo de cada uma e **recomende uma**, com o motivo.
3. **Só implemente depois que eu confirmar.** Ambiguidade não resolvida vira pergunta, nunca suposição silenciosa.
4. **Feche o ciclo**: ao terminar a feature, atualize o [ACCEPTANCE.md](ACCEPTANCE.md) com os critérios de aceite dela.

Prompts **sem** o prefixo `feat:` (bugs, refactors, dúvidas, ajustes) seguem o fluxo normal: aja direto, pergunte só se estiver genuinamente travado.

## Regra 2 — Commits

- **Commits objetivos.** Padrão: `<tipo>: <o que mudou, no imperativo>`. Tipos: `feat`, `fix`, `refactor`, `chore`, `docs`, `test`, `style`.
- **Nunca se coloque como co-autor.** Sem `Co-Authored-By`, sem `Generated with Claude Code`, sem emoji de robô, sem assinatura de nenhum tipo no corpo da mensagem.
- **Commits separados e pequenos.** Quebre a feature em commits que contam a história dela na ordem em que foi construída — cada um deve fazer sentido sozinho. Prefira vários commits coesos a um commit gigante.
  - Ex.: `feat: add dataset type to shared contracts` → `feat: add GET /api/datasets endpoint` → `feat: render dataset list on dashboard`.
- Não misture refactor com feature no mesmo commit.
- Só faça commit quando eu pedir. Não dê `push` sem eu pedir.

---

## Estrutura do projeto

Monorepo com **pnpm workspaces** para gerenciar dependências e **Bun** como runtime por baixo.

```
MyStatistics/
├── apps/
│   ├── web/         React 19 + Vite + Tailwind 4 + shadcn/ui  → :5173
│   └── server/      Bun + Elysia + Drizzle (Postgres)         → :3333
├── packages/
│   └── shared/      Tipos e contratos de API (front ↔ back)
├── ACCEPTANCE.md    Critérios de aceite da aplicação
├── CLAUDE.md
├── docker-compose.yml  Postgres                              → :5432
├── package.json     Scripts da raiz
├── pnpm-workspace.yaml
└── tsconfig.base.json
```

- O front **não** chama `http://localhost:3333` na mão. Ele chama `/api/...` relativo, e o Vite faz proxy pro server (ver [apps/web/vite.config.ts](apps/web/vite.config.ts)).
- Todo tipo que cruza a fronteira front↔back mora em [packages/shared](packages/shared/src/index.ts). O server valida com `satisfies`, o front importa o mesmo tipo.
- Alias `@/` aponta pro `src/` do próprio app (`@/components/ui/button`).

## Comandos (sempre da raiz, nunca entre nas pastas)

| Comando | O que faz |
| --- | --- |
| `pnpm dev` | Sobe front e back juntos, logs prefixados `[web]` / `[server]` |
| `pnpm dev:web` | Só o front (:5173) |
| `pnpm dev:server` | Só a API (:3333) |
| `pnpm build` | Build de todos os pacotes |
| `pnpm typecheck` | `tsc --noEmit` em todos os pacotes |
| `pnpm test` | Testes de todos os pacotes (`bun test`) |
| `pnpm db:up` / `pnpm db:down` | Sobe/derruba o Postgres do [docker-compose.yml](docker-compose.yml) |
| `pnpm db:generate` | Gera a migração SQL a partir do [schema.ts](apps/server/src/db/schema.ts) |
| `pnpm db:migrate` | Aplica as migrações pendentes no banco |
| `pnpm db:studio` | Abre o Drizzle Studio pra inspecionar o banco |

- **Gerenciador de pacotes é o `pnpm`.** Nunca rode `bun install` nem `npm install` — quebra o lockfile. Para instalar em um app: `pnpm --filter @mystatistics/web add <pkg>`.
- O **runtime** é o Bun (`bun --hot` no server, `bun test` nos testes). O Vite roda o front.

## Convenções de código

- TypeScript **strict**, incluindo `noUncheckedIndexedAccess`. Nada de `any` — se o tipo não fecha, resolva o tipo.
- Componentes de UI: use os de [apps/web/src/components/ui](apps/web/src/components/ui/) (shadcn). Novos via `pnpm dlx shadcn@latest add <componente>` rodado dentro de `apps/web`.
- Estilo: Tailwind. Não escreva CSS solto se der pra fazer com utility class.

## Backend

- **Elysia** é o framework de rotas. Toda rota nova entra em [apps/server/src/index.ts](apps/server/src/index.ts) (ou num módulo Elysia próprio, montado com `.use()` quando o arquivo crescer). O prefixo `/api` já é global.
- **Drizzle ORM** fala com o Postgres. Nada de SQL solto espalhado: as tabelas ficam em [apps/server/src/db/schema.ts](apps/server/src/db/schema.ts) e as queries usam o `db` de [apps/server/src/db/index.ts](apps/server/src/db/index.ts).
- **Mudou o schema? Gere a migração.** `pnpm db:generate` e depois `pnpm db:migrate`. Migração é versionada e vai no commit — nunca altere a tabela na mão pelo Studio.
- **Env**: o `.env` fica na **raiz**, não em `apps/server`. As variáveis são validadas na subida em [apps/server/src/env.ts](apps/server/src/env.ts) — se faltar uma, o server morre na hora com mensagem clara, e é isso que a gente quer.
- Se o banco cair, `/api/health` responde `503` com `db: "down"`. Rotas novas não devem esconder falha de banco atrás de `200`.
- Antes de dizer que terminou: rode `pnpm typecheck`. Se mexeu em algo que roda, suba com `pnpm dev` e confira de verdade — não afirme que funciona sem ter visto funcionar.
