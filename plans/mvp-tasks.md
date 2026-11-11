# Tasks do MVP

> Lista de tarefas, em ordem, para levar o MyStatistics até o **mínimo viável que cumpre o [ACCEPTANCE.md](../ACCEPTANCE.md)**, com o front seguindo o modelo [MyStatistics Dashboard.html](../MyStatistics%20Dashboard.html).
>
> **Para quem executa:** leia "Como usar este arquivo" e "Bibliotecas" antes da primeira task.

## Como usar este arquivo

### Leitura obrigatória, nesta ordem

1. [CLAUDE.md](../CLAUDE.md) — regras do projeto. **Se algo aqui contradizer o CLAUDE.md, o CLAUDE.md vence**: pare e avise.
2. [ACCEPTANCE.md](../ACCEPTANCE.md) — o que precisa funcionar. A §4 vale para toda task de feature.
3. [docs/contract.md](../docs/contract.md) — rotas, erros e onde o contrato mora.
4. [plans/pixel-art.md](pixel-art.md) — como a pixel art é feita (vale para todo o front).
5. O modelo HTML — ver T0.1 (ele é empacotado; precisa extrair para ler).

### Regras de execução

- **Uma task por vez, na ordem.** Não pule. Se uma task depende de outra não concluída, pare.
- **Decisões (Fase 0) são do usuário.** Cada fase lista as decisões de que depende. Se alguma estiver `⏳ pendente`, **pergunte ao usuário antes de começar a fase**, mostrando as opções e a recomendação. Registre a resposta na própria tabela (troque `⏳ pendente` por `✅ <escolha> (AAAA-MM-DD)`). Se a escolha for diferente da recomendação, ajuste as tasks afetadas **antes** de executá-las e diga ao usuário o que mudou.
- **Use as bibliotecas da seção "Bibliotecas".** Não reimplemente o que elas já resolvem (sessão, cache de requisição, validação de formulário, toast, diálogo, formatação de data, gráfico). Código à mão só para o que é do domínio do app (regras de XP, resumos, pixel art) ou quando a task disser explicitamente.
- **Instalação:** sempre `pnpm --filter <pacote> add <lib>` da raiz (nunca `npm`/`bun install`). Componentes shadcn: `pnpm dlx shadcn@latest add <componente>` **dentro de `apps/web`**. Antes de instalar, confira na documentação oficial a forma atual de configurar a lib; se ela divergir do que está aqui, siga a documentação e anote a diferença na task.
- **Marcar como concluída:** troque `- [ ]` por `- [x]` e acrescente ` — feito em AAAA-MM-DD`. Só marque depois que **todo** o "Pronto quando" foi verificado de verdade.
- **Commits:** a Regra 2 do CLAUDE.md vale. Cada task sugere a mensagem; **só commite quando o usuário pedir** (pergunte ao fim de cada task ou fase). Contrato (`packages/shared`) sempre em commit próprio, antes de quem o consome.
- **Verificação no navegador:** se você não tiver navegador, passe ao usuário o passo a passo do que conferir e só marque a task quando ele confirmar.
- **Comandos (sempre da raiz):** `pnpm typecheck` · `pnpm --filter @mystatistics/server test` (precisa de `pnpm db:up`) · `pnpm dev`. Nunca `pnpm test` da raiz.
- **Backend:** todo módulo novo segue o módulo `activities` (seção "Backend" do CLAUDE.md): `domain/` · `application/` (um use case por arquivo + teste de integração ao lado) · `infra/` (controller + repository), registrado em `app.routes.ts`.
- **Toda rota nova ou alterada** entra nas tabelas de rotas e de erros do `docs/contract.md` na mesma task.
- **Texto da UI em inglês** (ACCEPTANCE §6). O modelo está em português: traduza ao portar (glossário em T3.6).
- **Categorias:** o modelo usa `estudo`/`academia`/`alimentacao`. No oficial existem só `study` e `exercise`. Tudo o que é de `alimentacao` (ícone `apple`, VIT, HP, meta de 60 min) sai, salvo decisão D5 em contrário.

## Bibliotecas

Padrão de mercado para cada responsabilidade. "Já no projeto" = não instale de novo.

### Server (`apps/server`)

| Responsabilidade | Biblioteca | Situação | Onde entra |
| --- | --- | --- | --- |
| HTTP, rotas, cookies | **Elysia** | já no projeto | tudo |
| Validação de entrada | **TypeBox** (`t` do Elysia) | já no projeto | contratos em `shared` |
| ORM e migrações | **Drizzle ORM** + **drizzle-kit** | já no projeto | tabelas e queries |
| Driver Postgres | **postgres** (postgres.js) | já no projeto | `shared/infra/databases` |
| Autenticação (cadastro, login, sessão, hash de senha, rate limit) | **Better Auth** (`better-auth`) com o adapter do Drizzle, chamado por `auth.api.*` dentro do nosso controller (D1) | instalar em T1.3 | Fase 1 |
| Datas (somar dias, intervalo de período) | **date-fns** | instalar em T6.2 | regras de progresso e resumos |
| Documentação da API | **@elysiajs/openapi** | já no projeto | `/api/docs` |
| Testes | **bun:test** | já no projeto | unit + integração |

### Web (`apps/web`)

| Responsabilidade | Biblioteca | Situação | Onde entra |
| --- | --- | --- | --- |
| UI base | **React 19** + **Vite** | já no projeto | tudo |
| Estilo | **Tailwind CSS 4** + `clsx` + `tailwind-merge` (`cn`) | já no projeto | tudo |
| Componentes acessíveis | **shadcn/ui** (Radix por baixo) | já no projeto (button, card, input, label, select, textarea) | adicionar `dialog`, `sonner`, `switch`, `tabs`, `tooltip`, `form` conforme as tasks |
| Variantes de componente | **class-variance-authority** | já no projeto | `components/game` |
| Rotas | **React Router v7** (modo biblioteca) | instalar em T3.6 | `/`, `/login`, `/signup`, `/u/:slug` |
| Requisições e cache | **TanStack Query** (`@tanstack/react-query`) | instalar em T3.4 | toda leitura e mutação da API |
| Sessão no front | **TanStack Query** sobre as nossas rotas `/api/auth/*` (D1: o client do Better Auth não é usado) | T4.1 | cadastro, login, logout, sessão |
| Formulários | **React Hook Form** + **@hookform/resolvers** (resolver `typebox`) | instalar em T4.2 | todo formulário, validado com o **mesmo** schema TypeBox do server |
| Toast | **Sonner** (via `shadcn add sonner`) | instalar em T3.5 | feedback de sucesso e erro |
| Datas | **date-fns** | instalar em T5.2 | "today"/"yesterday", formatos, contagem regressiva |
| Gráficos | **Recharts** (via `shadcn add chart`) | instalar em T7.3 (conforme D3) | tempo por dia, resumos |
| Ícones genéricos (fechar, copiar, sair) | **lucide-react** | já no projeto | botões utilitários |
| Ícones do jogo e avatar | **kit de pixel art próprio** (`apps/web/src/pixel/`) | T3.3 | ver `plans/pixel-art.md` — é o único "à mão" do front, porque é a identidade do app |
| Fontes | **Fontsource** (`@fontsource/*`) | instalar em T3.2 | Inter, JetBrains Mono, Pixelify Sans, Silkscreen |

### Repositório

| Responsabilidade | Biblioteca | Situação | Onde entra |
| --- | --- | --- | --- |
| Lint e formatação | **Biome** (`@biomejs/biome`) | instalar em T0.3 (conforme D13) | raiz, todos os pacotes |

---

## Fase 0 — Preparação e decisões

- [x] **T0.1 — Extrair o modelo para leitura** — feito em 2026-11-11
  - O HTML é um pacote: o layout está num template JSON e os scripts estão em gzip+base64. Extraia para uma pasta temporária **fora do repositório** (não commite o resultado):
    ```bash
    python -I - "MyStatistics Dashboard.html" "<pasta-temporaria>" <<'EOF'
    import sys, re, json, base64, gzip, os
    s = open(sys.argv[1], encoding="utf-8").read(); out = sys.argv[2]; os.makedirs(out, exist_ok=True)
    block = lambda t: re.search(r'<script type="__bundler/' + t + r'">(.*?)</script>', s, re.S).group(1)
    open(os.path.join(out, "template.html"), "w", encoding="utf-8").write(json.loads(block("template")))
    for k, v in json.loads(block("manifest")).items():
        if v["mime"] == "text/javascript":
            raw = base64.b64decode(v["data"])
            open(os.path.join(out, k + ".js"), "wb").write(gzip.decompress(raw) if v.get("compressed") else raw)
    EOF
    ```
  - O que importa está em `template.html`: o markup (com bindings `{{ }}`), o `<style>` com os dois temas (`[data-dir="a"]` / `[data-dir="b"]`) e, no fim, o script com `ICONS`, `pix()`, `HALF`/`PAL` (avatar), as regras de XP/nível e os cálculos de streak, status e atributos. Os `.js` são só React/ReactDOM e o runtime do pacote.
  - **Pronto quando:** você consegue apontar no `template.html` onde ficam os keyframes, o `ICONS`, a função `levelOf`, o cálculo de `streak` e o modal "REGRAS DO SYSTEM".

- [x] **T0.2 — Confirmar as decisões com o usuário** — feito em 2026-11-11
  - Pergunte as decisões `⏳ pendente` da tabela abaixo (todas de uma vez, ou só as da próxima fase) e registre as respostas.
  - Registre as decisões travadas na §6 do ACCEPTANCE.md e remova da §7 as resolvidas. Itens de D12 vão para a §2 ("Fora de escopo").
  - **Pronto quando:** D1, D2, D4, D10, D11, D12 e D13 estão `✅`.
  - Commit: `docs: lock mvp decisions`

- [x] **T0.3 — Lint e formatação com Biome** *(D13 = Biome)* — feito em 2026-11-11
  - `pnpm add -Dw @biomejs/biome`, `biome.json` na raiz respeitando o estilo atual do código (aspas duplas, ponto e vírgula, 2 espaços, linha de 120 colunas), ignorando `apps/server/drizzle/`, `dist/` e o `MyStatistics Dashboard.html`. Scripts na raiz: `lint` (`biome check .`) e `format` (`biome format --write .`).
  - Rode o `format` uma vez e commite **só a formatação**, separada de qualquer outra mudança.
  - Acrescente `pnpm lint` à tabela de comandos do CLAUDE.md e às verificações do "Antes de dizer que terminou" dos agentes.
  - **Pronto quando:** `pnpm lint` passa sem erro; `pnpm typecheck` e os testes do server continuam passando.
  - Commits: `chore: add biome for lint and format` → `style: format codebase with biome`

### Decisões

| # | Decisão | Opções | Recomendação | Fase | Status |
| --- | --- | --- | --- | --- | --- |
| D1 | **Autenticação** | (a) **Better Auth** (e-mail + senha, sessão em cookie, adapter Drizzle) · (b) feita à mão (`Bun.password` + tabela de sessões) · (c) só login com Google | **(a) Better Auth**: é o padrão atual em TypeScript, traz hash de senha, sessão, cookie seguro e rate limit prontos, e tem adapter para Drizzle e integração documentada com Elysia. **Custo:** as rotas `/api/auth/*` respondem no formato de erro do Better Auth, não no `ApiError` — exige registrar essa exceção na §6 do ACCEPTANCE e no `docs/contract.md`; o front trata via o client do Better Auth. Login com Google pode entrar depois como plugin. | 1 | ✅ **Better Auth envolvido no nosso controller** (2026-11-11): o Better Auth cuida de hash, sessão, cookie e tabelas; as rotas `/api/auth/signup|login|logout|me` são nossas, com schemas TypeBox no `shared` e erro no `ApiError` (sem exceção ao formato único). O handler HTTP da lib **não** é montado. Id de usuário **string** (padrão da lib). Login com Google fica para depois (aí monta-se o handler para o callback OAuth). Tasks T1.2–T1.5 e T4.1–T4.2 ajustadas. |
| D2 | **Router do front** | React Router v7 · TanStack Router | **React Router v7** (modo biblioteca): o mais usado, poucas rotas, sem necessidade de geração de código. | 3 | ✅ React Router v7, modo biblioteca, **isolado** (rotas num arquivo só) para permitir migrar para TanStack Router no futuro (2026-11-11). T3.6 ajustada. React Router v8 já existe; instalado `react-router@^7` (7.18.5) conforme a decisão. |
| D3 | **Gráficos** | Recharts via `shadcn add chart` · barras em CSS puro (como o modelo) · visx | **Recharts via shadcn chart**, carregado com `React.lazy` só no painel de gráfico, para não pesar a carga inicial. Barras com `shape-rendering: crispEdges` e cantos retos para manter o visual pixel. | 7 | ✅ Recharts via shadcn chart, lazy (2026-11-11) |
| D4 | **Atividades atuais sem dono** | Apagar · atribuir ao primeiro usuário criado | **Apagar** na migração: são dados de dev. | 2 | ✅ **Atribuir** a uma conta de dev `dev@mystatistics.local` (slug `dev`), criada antes da migração (2026-11-11). T2.1 ajustada. |
| D5 | **Gamificação com 2 categorias** | Ver "Regras de progresso propostas" abaixo | Adotar o bloco como está. | 6 | ✅ Bloco adotado como está (2026-11-11) |
| D6 | **Onde calcular XP, nível, streak e resumos** | No server (endpoint de progresso) · no front (a partir da lista de atividades) | **No server**: o portfólio precisa mostrar o nível sem expor atividades individuais, e o ACCEPTANCE §5.5 exige teste (`bun test`) para todo cálculo. | 6 | ✅ No server (2026-11-11) |
| D7 | **Sessão de estudo (§5.4)** | (a) atividade `study` ganha um campo opcional `subject` · (b) entidade nova `study_session` | **(a)**: evita dois conceitos para "tempo estudado"; sessão de estudo = atividade `study` com `subject`. Atualizar o glossário. | 8 | ✅ (a) campo `subject` (2026-11-11) |
| D8 | **Escopo de métricas e registros (§5.2/§5.3)** | Mínimo: criar/listar/apagar métrica; lançar/listar/apagar registro · completo (com edição) | **Mínimo**, sem edição. Valor numérico (`double precision`), unidade texto livre, nome único por usuário. | 9 | ✅ Mínimo (2026-11-11) |
| D9 | **Granularidade do portfólio (§5.1.2)** | Itens expostos: card de progresso (nível/XP/rank/streak), cada categoria de atividade, cada métrica | **Esses três tipos de item**; o visitante vê **só agregados** (resumos), nunca registros ou atividades individuais. | 11 | ✅ Três tipos, só agregados (2026-11-11) |
| D10 | **Idioma das mensagens de erro da API** | Inglês na API · manter pt-BR e o front traduzir pelo `code` | **Inglês na API**: a UI é em inglês e o front pode mostrar a `message` direto. | 1 | ✅ Inglês na API (2026-11-11) |
| D11 | **Temas** | Os dois do modelo, com seletor · só um | **Os dois**, com seletor no header; escolha salva em `localStorage` (preferência do visitante, não dado). | 3 | ✅ Os dois, com seletor (2026-11-11) |
| D12 | **Fora do MVP** | Inventário/poções · missões secundárias · recuperação de senha · edição de perfil (além da visibilidade) · avatar customizável | **Tudo isso fora do MVP**; registrar na §2 do ACCEPTANCE. O modelo guarda missões secundárias em `localStorage`, o que viola o §4 (persistência no Postgres). | 0 | ✅ Tudo fora, mais o login com Google (2026-11-11) |
| D13 | **Lint e formatação** | Biome · ESLint + Prettier · nenhum | **Biome**: um pacote só para lint e formatação, rápido e com pouca configuração. | 0 | ✅ Biome (2026-11-11) |

### Regras de progresso propostas (D5)

Adaptação das regras do modal "REGRAS DO SYSTEM" do modelo para `study` e `exercise`:

- **XP por dia e categoria:** `floor(minutos × taxa)`. Taxas: `study` 1 XP/min · `exercise` 1,2 XP/min.
- **Daily quest:** `study` ≥ 90 min → +50 XP · `exercise` ≥ 45 min → +40 XP · as duas no mesmo dia → +100 XP de bônus.
- **Nível:** XP para subir do nível `n` = `100 × n + 200` (começa no nível 1, com 0 XP).
- **Rank:** E (1–4) · D (5–9) · C (10–14) · B (15–19) · A (20–29) · S (30+).
- **Atributos** (média dos últimos 30 dias, escala 0–100, limitado a 100):
  - INT = minutos de study por dia ÷ 90
  - STR = minutos de exercise por dia ÷ 45
  - FOCUS = duração média de uma atividade `study` ÷ 75
  - DISCIPLINE = % dos dias com as duas categorias
  - (VIT sai: dependia de alimentação.)
- **Status de hoje** (0–100, limitado a 100): MP = study hoje ÷ 90 · STA = média de exercise nos últimos 7 dias ÷ 45 · MOOD = % das metas da daily quest de hoje concluídas. (HP sai: dependia de alimentação.)
- **Classe:** atributo dominante entre INT e STR → "Arcane Student" (INT) · "Iron Warrior" (STR). Empate → "Adventurer".
- **Streak:** dias consecutivos com pelo menos uma atividade. Se hoje ainda não tem registro, a contagem começa em ontem. **Recorde** = maior sequência da história.
- **"Hoje":** dia de calendário do server (`todayISO`). A contagem regressiva até a meia-noite no front usa o relógio local do navegador; no MVP os dois coincidem.

---

## Fase 1 — Contas e perfil: back-end (ACCEPTANCE §5.1.1)

**Depende de:** D1, D10, D12. *(Tasks abaixo seguem D1 = Better Auth envolvido no nosso controller.)*

- [ ] **T1.1 — Mensagens de erro da API em inglês** *(D10 = inglês)*
  - Traduza as mensagens em `apps/server/src/shared/infra/errors/global-error-handler.ts` e em `apps/server/src/activities/**` (os testes conferem `status`/`apiCode`, não o texto).
  - Atualize a frase "`message` é texto em pt-BR" do `docs/contract.md`.
  - **Pronto quando:** `git grep -n -E "inválid|encontrad|duração|Informe|Nada para" apps/server/src` não acha nada; testes do server passam.
  - Commit: `refactor: return api error messages in english`

- [ ] **T1.2 — Contrato de conta em `packages/shared`** *(manager, antes dos agentes)*
  - `packages/shared/src/auth.ts` (puro): `PROFILE_VISIBILITIES = ["private", "public"] as const`, `ProfileVisibility`, `SLUG_PATTERN = "^[a-z0-9][a-z0-9-]{1,28}[a-z0-9]$"` e `Me` = `{ user: { id: string; email: string }; profile: { slug: string; visibility: ProfileVisibility } }`.
  - `packages/shared/src/auth-schema.ts` (TypeBox): `SignUp` = `{ email: t.String({ format: "email", maxLength: 254 }), password: t.String({ minLength: 8, maxLength: 128 }), slug: t.String({ pattern: SLUG_PATTERN }) }` e `SignIn` = `{ email, password }`. São os mesmos schemas que o server valida e que os formulários do front usam (T4.2).
  - `docs/contract.md`: seção "Autenticação" real: sessão em cookie gerenciado pelo Better Auth (httpOnly, SameSite=Lax, `Secure` em produção); rotas `POST /api/auth/signup`, `POST /api/auth/login`, `POST /api/auth/logout`, `GET /api/auth/me`; códigos `UNAUTHORIZED` (401), `INVALID_CREDENTIALS` (401), `EMAIL_TAKEN` (409), `SLUG_TAKEN` (409). Todas no `ApiError`.
  - **Pronto quando:** `pnpm typecheck` passa.
  - Commit: `feat: add auth contracts to shared`

- [ ] **T1.3 — Instalar e configurar o Better Auth; tabelas**
  - `pnpm --filter @mystatistics/server add better-auth`. Confira na documentação oficial da versão instalada a configuração atual (adapter do Drizzle, `auth.api.*`, `returnHeaders`, nomes de tabela).
  - Variáveis novas no `.env` da raiz, no `.env.example`, no `.env.test` e validadas em `env.ts`: `BETTER_AUTH_SECRET` (mín. 32 caracteres; no `.env.test`, um valor fixo de teste) e `BETTER_AUTH_URL` (`http://localhost:5173` em dev, a origem que o navegador usa, por causa do proxy).
  - Módulo novo `apps/server/src/auth/`. Instância em `auth/infra/better-auth.ts`: `drizzleAdapter(db, { provider: "pg", schema })`, `emailAndPassword: { enabled: true, minPasswordLength: 8, maxPasswordLength: 128 }`, sessão de 30 dias, `trustedOrigins` com a origem do front. Tabelas no plural (`users`, `sessions`, `accounts`, `verifications`). O handler HTTP da lib **não** é montado: o server só chama `auth.api.*`.
  - `auth/domain/auth.schema.ts` com as tabelas do Better Auth (geradas pelo CLI oficial ou escritas conforme a doc) e `auth/domain/profile.schema.ts` com `profile_visibility` (pgEnum a partir de `PROFILE_VISIBILITIES`) e `profiles` (`user_id text` pk/fk cascade, `slug varchar(30) unique not null`, `visibility` default `'private'`). O id de usuário é **texto**: todo `user_id` do projeto passa a ser `text`.
  - `pnpm db:generate`, revise o SQL, `pnpm db:migrate`.
  - **Pronto quando:** a migração aplica no banco de dev; `pnpm --filter @mystatistics/server test` passa.
  - Commits: `chore: add better auth to server` → `feat: add auth and profile tables`

- [ ] **T1.4 — Erros e guarda de autenticação**
  - `shared/infra/errors/`: `UnauthorizedError` (401, código padrão `UNAUTHORIZED`, aceita outro, ex. `INVALID_CREDENTIALS`) e `ConflictError` (409, código obrigatório).
  - `shared/infra/auth.guard.ts`: plugin Elysia que chama `auth.api.getSession({ headers })` e expõe `userId` no contexto; sem sessão válida → `UnauthorizedError`. Controllers de dados fazem `.use(authGuard)`.
  - Regra pura com `*.unit.test.ts` onde houver (ex.: tradução dos erros do Better Auth para os nossos códigos).
  - **Pronto quando:** testes unitários novos passam; `pnpm typecheck` passa.
  - Commit: `feat: add auth guard and error classes`

- [ ] **T1.5 — Use cases e rotas de autenticação**
  - `auth/application/`, um use case por arquivo, cada um com `*.usecase.integration.test.ts`:
    - `sign-up.usecase.ts`: confere o slug (409 `SLUG_TAKEN`), cria o usuário com `auth.api.signUpEmail` (`name` = slug) pegando os headers de `Set-Cookie`; e-mail já usado → 409 `EMAIL_TAKEN`; cria o perfil `private`. Se o perfil falhar por corrida no índice único (23505), apaga o usuário recém-criado e responde 409 `SLUG_TAKEN` (nunca fica usuário sem perfil). Devolve `Me` + headers.
    - `sign-in.usecase.ts`: `auth.api.signInEmail`; e-mail inexistente e senha errada → **o mesmo** 401 `INVALID_CREDENTIALS`, mesma mensagem.
    - `sign-out.usecase.ts`: `auth.api.signOut`; funciona mesmo sem sessão.
    - `get-me.usecase.ts`: devolve `Me` do `userId`.
  - `auth/infra/auth.controller.ts` (prefixo `/auth`), registrado em `app.routes.ts`, repassando o `Set-Cookie` do Better Auth:
    - `POST /api/auth/signup` (body `SignUp`) → 201 `Me` + `Set-Cookie`
    - `POST /api/auth/login` (body `SignIn`) → 200 `Me` + `Set-Cookie`
    - `POST /api/auth/logout` → 204, limpa o cookie
    - `GET /api/auth/me` → 200 `Me` · 401 `UNAUTHORIZED`
  - O `IntegrationTestHelper` ganha `createTestUser()` (usuário + perfil + cookie de sessão) para as próximas fases; os `truncate` incluem as tabelas novas.
  - **Pronto quando:** testes passam; com `pnpm dev:server`, via `curl -c/-b`: signup → me (200) → logout → me (401); e-mail repetido → 409 `EMAIL_TAKEN`; slug repetido → 409 `SLUG_TAKEN`; senha errada → 401 `INVALID_CREDENTIALS`. Depois, apague do banco de dev só os usuários criados no teste.
  - Commit: `feat: add sign up, login, logout and me endpoints`


---

## Fase 2 — Atividades multiusuário (ACCEPTANCE §4 isolamento, §5.6)

**Depende de:** Fase 1, D4.

- [ ] **T2.1 — `user_id` nas atividades**
  - `activity.schema.ts`: `userId text not null references users(id) on delete cascade` + índice `(user_id, date)`.
  - `pnpm db:generate`. O SQL gerado falha em tabela com linhas (coluna `NOT NULL` sem default). **Ajuste à mão** conforme D4 (atribuir): `ADD COLUMN` nulo → `UPDATE` atribuindo as linhas ao usuário mais antigo (`ORDER BY created_at, id LIMIT 1`) → se sobrar linha sem dono (não há usuário), `RAISE EXCEPTION` com mensagem clara ("create an account before migrating") → `SET NOT NULL`, FK e índice. Não mexa no snapshot.
  - Antes de aplicar no banco de dev: criar a conta `dev@mystatistics.local` (slug `dev`) por `POST /api/auth/signup`; ela é a mais antiga e fica dona das atividades existentes. A senha vai para o usuário no relatório.
  - **Pronto quando:** a migração aplica no banco de dev com dados existentes e as atividades antigas aparecem para a conta de dev.
  - Commit: `feat: make activities belong to a user`

- [ ] **T2.2 — Repository e use cases filtrando por usuário**
  - Todo método do `ActivityRepository` recebe `userId` e filtra por ele (`findById(userId, id)`, `findAll(userId)`…). Atividade de outro usuário se comporta como inexistente → 404 `NOT_FOUND`.
  - Use cases recebem `{ userId, ... }`; o controller faz `.use(authGuard)` e repassa o `userId`.
  - Testes de integração passam a usar `createTestUser()`. Novos casos: usuário B não lista, não busca, não edita nem apaga atividade do A (404), e a do A continua intacta.
  - `docs/contract.md`: rotas de atividades exigem sessão (401 `UNAUTHORIZED`).
  - **Pronto quando:** testes passam; via `curl`, sem cookie → 401; com o cookie do B no id do A → 404.
  - Commit: `feat: scope activity routes to the logged-in user`

- [ ] **T2.3 — ACCEPTANCE das Fases 1 e 2**
  - §5.1.1: detalhe os critérios de back e marque os que já valem. §5.6: marque "(multiusuário)".
  - Commit: `docs: update acceptance for accounts and activity ownership`

---

## Fase 3 — Front: fundação

**Depende de:** D2, D11. **Território:** só `apps/web`.

- [x] **T3.1 — Tokens de tema do modelo** — feito em 2026-11-11
  - Substitua as variáveis neutras do shadcn em `apps/web/src/index.css` pelas do modelo: copie os blocos `[data-dir="a"]` e `[data-dir="b"]` (`--bg`, `--bgimg`, `--card`, `--card2`, `--inset`, `--line`, `--line2`, `--acc`, `--acc2`, `--ink`, `--glow*`, `--tglow`, `--txt`, `--mut`, `--dim`, `--off`, `--flame`, `--hp`, `--c1..--c3`, `--av-*`, `--r`, `--title` etc.).
  - Mapeie as variáveis do shadcn para elas (`--background: var(--bg)`, `--card: var(--card)`, `--primary: var(--acc)`, `--border: var(--line)`, `--radius: var(--r)`…), para os componentes de `components/ui` herdarem o tema. Exponha as do modelo no `@theme inline` do Tailwind para usar como classe (`bg-card2`, `text-acc`…).
  - O atributo vai no `<html>`: `data-dir="a"` por padrão.
  - **Pronto quando:** trocar `data-dir` à mão no DevTools muda todas as cores; `pnpm typecheck` passa.
  - Commit: `style: port dashboard theme tokens`

- [x] **T3.2 — Fontes com Fontsource** — feito em 2026-11-11
  - `pnpm --filter @mystatistics/web add @fontsource/inter @fontsource/jetbrains-mono @fontsource/pixelify-sans @fontsource/silkscreen`.
  - Importe **só o subset latin e só os pesos que o modelo usa** (confira no `<style>` do template), pelos arquivos por subset/peso do Fontsource (ex.: `@fontsource/inter/latin-400.css`). Não importe o pacote inteiro.
  - **Pronto quando:** no `pnpm --filter @mystatistics/web build`, os `.woff2` somam menos de 200 KB; os títulos aparecem em pixel font nos dois temas.
  - Commit: `style: self-host latin subsets of dashboard fonts`

- [x] **T3.3 — Kit de pixel art** — feito em 2026-11-11
  - Implemente o [plans/pixel-art.md](pixel-art.md) §2: `apps/web/src/pixel/` com `sprite.ts` (grade → um `<path>` por cor, memoizado), `PixelSprite.tsx` (`size`, `className`, `title` → `role="img"`, senão `aria-hidden`), `sprites/icons.ts` (ícones do modelo **sem** `apple`), `sprites/avatar.ts` (metade + espelho + paleta + camadas cabeça/corpo + piscar) e `pixel.css` (keyframes `avBob`, `avBlink`, `flick` com `steps(1)` e `@media (prefers-reduced-motion: reduce)` parando os loops).
  - **Pronto quando:** uma página temporária (não commitada) mostra todos os ícones em 10/16/26 px e o avatar animado, nítidos com zoom de 110% e 125%, sem linhas entre pixels; o avatar tem no máximo 1 `<path>` por cor no DOM.
  - *Nota (2026-11-11):* com as camadas animáveis (corpo, cabeça, piscar) o critério vale **por camada**: 17 `<path>` para 11 cores, contra centenas de `<rect>` no modelo. Fontes: no máximo 2 pesos por família (400/600), ~105 KB de `.woff2`.
  - Commit: `feat: add pixel sprite renderer, icons and avatar`

- [x] **T3.4 — Cliente da API com TanStack Query** — feito em 2026-11-11
  - `pnpm --filter @mystatistics/web add @tanstack/react-query` (e `@tanstack/react-query-devtools` como dev).
  - `apps/web/src/lib/api.ts`: função `api<T>()` sobre `fetch` em `/api/...` relativo, `credentials: "same-origin"`, tipada pelos contratos de `@mystatistics/shared`. Resposta de erro → lança `ApiRequestError` com `status`, `code` e `message` do `ApiError`; falha de rede → código `NETWORK`.
  - `QueryClientProvider` no `main.tsx`. Convenção: uma pasta `apps/web/src/queries/` com um arquivo por recurso (`activities.ts`, `progress.ts`…) exportando as `queryKey`s, os `useQuery` e os `useMutation` (que invalidam as chaves afetadas no `onSuccess`). Nada de `fetch` direto em componente.
  - Erro 401 em qualquer query/mutação → invalida a sessão (T4.1) e leva ao login: trate no `QueryCache`/`MutationCache` `onError` global.
  - **Pronto quando:** `pnpm typecheck` passa; uma query de teste de `/api/health` devolve `HealthResponse` e aparece no devtools.
  - Commit: `feat: add typed api client with tanstack query`

- [x] **T3.5 — Componentes base no estilo do modelo** — feito em 2026-11-11
  - shadcn (dentro de `apps/web`): `pnpm dlx shadcn@latest add dialog sonner switch tabs tooltip`.
  - Reestilize os componentes do shadcn com os tokens do tema e o visual do modelo (cantos de `--r`, bordas `--line`, brilho `--glow`). Use **class-variance-authority** para as variantes.
  - `components/game/`: `Panel` (card com título em `--title` e a moldura de cantos), `SegmentedBar` (barra com `repeating-linear-gradient` e `transition: width .6s steps(12)`), `PixelButton`.
  - Toast: **Sonner** (`<Toaster />` na raiz), com o visual do toast do modelo (keyframe `toastIn`).
  - `components/states/`: `EmptyState` (ícone + texto + ação opcional), `LoadingState` (skeleton no formato do painel), `ErrorState` (mostra `message`, botão "Try again" que chama o `refetch` da query). **Todo** componente que carrega dado usa os três (ACCEPTANCE §4).
  - **Pronto quando:** os componentes aparecem certos nos dois temas.
  - Commit: `feat: add game-styled components and state views`

- [x] **T3.6 — Router e casca do app** — feito em 2026-11-11
  - `pnpm --filter @mystatistics/web add react-router` (v7, modo biblioteca, `createBrowserRouter`). Rotas: `/login`, `/signup`, `/` (dashboard, protegido), `/u/:slug` (portfólio, público). Rota desconhecida → "Not found" no estilo do app.
  - **Isolamento do router (D2):** a árvore de rotas fica num arquivo só (`src/app/router.tsx`), as páginas em `src/pages/`, e o resto do app usa do React Router só `Link`, `Navigate`, `useNavigate` e `useParams`. Trocar por TanStack Router no futuro mexe nesse arquivo e em poucos pontos de chamada.
  - Casca do dashboard igual ao header do modelo: ícone `crystal`, "MyStatistics", "System v0.1 · <data formatada com date-fns>", seletor de tema (D11; `localStorage` com `try/catch`), botão "System rules" e lugar para o logout. **Remova** a `Sidebar` atual (placeholder que não existe no modelo).
  - Glossário de tradução para a UI:

    | Modelo | Oficial |
    | --- | --- |
    | A · Grimório Teal / B · System Violeta | A · Teal Grimoire / B · Violet System |
    | Regras do System | System rules |
    | Status · hoje | Status · today |
    | dias seguidos / Recorde | day streak / Best |
    | Atributos · média 30 dias | Attributes · 30-day average |
    | Tempo por dia · últimos 7 dias | Time per day · last 7 days |
    | Resumo do período | Period summary |
    | Média / dia · Melhor dia · Tendência | Daily average · Best day · Trend |
    | A missão diária chegou · METAS · Bônus completo | The daily quest has arrived · GOALS · Full clear bonus |
    | AVISO: missões incompletas à meia-noite não rendem bônus. | WARNING: quests left incomplete at midnight give no bonus. |
    | Histórico recente | Recent history |
    | Registrar atividade | Log activity |
    | Categoria · Horas · Minutos · Data (opcional — padrão: hoje) | Category · Hours · Minutes · Date (optional — defaults to today) |
    | Recompensa prevista · Cancelar · Registrar | Expected reward · Cancel · Log |
    | Estudo / Academia | Study / Exercise |
  - **Pronto quando:** navegar entre as rotas funciona; F5 em qualquer rota abre a mesma rota; o tema escolhido sobrevive ao F5.
  - Commit: `feat: add router and dashboard shell`

---

## Fase 4 — Front: contas (ACCEPTANCE §5.1.1)

**Depende de:** Fases 1 e 3.

- [ ] **T4.1 — Sessão no front** *(D1: sem o client do Better Auth; o front fala só com as nossas rotas)*
  - `apps/web/src/queries/auth.ts`: query `["me"]` em `GET /api/auth/me` (200 → logado; 401 → deslogado, **não** é erro) e mutações `signUp`, `signIn`, `signOut` em `POST /api/auth/signup|login|logout`.
  - Rota protegida: deslogado em `/` → `/login`. Logado em `/login` ou `/signup` → `/`. Carregando a sessão → `LoadingState` em tela cheia; outro erro → `ErrorState`.
  - Commit: `feat: add session handling and protected routes`

- [ ] **T4.2 — Telas de cadastro e login**
  - `pnpm --filter @mystatistics/web add react-hook-form @hookform/resolvers` e `pnpm dlx shadcn@latest add form`.
  - Formulários com `useForm({ resolver: typeboxResolver(SignUp) })` / `typeboxResolver(SignIn)` — os **mesmos** schemas de `packages/shared` que o server valida (T1.2), sem contrato novo.
  - `/signup`: e-mail, senha, slug (dica do formato + prévia do link `/u/<slug>`). `/login`: e-mail e senha. Sucesso → grava o `Me` na chave `["me"]` e vai para `/`. Visual de "tela de entrada do System" (Panel, título pixel, avatar).
  - Erros: `SLUG_TAKEN` e `EMAIL_TAKEN` no campo certo (`form.setError`); `INVALID_CREDENTIALS` e `VALIDATION` no topo. Botão desabilitado com indicação de envio.
  - Logout no header: `POST /api/auth/logout` → limpa o cache do TanStack Query (`queryClient.clear()`) → `/login`.
  - **Pronto quando** (no navegador): cadastro novo entra direto no dashboard; F5 continua logado; logout → F5 continua deslogado; slug repetido mostra erro e deixa escolher outro; `/` deslogado leva ao login.
  - Atualize e marque o §5.1.1 do ACCEPTANCE.
  - Commit: `feat: add sign up and login screens`

---

## Fase 5 — Front: atividades (ACCEPTANCE §5.6 item "front")

**Depende de:** Fases 2 e 4.

- [ ] **T5.1 — Modal "Log activity"**
  - Igual ao "[REGISTRAR ATIVIDADE]" do modelo, num `Dialog` do shadcn: as duas categorias (ícones `book` e `dumbbell`, taxa de XP visível), horas, minutos, data opcional (padrão hoje, sem data futura) e "Expected reward" calculada a partir das regras de D5 (só prévia; o valor real vem do server na Fase 6).
  - Formulário com React Hook Form + `typeboxResolver(CreateActivity)`. Envio por `useMutation` que invalida as chaves de atividades (e de progresso/resumo, depois da Fase 6). Erros da API (`INVALID_DURATION`, `VALIDATION`) no modal; sucesso → fecha e toast do Sonner.
  - Commit: `feat: add log activity dialog`

- [ ] **T5.2 — Histórico recente**
  - `pnpm --filter @mystatistics/web add date-fns`.
  - Painel "Recent history" (`GET /api/activities` via `useQuery`): ícone, categoria, quando (`isToday`/`isYesterday`/`format` do date-fns), duração (`1h 05`, `45min`), XP da atividade e botão de apagar com confirmação → `useMutation` de `DELETE` + toast.
  - Estados: vazio ("No activity yet — log your first one" + botão que abre o modal), carregando, erro.
  - **Pronto quando** (no navegador): registrar, ver na lista, F5 e continuar lá; apagar e sumir; com o server parado, erro visível, sem tela branca.
  - Marque o item "(front)" da §5.6 do ACCEPTANCE.
  - Commit: `feat: render recent activity history`

---

## Fase 6 — Progresso e resumo: back-end

**Depende de:** Fase 2, D5, D6.

- [ ] **T6.1 — Contratos de progresso e resumo**
  - `packages/shared/src/progress.ts`: `Progress` = `{ level; xpCurrent; xpNeeded; xpTotal; rank: "E"|"D"|"C"|"B"|"A"|"S"; className; streak: { current; best; week: { date: string; active: boolean }[] }; status: { mp; sta; mood }; attributes: { int; str; focus; discipline }; dailyQuest: { goals: { category: ActivityCategory; targetMinutes; doneMinutes; reward; completed }[]; bonus; allCompleted } }` (os campos sem tipo são `number`).
  - `packages/shared/src/activity-summary.ts`: `SUMMARY_PERIODS = ["7d", "30d"] as const`; `ActivitySummaryQuery = t.Object({ period: t.Union(...) })`; `ActivitySummary` = `{ period; totalMinutes; averagePerDay; activeDays; bestDay: { date; totalMinutes } | null; trend: { previousTotalMinutes; changePercent: number | null }; perDay: { date; minutes: Record<ActivityCategory, number> }[] }` (`changePercent` é `null` quando o período anterior tem 0 minutos).
  - `docs/contract.md`: `GET /api/progress` e `GET /api/activities/summary?period=7d|30d`.
  - Commit: `feat: add progress and activity summary contracts to shared`

- [ ] **T6.2 — Regras puras de progresso**
  - `pnpm --filter @mystatistics/server add date-fns` (aritmética de dias: `addDays`, `subDays`, `eachDayOfInterval`, `differenceInCalendarDays` sobre datas `YYYY-MM-DD` com `parseISO`/`format`).
  - Módulo novo `apps/server/src/progress/`, `domain/` só com funções puras (sem `db`), uma regra por arquivo, cada uma com `*.unit.test.ts` cobrindo o caso normal **e** os degenerados (lista vazia, um dia só, valores iguais, limites exatos como 90 min e a virada de nível) — ACCEPTANCE §5.5: `xp.ts`, `level.ts` (`levelOf`, `rankOf`), `streak.ts`, `attributes.ts`, `status.ts`, `daily-quest.ts`, `class-name.ts`.
  - Entrada comum: minutos por dia e categoria + a data de "hoje" como parâmetro (nada de `new Date()` dentro das regras, para o teste controlar o dia).
  - Commit: `feat: add pure progress rules`

- [ ] **T6.3 — `GET /api/progress`**
  - `progress/application/get-progress.usecase.ts` (+ integração com atividades em dias controlados) e `progress/infra/progress.controller.ts` com `authGuard`. O repository agrega no SQL (`sum(duration_minutes)` por `date, category`, só do usuário); a regra é a função pura.
  - **Pronto quando:** testes passam; via `curl`, os números batem com uma conta feita à mão.
  - Commit: `feat: add progress endpoint`

- [ ] **T6.4 — `GET /api/activities/summary`**
  - Função pura `activities/domain/period-summary.ts` (+ unit test com degenerados) e use case no módulo `activities` (+ integração). `perDay` traz **todos** os dias do período (`eachDayOfInterval`), com 0 nos vazios.
  - Commit: `feat: add activity period summary endpoint`

---

## Fase 7 — Progresso: front (o dashboard do modelo)

**Depende de:** Fases 5 e 6, D3.

- [ ] **T7.1 — Card do jogador**
  - Avatar com moldura de cantos, "PLAYER", classe, LEVEL, RANK, barra de XP (`xpCurrent / xpNeeded`, "X XP to Level N+1", total `Σ`). Dados por `useQuery` de `GET /api/progress`. Três estados.
  - Commit: `feat: render player card with level and xp`

- [ ] **T7.2 — Status, streak e atributos**
  - "Status · today" (MP, STA, MOOD em `SegmentedBar` `/100`); "Streak" (chama `flick`, dias seguidos, 7 marcadores da semana com `Tooltip` mostrando a data, recorde); "Attributes · 30-day average" (INT, STR, FOCUS, DISCIPLINE com descrição curta). Três estados.
  - Commit: `feat: render status, streak and attributes panels`

- [ ] **T7.3 — Tempo por dia e resumo do período**
  - `pnpm dlx shadcn@latest add chart` (instala Recharts). Painel de gráfico carregado com `React.lazy` + `Suspense` (fallback = `LoadingState`).
  - "Time per day · last 7 days": barras empilhadas por categoria (`BarChart` do Recharts via `ChartContainer` do shadcn), cores `--c1`/`--c2`, legenda, barras de canto reto com `shape-rendering: crispEdges`.
  - "Period summary" com `Tabs` 7D/30D: total, média/dia, dias ativos, melhor dia, tendência (↑/↓ e % vs. período anterior; "—" quando `changePercent` é `null`). Menos de 2 dias ativos → "Not enough data yet" no lugar de média e tendência (ACCEPTANCE §5.5, critério 2).
  - Commit: `feat: render daily time chart and period summary`

- [ ] **T7.4 — Daily quest e regras**
  - Painel "[DAILY QUEST]" com as metas de `dailyQuest`, progresso, recompensa, bônus e contagem regressiva até a meia-noite local (date-fns `endOfDay` + `intervalToDuration`; componente próprio atualizando a cada segundo, para não re-renderizar o dashboard inteiro).
  - Modal "System rules" (`Dialog`) com as regras **finais** de D5, não as do modelo.
  - Registrar ou apagar atividade invalida também `["progress"]` e `["activities", "summary"]`.
  - **Pronto quando** (no navegador): o layout bate com o modelo nos dois temas; registrar uma atividade que completa uma meta atualiza quest, XP e barra sem F5; F5 mantém tudo; com o server parado cada painel mostra erro.
  - Commit: `feat: render daily quest and system rules`

---

## Fase 8 — Estudos por matéria (ACCEPTANCE §5.4)

**Depende de:** Fase 7, D7. *(Tasks abaixo assumem D7 = (a).)*

- [ ] **T8.1 — Campo `subject` nas atividades**
  - Contrato: `CreateActivity`/`UpdateActivity` ganham `subject: t.Optional(t.String({ minLength: 1, maxLength: 60 }))`; `Activity` ganha `subject: string | null`. Regra do server: `subject` só com `category: "study"` → senão 422 `SUBJECT_NOT_ALLOWED`.
  - Coluna `subject varchar(60) null` + migração; use cases, mapper e testes atualizados.
  - `ActivitySummary` ganha `studyBySubject: { subject: string; minutes: number }[]` (sem matéria → `"Other"`), por minutos desc.
  - Glossário do ACCEPTANCE: "Sessão de estudo" = atividade `study` com `subject`.
  - Commits: `feat: add optional study subject to activity contracts` → `feat: store and validate activity study subject`

- [ ] **T8.2 — Matéria no front**
  - Campo "Subject" no modal, só com "Study", com sugestões das matérias já usadas (`Command`/combobox do shadcn: `pnpm dlx shadcn@latest add command popover`). Histórico mostra a matéria. "Period summary" ganha a divisão por matéria (barras horizontais no estilo `SegmentedBar`).
  - Atualize e marque a §5.4 do ACCEPTANCE.
  - Commit: `feat: show study time by subject`

---

## Fase 9 — Métricas e registros (ACCEPTANCE §5.2 e §5.3)

**Depende de:** Fase 4, D8.

- [ ] **T9.1 — Contratos**
  - `packages/shared/src/metric.ts` + `metric-schema.ts`: `CreateMetric` = `{ name: t.String({ minLength: 1, maxLength: 60 }), unit: t.String({ maxLength: 20 }) }`; `Metric` = `{ id; name; unit }`. `CreateEntry` = `{ value: t.Number(), date: t.Optional(t.String({ pattern: "^\\d{4}-\\d{2}-\\d{2}$" })) }`; `Entry` = `{ id; metricId; value; date }`.
  - Erros novos: `METRIC_NAME_TAKEN` (409), `FUTURE_DATE` (422). Classe `ConflictError` (409) em `shared/infra/errors` se ainda não existir.
  - Rotas: `GET/POST /api/metrics`, `DELETE /api/metrics/:id`, `GET/POST /api/metrics/:id/entries`, `DELETE /api/metrics/:id/entries/:entryId`.
  - Commit: `feat: add metric and entry contracts to shared`

- [ ] **T9.2 — Back-end de métricas**
  - Módulo `apps/server/src/metrics/`: tabelas `metrics` (`id`, `user_id` fk cascade, `name`, `unit`, único `(user_id, lower(name))`) e `entries` (`id`, `metric_id` fk cascade, `user_id` fk cascade, `value double precision`, `date date`, índice `(metric_id, date)`). Migração.
  - Use cases (um por arquivo, com integração): criar métrica (409 no nome repetido, sem diferenciar maiúsculas), listar, apagar (registros vão junto); lançar registro (data futura → 422 `FUTURE_DATE`; valor não finito → 422 `VALIDATION`), listar (date desc), apagar. Métrica ou registro de outro usuário → 404. Tudo com `authGuard`.
  - Commits: `feat: add metrics and entries tables` → `feat: add metric endpoints` → `feat: add entry endpoints`

- [ ] **T9.3 — Front de métricas**
  - Painel "Metrics" no estilo do modelo (ícones pixel novos, ex.: `scale`, no formato de `icons.ts`): lista; **vazio convida a criar a primeira** (§5.2, critério 1); formulário de nova métrica (React Hook Form + `typeboxResolver(CreateMetric)`); ao abrir uma métrica, histórico + formulário de lançamento (`CreateEntry`, sem data futura); apagar métrica e registro com confirmação. Leituras e mutações em `queries/metrics.ts`. Três estados em cada parte.
  - **Pronto quando** (no navegador): criar métrica, lançar registros, F5, apagar; data futura mostra erro e nada é gravado.
  - Atualize e marque §5.2 e §5.3 do ACCEPTANCE.
  - Commit: `feat: add metrics panel with entries`

---

## Fase 10 — Estatísticas de métricas (ACCEPTANCE §5.5)

**Depende de:** Fase 9.

- [ ] **T10.1 — Resumo de métrica no back**
  - Contrato: `MetricSummaryQuery` (`period: "7d" | "30d" | "all"`) e `MetricSummary` = `{ count; mean: number | null; min: number | null; max: number | null; trend: { direction: "up" | "down" | "flat"; previousMean: number } | null; enoughData: boolean }`. Com menos de 2 registros, `enoughData` é `false` e `mean`/`trend` vêm `null`. Tendência = média do período vs. média do período anterior de mesmo tamanho (`null` se o anterior não tem registro ou se `period = "all"`).
  - Função pura `statistics/domain/summarize.ts` com unit tests: lista vazia, um elemento, valores iguais, negativos, caso normal. Rota `GET /api/metrics/:id/summary?period=` (+ integração).
  - Commits: `feat: add metric summary contract` → `feat: add metric summary endpoint`

- [ ] **T10.2 — Resumo de métrica no front**
  - Card de resumo na métrica aberta, com `Tabs` 7D/30D/All: contagem, média, mín., máx. e tendência (↑ ↓ →) + mini gráfico de linha (Recharts `LineChart`, no mesmo chunk lazy da T7.3). Sem dados suficientes → "Not enough data yet" (nunca `NaN` nem média de um ponto).
  - Atualize e marque §5.5 do ACCEPTANCE.
  - Commit: `feat: show metric summary`

---

## Fase 11 — Portfólio público (ACCEPTANCE §5.1.2)

**Depende de:** Fases 7, 8 e 10, D9.

- [ ] **T11.1 — Contratos**
  - `UpdateProfile` = `{ visibility }`. `PROFILE_ITEM_KINDS = ["progress", "activity_category", "metric"] as const`. `ProfileItem` = `{ kind; ref: string; label: string; visible: boolean }` (`ref`: `""` para progress, a categoria, ou o id da métrica). `UpdateProfileItem` = `{ kind, ref, visible }`.
  - `PublicProfile` = `{ slug; progress?: Progress; activities?: { category: ActivityCategory; summary7d: ActivitySummary; summary30d: ActivitySummary }[]; metrics?: { name: string; unit: string; summary30d: MetricSummary }[] }`. Item oculto **não aparece** no JSON.
  - Rotas: `PATCH /api/profile` (dono), `GET /api/profile/items` e `PATCH /api/profile/items` (dono), `GET /api/public/profiles/:slug` (sem login). Erro novo: `PROFILE_NOT_FOUND` (404).
  - Commit: `feat: add profile visibility and public profile contracts`

- [ ] **T11.2 — Back-end do portfólio**
  - Tabela `profile_items` (`user_id` fk cascade, `kind` pgEnum, `ref`, `visible boolean not null`, pk `(user_id, kind, ref)`). **Sem linha = oculto**: item novo nasce oculto sem código extra (§5.1.2, critério 5).
  - Use cases: mudar visibilidade do perfil; listar os itens possíveis (progress + 2 categorias + cada métrica) com o `visible`; ligar/desligar (upsert com `onConflictDoUpdate` do Drizzle); apagar métrica remove o item correspondente.
  - Perfil público: slug inexistente **ou** perfil privado → o **mesmo** 404 `PROFILE_NOT_FOUND`, mesma mensagem (§5.1.2, critério 2). Público → só itens visíveis, só agregados (reaproveita os use cases de progresso e resumo). Nenhuma rota de escrita sob `/api/public`.
  - Integração cobre: privado = inexistente; público mostra só os visíveis; item novo oculto; voltar a privado → 404; visitante logado (outro usuário) recebe o mesmo que um anônimo.
  - Commits: `feat: add profile items table` → `feat: add profile visibility endpoints` → `feat: add public profile endpoint`

- [ ] **T11.3 — Front do portfólio**
  - Painel "Share profile" no dashboard: `Switch` Public/Private, link `/u/<slug>` com botão de copiar (`navigator.clipboard` + toast), lista de itens com um `Switch` cada (mutação otimista do TanStack Query, revertendo no erro).
  - Página `/u/:slug`: os mesmos painéis do dashboard em modo **só leitura** (sem modal, sem apagar, sem quest interativa, sem "Share profile"), só com os itens recebidos. `PROFILE_NOT_FOUND` → "Profile not found" no estilo do app. Três estados.
  - **Pronto quando** (no navegador, com uma janela anônima): perfil novo é privado e o link dá "not found"; tornar público → abre deslogado; ocultar um item → some da tela e da resposta (DevTools → Network); métrica nova → não aparece até ligar; voltar a privado → "not found".
  - Atualize e marque §5.1.2 do ACCEPTANCE.
  - Commit: `feat: add share settings and public portfolio page`

---

## Fase 12 — Fechamento do MVP

- [ ] **T12.1 — Passada final pelo ACCEPTANCE**
  - Para **cada** bloco da §5, refaça no navegador os critérios dele e os da §4 (typecheck, lint, `pnpm dev` limpo, três estados, erro visível com o server parado, F5, isolamento com dois usuários em duas janelas).
  - Marque o que passou; o que não passou vira task nova no fim deste arquivo.
  - Commit: `docs: mark mvp acceptance criteria`

- [ ] **T12.2 — Docs atualizados**
  - `README.md` (como rodar, `db-test`, variáveis do Better Auth, primeiro cadastro), `docs/contract.md` (todas as rotas e erros), `CLAUDE.md` (estrutura do `apps/web`: `pixel/`, `components/game`, `components/states`, `lib/api.ts`, `queries/`, `app/router.tsx`), ACCEPTANCE §6/§7 sem decisão pendente já tomada.
  - Commit: `docs: document mvp structure and setup`

- [ ] **T12.3 — Leveza do front**
  - `pnpm --filter @mystatistics/web build` e registre no fim deste arquivo: JS inicial (gzip), chunk do gráfico (gzip), soma das fontes e número de requisições de imagem na carga do dashboard. Alvos: **zero** imagem para ícones e avatar; fontes < 200 KB; o chunk do Recharts fora do JS inicial.
  - Commit: `docs: record mvp bundle size`
