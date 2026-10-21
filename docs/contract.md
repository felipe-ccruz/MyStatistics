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

**Nenhuma, hoje.** Todas as rotas são públicas e não existe usuário no banco. Contas estão planejadas na ACCEPTANCE §5.1.1, com método e mecanismo ainda em aberto (§7). O que o ACCEPTANCE já fixa para quando entrar:

- rota de dados sem sessão → `401` com `code: "UNAUTHORIZED"`;
- recurso de outro usuário → `404 NOT_FOUND`, nunca `403`.

Os detalhes entram aqui no `feat:` de contas.

## Erros

Shape único: `ApiError`, em [packages/shared/src/error.ts](../packages/shared/src/error.ts). O server produz via `HttpError` + `errorHandler`, em [apps/server/src/errors.ts](../apps/server/src/errors.ts). `message` é texto em pt-BR pronto pra exibir; `code` identifica a falha.

| `code` | Status | Quando |
| --- | --- | --- |
| `VALIDATION` | 422 | body ou params não batem com o schema TypeBox |
| `PARSE` | 400 | corpo da requisição não é JSON válido (qualquer rota com body) |
| `NOT_FOUND` | 404 | rota inexistente, ou recurso com id inexistente |
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

### Atividades — [apps/server/src/routes/activities.ts](../apps/server/src/routes/activities.ts)

Tipos em [activity.ts](../packages/shared/src/activity.ts) e schemas em [activity-schema.ts](../packages/shared/src/activity-schema.ts). As regras de negócio (duração = `hours*60 + minutes` > 0, `date` omitida = hoje, `hours`/`minutes` juntos no PATCH) estão nos comentários do schema e na ACCEPTANCE §5.6.

| Método | Rota | Request | Response | Status |
| --- | --- | --- | --- | --- |
| POST | `/api/activities` | body `CreateActivity` | `Activity` | `201` · `422 VALIDATION` · `422 INVALID_DURATION` |
| GET | `/api/activities` | — | `Activity[]` (por `date` desc, depois `id` desc) | `200` |
| GET | `/api/activities/:id` | — | `Activity` | `200` · `404 NOT_FOUND` · `422 VALIDATION` (id não numérico) |
| PATCH | `/api/activities/:id` | body `UpdateActivity` | `Activity` | `200` · `404 NOT_FOUND` · `422 VALIDATION` · `422 INVALID_DURATION` · `422 EMPTY_UPDATE` |
| DELETE | `/api/activities/:id` | — | sem corpo | `204` · `404 NOT_FOUND` |

## Como mudar o contrato

1. O manager define a mudança comigo (Regra 1 do CLAUDE.md, se for `feat:`).
2. Na mesma mudança: schema/tipo em `packages/shared` (exportado no [index.ts](../packages/shared/src/index.ts)) **e** a tabela de rotas aqui.
3. `pnpm typecheck` — o que quebrar é o que precisa se adaptar.
4. Commit do contrato (`feat: add <x> contract to shared`) **antes** de disparar os agentes: worktree nasce de um commit, e contrato não commitado não chega neles.
5. Back e front constroem contra ele. Precisaram de mais? Vira pendência no relatório e volta pro passo 1.
