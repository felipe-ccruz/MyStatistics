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
- Todo tipo que cruza a fronteira front↔back mora em [packages/shared](packages/shared/src/index.ts) — ver **Contrato front↔back** abaixo.
- Alias `@/` aponta pro `src/` do próprio app (`@/components/ui/button`).

## Contrato front↔back

`packages/shared` é a **fonte única da verdade** do que cruza a fronteira. Front e back nunca combinam o formato de um dado por fora: um lado define aqui, o outro importa. Se o contrato muda, os dois quebram no `typecheck` na mesma hora — desalinhamento vira erro de compilação, não bug.

- **Contrato com body de request (POST/PUT/PATCH): schema TypeBox, obrigatório.** Defina o schema em `shared` e derive o tipo dele:
  ```ts
  // packages/shared/src/metric.ts
  import { t } from "elysia"; // TypeBox; casa 1:1 com a validação do Elysia
  export const CreateMetric = t.Object({
    name: t.String({ minLength: 1 }),
    unit: t.String(),
  });
  export type CreateMetric = typeof CreateMetric.static;
  ```
  O server usa o **mesmo** schema na validação da rota (`{ body: CreateMetric }`) — validação de verdade em runtime, não só `satisfies`. O front tipa o form com `CreateMetric`. O que o front manda é exatamente o que o server aceita.
- **Contrato só de response** (ex.: `HealthResponse`) pode ser `type` puro; use schema quando quiser que o server valide também o que devolve.
- **Formato de erro é único.** Toda rota que falha responde o mesmo shape (ver ACCEPTANCE.md §6). O front trata um formato só.
- **Nunca** redeclare à mão, em `apps/web` ou `apps/server`, o formato de algo que já é contrato. Faltou o tipo? Cria em `shared` primeiro, em commit próprio, **antes** de quem consome.

## Agentes e fronteiras

O front tem um agente próprio ([.claude/agents/frontend.md](.claude/agents/frontend.md)). A divisão de território evita que os dois se atropelem:

- **`apps/web`** → dono é o agente de **front**.
- **`apps/server`** → dono é o **back**.
- **`packages/shared`** → **zona compartilhada**. Mudança aqui é mudança de contrato: commita o contrato primeiro, depois cada lado constrói contra ele — em paralelo, sem um esperar o outro.

## Comandos (sempre da raiz, nunca entre nas pastas)

| Comando | O que faz |
| --- | --- |
| `pnpm dev` | Sobe front e back juntos, logs prefixados `[web]` / `[server]` |
| `pnpm dev:web` | Só o front (:5173) |
| `pnpm dev:server` | Só a API (:3333) |
| `pnpm build` | Build de todos os pacotes |
| `pnpm typecheck` | `tsc --noEmit` em todos os pacotes |
| `pnpm --filter @mystatistics/server test` | Testes do server: unitários + integração (precisa do `pnpm db:up`). Só um tipo: `test:unit` / `test:integration` |
| `pnpm db:up` / `pnpm db:down` | Sobe/derruba os Postgres do [docker-compose.yml](docker-compose.yml): `db` (dev) e `db-test` (testes de integração, `:5434`) |
| `pnpm db:generate` | Gera a migração SQL a partir dos `*.schema.ts` dos módulos do server |
| `pnpm db:migrate` | Aplica as migrações pendentes no banco |
| `pnpm db:studio` | Abre o Drizzle Studio pra inspecionar o banco |

- **Gerenciador de pacotes é o `pnpm`.** Nunca rode `bun install` nem `npm install` — quebra o lockfile. Para instalar em um app: `pnpm --filter @mystatistics/web add <pkg>`.
- O **runtime** é o Bun (`bun --hot` no server, `bun test` nos testes). O Vite roda o front.

## Convenções de código

- TypeScript **strict**, incluindo `noUncheckedIndexedAccess`. Nada de `any` — se o tipo não fecha, resolva o tipo.
- Componentes de UI: use os de [apps/web/src/components/ui](apps/web/src/components/ui/) (shadcn). Novos via `pnpm dlx shadcn@latest add <componente>` rodado dentro de `apps/web`.
- Estilo: Tailwind. Não escreva CSS solto se der pra fazer com utility class.

## Backend

O server é organizado em **módulos por feature**. O módulo [activities](apps/server/src/activities/) é a referência: módulo novo segue a mesma forma, arquivo por arquivo.

```
apps/server/src/
├── app.ts                  Sobe o Elysia: prefixo /api, docs, /health e o app.routes
├── app.routes.ts           Registro dos controllers — módulo novo entra aqui com .use()
├── <modulo>/
│   ├── domain/             <nome>.schema.ts (tabela Drizzle) · <nome>.types.ts (TypeBox só do server)
│   │                       <nome>.mapper.ts (linha do banco → DTO do contrato) · regras puras + *.unit.test.ts
│   ├── application/        <verbo>-<nome>.usecase.ts, um por operação, com o *.usecase.integration.test.ts ao lado
│   └── infra/              <nome>.controller.ts (HTTP) · <nome>.repository.ts (queries)
└── shared/                 Transversal do server — não confundir com packages/shared
    ├── infra/              base.controller.ts · databases/postgres.ts · env/env.ts · errors/
    └── utils/test-helpers/ integration-test-helper.ts
```

- **Cada camada faz uma coisa.** O **controller** valida a entrada com os schemas, chama o use case e define o status — sem regra nem query. O **use case** tem a regra de negócio e lança os erros de `shared/infra/errors`. O **repository** é uma classe de métodos estáticos que só fazem query, cada um com `tx?` opcional como último parâmetro.
- **Controller nasce de `createController({ prefix, tags })`** ([base.controller.ts](apps/server/src/shared/infra/base.controller.ts)), com `detail.summary` em cada rota — é o que aparece em `/api/docs`. O prefixo `/api` já é global.
- **Erro é classe.** `NotFoundError`, `UnprocessableEntityError(message, code)` e as próximas estendem `HttpError`; o handler global formata no shape único. Status novo = classe nova em [shared/infra/errors](apps/server/src/shared/infra/errors/).
- **Use case que lê e depois escreve abre `db.transaction`** e passa o `tx` para todo método do repository chamado dentro dela.
- **Drizzle ORM** fala com o Postgres. Nada de SQL solto: a tabela fica no `domain/<nome>.schema.ts` do módulo (o drizzle-kit acha todo `*.schema.ts` de `src`) e as queries só no repository, usando o `db` de [postgres.ts](apps/server/src/shared/infra/databases/postgres.ts).
- **Mudou o schema? Gere a migração.** `pnpm db:generate` e depois `pnpm db:migrate`. Migração é versionada e vai no commit — nunca altere a tabela na mão pelo Studio.
- **Env**: o `.env` fica na **raiz**, não em `apps/server`. As variáveis são validadas na subida em [env.ts](apps/server/src/shared/infra/env/env.ts) — se faltar uma, o server morre na hora com mensagem clara, e é isso que a gente quer.
- Se o banco cair, `/api/health` responde `503` com `db: "down"`. Rotas novas não devem esconder falha de banco atrás de `200`.
- **Testes.** Regra pura ganha `*.unit.test.ts`, sem banco. Cada use case ganha `*.usecase.integration.test.ts`, contra o `db-test` (via [.env.test](.env.test)). O `IntegrationTestHelper` recria o schema a partir das migrações e se recusa a rodar fora de um banco `*_test`.
- Antes de dizer que terminou: rode `pnpm typecheck`. Se mexeu em algo que roda, suba com `pnpm dev` e confira de verdade — não afirme que funciona sem ter visto funcionar.

---

## Time de agentes

Os agentes ficam em [.claude/agents/](.claude/agents/), versionados. Cada um começa **sem contexto**: só sabe o que está no arquivo dele, neste CLAUDE.md, no [ACCEPTANCE.md](ACCEPTANCE.md), no [docs/contract.md](docs/contract.md) e no pedido. Por isso o pedido pra um subagent tem que ser autossuficiente.

| Agente | Papel | Escreve em | Isolamento |
| --- | --- | --- | --- |
| **manager** (sessão principal) | Conversa comigo, define o contrato, dispara e consolida | `packages/shared`, `docs/contract.md`, `ACCEPTANCE.md`; merge | — |
| [backend](.claude/agents/backend.md) | Rotas, regras de negócio, banco, migrações | `apps/server` | worktree |
| [frontend](.claude/agents/frontend.md) | Telas, componentes, chamada à API | `apps/web` | worktree |
| [reviewer](.claude/agents/reviewer.md) | Revisa os diffs e valida com testes | só `*.test.ts` em `apps/server`, sem commit | — |
| [explainer](.claude/agents/explainer.md) | Me explica, em linguagem simples, o que foi feito | nada (só lê) | — |

**A sessão principal é o manager.** Subagents não conseguem disparar outros subagents, então coordenar é trabalho só dela.

### Fluxo padrão

1. **Manager define/atualiza o contrato.** Em `feat:`, antes vem a Regra 1 (investiga, pergunta, espera minha confirmação). Depois escreve o contrato em `packages/shared` + [docs/contract.md](docs/contract.md), roda `pnpm typecheck` e **commita o contrato** com o meu ok (Regra 2). Worktree nasce de commit: contrato não commitado não chega nos agentes.
2. **Backend e frontend em paralelo**, cada um no próprio worktree e branch. Cada um commita na própria branch e devolve o relatório, com branch, caminho do worktree e último commit.
3. **Reviewer revisa e testa** as duas branches. Recebe do manager as branches, os caminhos dos worktrees e os relatórios. Devolve os achados por severidade e um veredito.
4. **Manager consolida.** Resolve as pendências (pedido de contrato volta pro passo 1), me mostra o resultado, faz o merge **quando eu pedir**, atualiza o ACCEPTANCE.md com os critérios propostos e confere o sistema integrado de verdade: `pnpm typecheck`, testes do server, `pnpm dev` e o fluxo no navegador (os subagents não têm navegador).

O **explainer** fica fora do fluxo: só é chamado quando eu pedir explicitamente ("explica", "chama o explicador").

### Regras do fluxo

- **Contrato e critérios têm dono único.** No fluxo de agentes, só o manager escreve em `packages/shared`, `docs/contract.md` e `ACCEPTANCE.md`. Isso detalha a "zona compartilhada" de **Agentes e fronteiras**: back e front trabalham em branches paralelas, e se os dois mexessem no contrato ele divergiria e o merge conflitaria. Precisou mudar? Vira pendência no relatório.
- **Commits dos agentes.** Backend e frontend estão autorizados a commitar **na própria branch do worktree**. A Regra 2 vale inteira (commits pequenos, `<tipo>: <imperativo>`, sem co-autoria). Nunca em `main`, nunca merge, nunca `push`. O reviewer não commita: deixa os testes no worktree e lista no relatório.
- **Worktrees** ficam em `.claude/worktrees/`, ignorado no git. O [.worktreeinclude](.worktreeinclude) copia o `.env` local pra eles. O `node_modules` não vem junto: o primeiro passo do agente no worktree é `pnpm install --frozen-lockfile`.
- **Recursos compartilhados.** Todos os worktrees usam os **mesmos** Postgres (`db` e `db-test`) e as **mesmas** portas (`:3333`, `:5173`). Agente não mata processo que não subiu (nada de `taskkill //IM bun.exe`), informa as migrações que aplicou no banco local e não roda a suíte de integração ao mesmo tempo que outro agente (ela recria o schema do `db-test`).
- **Testes só no server.** Só o `apps/server` tem testes (unitários e de integração); `apps/web` e `packages/shared` não têm. Rode `pnpm --filter @mystatistics/server test` com o `pnpm db:up` de pé — não rode `pnpm test` da raiz.
