# Contrato front ↔ back

> Ponto de entrada do contrato entre `apps/web` e `apps/server`. Backend e frontend tratam este arquivo — e os arquivos para os quais ele aponta — como **fonte da verdade**.
>
> **Quem altera:** só o manager (a sessão principal), antes de disparar os agentes. Ver "Time de agentes" no [CLAUDE.md](../CLAUDE.md).

## Onde a verdade mora

Este arquivo **não redeclara** formato de dado. Ele aponta:

| O quê | Fonte da verdade |
| --- | --- |
| Formato dos dados (request, response, erro) | [`packages/shared/src`](../packages/shared/src/index.ts) — schemas TypeBox e tipos, importados pelos dois lados via `@mystatistics/shared` |
| Lista de rotas, status HTTP e códigos de erro | Este arquivo (seção **Rotas**) |
| Spec do que o server realmente expõe | OpenAPI gerado pelo `@elysiajs/openapi` a partir das rotas: `/api/docs` (UI) e `/api/docs/json`. Serve pra **conferir** — não se edita. |

Divergência entre este arquivo e o código do server é bug: avise o manager.

## Convenções

- **Prefixo:** tudo sob `/api`. O front chama `/api/...` relativo (proxy do Vite → `:3333`), nunca `http://localhost:3333`.
- **Request com body (POST/PUT/PATCH):** schema TypeBox em `shared`, obrigatório. O server valida com `{ body: Schema }`; o front tipa com o tipo de mesmo nome (`typeof Schema.static`).
- **Response:** tipo em `shared`; o handler anota o retorno (ex.: `Promise<Activity>`).
- **Datas:** dia de calendário `"YYYY-MM-DD"` — sem hora, sem fuso (ACCEPTANCE §6).
- **IDs:** inteiros; no path, validados com `t.Numeric()`.
- **Sucesso sem corpo:** `204`.

## Autenticação

E-mail + senha com **Better Auth** no server ([apps/server/src/auth](../apps/server/src/auth/)). A lib cuida do hash da senha, das sessões e do cookie; ela é chamada por `auth.api.*` **dentro do nosso controller**. O handler HTTP do Better Auth não é montado, então todas as rotas `/api/auth/*` são as nossas (tabela abaixo), com schema TypeBox no `shared` e erro no shape único `ApiError`.

- **Sessão:** cookie definido pelo Better Auth (httpOnly, `SameSite=Lax`, `Secure` em produção, validade de 30 dias). O front não lê nem escreve o cookie: as chamadas vão por `/api/...` relativo (mesma origem) e o navegador o envia sozinho.
- **Quem está logado:** `GET /api/auth/me` devolve `Me` ([auth.ts](../packages/shared/src/auth.ts)), ou `401 UNAUTHORIZED` sem sessão.
- **Rotas de dados exigem sessão:** sem cookie válido → `401` com `code: "UNAUTHORIZED"`.
- **Isolamento:** recurso de outro usuário → `404 NOT_FOUND`, nunca `403` (ACCEPTANCE §4).
- **Ids:** o id de usuário é `string` (gerado pelo Better Auth). Os demais ids continuam inteiros.

## Erros

Shape único: `ApiError`, em [packages/shared/src/error.ts](../packages/shared/src/error.ts). O server produz lançando as classes de [apps/server/src/shared/infra/errors](../apps/server/src/shared/infra/errors/) (todas estendem `HttpError`), formatadas pelo `errorHandler` global. `message` é texto em **inglês** pronto pra exibir na UI; `code` identifica a falha (é por ele que o front decide onde mostrar o erro).

| `code` | Status | Quando |
| --- | --- | --- |
| `VALIDATION` | 422 | body ou params não batem com o schema TypeBox |
| `PARSE` | 400 | corpo da requisição não é JSON válido (qualquer rota com body) |
| `UNAUTHORIZED` | 401 | rota que exige sessão chamada sem cookie de sessão válido |
| `INVALID_CREDENTIALS` | 401 | login com e-mail inexistente ou senha errada (mesma resposta nos dois casos) |
| `EMAIL_TAKEN` | 409 | cadastro com e-mail que já tem conta |
| `SLUG_TAKEN` | 409 | cadastro com `slug` que já é de outro perfil |
| `NOT_FOUND` | 404 | rota inexistente, recurso com id inexistente, ou recurso de outro usuário |
| `METRIC_NAME_TAKEN` | 409 | métrica com nome que o usuário já usa (sem diferenciar maiúsculas) |
| `FUTURE_DATE` | 422 | registro de métrica com data depois de hoje |
| `INVALID_DURATION` | 422 | atividade com duração zero, ou `hours`/`minutes` sem o par no PATCH |
| `EMPTY_UPDATE` | 422 | PATCH sem nenhum campo a mudar |
| `INTERNAL` | 500 | qualquer outra falha |

## Rotas

### Infra

| Método | Rota | Request | Response | Status |
| --- | --- | --- | --- | --- |
| GET | `/api/health` | — | `HealthResponse` | `200` banco ok · `503` banco fora (`db: "down"`) |
| GET | `/api/docs` | — | UI do OpenAPI | `200` |
| GET | `/api/docs/json` | — | spec OpenAPI (JSON) | `200` |

### Exemplo (herdado do scaffold)

| Método | Rota | Request | Response | Status |
| --- | --- | --- | --- | --- |
| GET | `/api/hello` | — | `HelloResponse` | `200` |
| PUT | `/api/hello` | — | `HelloResponse` | `200` |
| GET | `/api/hello/:name` | — | `HelloResponse` | `200` |

### Autenticação — [apps/server/src/auth/infra/auth.controller.ts](../apps/server/src/auth/infra/auth.controller.ts)

Tipos em [auth.ts](../packages/shared/src/auth.ts) e schemas em [auth-schema.ts](../packages/shared/src/auth-schema.ts).

| Método | Rota | Request | Response | Status |
| --- | --- | --- | --- | --- |
| POST | `/api/auth/signup` | body `SignUp` | `Me` + `Set-Cookie` (já entra logado, perfil `private`) | `201` · `422 VALIDATION` · `409 EMAIL_TAKEN` · `409 SLUG_TAKEN` |
| POST | `/api/auth/login` | body `SignIn` | `Me` + `Set-Cookie` | `200` · `422 VALIDATION` · `401 INVALID_CREDENTIALS` |
| POST | `/api/auth/logout` | — | sem corpo; limpa o cookie | `204` (também sem sessão) |
| GET | `/api/auth/me` | — | `Me` | `200` · `401 UNAUTHORIZED` |

### Atividades — [apps/server/src/activities/infra/activity.controller.ts](../apps/server/src/activities/infra/activity.controller.ts)

Tipos em [activity.ts](../packages/shared/src/activity.ts) e schemas em [activity-schema.ts](../packages/shared/src/activity-schema.ts). As regras de negócio (duração = `hours*60 + minutes` > 0, `date` omitida = hoje, `hours`/`minutes` juntos no PATCH) estão nos comentários do schema e na ACCEPTANCE §5.6.

**Todas exigem sessão** (`401 UNAUTHORIZED` sem cookie) e só enxergam as atividades do usuário logado: id de atividade de outro usuário responde `404 NOT_FOUND`, como se não existisse.

| Método | Rota | Request | Response | Status |
| --- | --- | --- | --- | --- |
| POST | `/api/activities` | body `CreateActivity` | `Activity` | `201` · `401` · `422 VALIDATION` · `422 INVALID_DURATION` |
| GET | `/api/activities` | — | `Activity[]` do usuário (por `date` desc, depois `id` desc) | `200` · `401` |
| GET | `/api/activities/:id` | — | `Activity` | `200` · `401` · `404 NOT_FOUND` · `422 VALIDATION` (id não numérico) |
| PATCH | `/api/activities/:id` | body `UpdateActivity` | `Activity` | `200` · `401` · `404 NOT_FOUND` · `422 VALIDATION` · `422 INVALID_DURATION` · `422 EMPTY_UPDATE` |
| DELETE | `/api/activities/:id` | — | sem corpo | `204` · `401` · `404 NOT_FOUND` |
| GET | `/api/activities/summary?period=7d\|30d` | query `ActivitySummaryQuery` | `ActivitySummary` | `200` · `401` · `422 VALIDATION` (período fora da lista) |

O resumo ([activity-summary.ts](../packages/shared/src/activity-summary.ts)) cobre o período que termina hoje (dia de calendário do server) e o compara com o período anterior de mesmo tamanho. `perDay` traz **todos** os dias do período, com 0 nos dias vazios.

### Progresso — `apps/server/src/progress/infra/progress.controller.ts`

Tipos e constantes das regras (taxas de XP, metas e recompensas da daily quest, curva de nível, ranks, classes) em [progress.ts](../packages/shared/src/progress.ts). O cálculo é do server (decisão D6), por funções puras testadas em `apps/server/src/progress/domain/`. O front só usa as constantes para a prévia de XP e o texto das regras.

| Método | Rota | Request | Response | Status |
| --- | --- | --- | --- | --- |
| GET | `/api/progress` | — | `Progress` do usuário logado | `200` · `401` |

### Métricas e registros — `apps/server/src/metrics/infra/`

Tipos em [metric.ts](../packages/shared/src/metric.ts) e schemas em [metric-schema.ts](../packages/shared/src/metric-schema.ts). Sem edição no MVP (decisão D8). **Todas exigem sessão** (`401`); métrica ou registro de outro usuário → `404 NOT_FOUND`. Apagar a métrica apaga os registros dela.

| Método | Rota | Request | Response | Status |
| --- | --- | --- | --- | --- |
| GET | `/api/metrics` | — | `Metric[]` (por `name`) | `200` · `401` |
| POST | `/api/metrics` | body `CreateMetric` | `Metric` | `201` · `401` · `422 VALIDATION` · `409 METRIC_NAME_TAKEN` |
| DELETE | `/api/metrics/:id` | — | sem corpo | `204` · `401` · `404 NOT_FOUND` |
| GET | `/api/metrics/:id/entries` | — | `Entry[]` (por `date` desc, depois `id` desc) | `200` · `401` · `404 NOT_FOUND` |
| POST | `/api/metrics/:id/entries` | body `CreateEntry` | `Entry` | `201` · `401` · `404 NOT_FOUND` · `422 VALIDATION` · `422 FUTURE_DATE` |
| DELETE | `/api/metrics/:id/entries/:entryId` | — | sem corpo | `204` · `401` · `404 NOT_FOUND` |

## Como mudar o contrato

1. O manager define a mudança comigo (Regra 1 do CLAUDE.md, se for `feat:`).
2. Na mesma mudança: schema/tipo em `packages/shared` (exportado no [index.ts](../packages/shared/src/index.ts)) **e** a tabela de rotas aqui.
3. `pnpm typecheck` — o que quebrar é o que precisa se adaptar.
4. Commit do contrato (`feat: add <x> contract to shared`) **antes** de disparar os agentes: worktree nasce de um commit, e contrato não commitado não chega neles.
5. Back e front constroem contra ele. Precisaram de mais? Vira pendência no relatório e volta pro passo 1.
