# Critérios de Aceite — MyStatistics

> Documento vivo. É a fonte da verdade sobre **o que a aplicação precisa fazer** e **quando uma feature está pronta**.
> Toda feature (`feat:`) termina com este arquivo atualizado. Se um critério aqui não passa, a feature não está pronta.

**Última atualização:** 2026-08-21

---

## 1. Visão

MyStatistics é uma aplicação **pessoal e single-user** para registrar métricas do dia a dia e transformá-las em estatística útil. Junta três coisas num lugar só:

- **Métricas do dia a dia** — números que eu registro periodicamente (ex.: peso, sono, gasto, humor).
- **Registros pessoais** — os lançamentos em si, com data, valor e contexto.
- **Estatísticas de estudo** — tempo estudado, por matéria/tópico, e a evolução disso ao longo do tempo.

O valor não está em guardar o dado, está em **ver o que ele diz**: tendência, média, comparação entre períodos.

## 2. Fora de escopo (por enquanto)

Registrado aqui para não virar discussão depois. Nada disso entra sem eu mudar este arquivo primeiro:

- Login, cadastro, múltiplos usuários.
- App mobile nativo.
- Importação automática de fontes externas (Google Fit, planilhas, bancos).
- Compartilhamento/exportação pública de dados.

## 3. Glossário

Vocabulário fixo. Código, rotas e UI usam **estes** nomes — sem sinônimos soltos.

| Termo | Significado |
| --- | --- |
| **Métrica** (`metric`) | A *definição* do que é medido: nome, unidade, tipo de valor. Ex.: "Peso (kg)". |
| **Registro** (`entry`) | Um *lançamento* de uma métrica: valor + data. Ex.: "Peso = 78.4 em 2026-07-12". |
| **Sessão de estudo** (`study session`) | Um bloco de estudo: matéria/tópico, duração, data. |
| **Atividade** (`activity`) | Um lançamento de tempo gasto numa categoria (estudo, alimentação, academia), num dia. Ex.: "Estudo = 90 min em 2026-08-21". |
| **Período** | Recorte de tempo usado nas análises (7d, 30d, mês, ano, customizado). |
| **Resumo** (`summary`) | Estatísticas calculadas sobre um conjunto de registros num período. |

---

## 4. Critérios gerais (valem para toda feature)

Uma feature só está pronta quando **todos** estes passam:

- [ ] `pnpm typecheck` passa sem erro.
- [ ] `pnpm dev` sobe front e server sem erro no console.
- [ ] O fluxo foi exercitado de verdade no navegador — não só "compilou".
- [ ] O tipo do contrato de API vive em `packages/shared` e é usado pelos **dois** lados.
- [ ] A tela tem os três estados tratados: **vazio**, **carregando**, **erro**. Nada de tela branca.
- [ ] Nenhum dado é perdido silenciosamente: se o server falha, a UI diz que falhou.
- [ ] Funciona depois de um `F5` (o dado persistiu no Postgres, não só no state do React).
- [ ] Os critérios da própria feature foram adicionados na seção 5 deste arquivo.

## 5. Critérios por funcionalidade

> Formato: **Dado / Quando / Então**. Cada `feat:` implementado ganha um bloco aqui.

### 5.1 Infra e fundação — ✅ pronto

- [x] **Dado** que estou na raiz do projeto, **quando** rodo `pnpm dev`, **então** front (`:5173`) e server (`:3333`) sobem juntos, com logs prefixados, sem eu entrar em nenhuma pasta.
- [x] **Dado** que os dois estão no ar, **quando** o front chama `/api/...`, **então** o Vite faz proxy pro server e a resposta chega — sem o front conhecer a porta da API.
- [x] **Dado** um tipo em `packages/shared`, **quando** front e server o importam, **então** os dois compilam contra o mesmo contrato.
- [x] **Dado** que o Postgres está **fora do ar**, **quando** chamo `/api/health`, **então** recebo `503` com `{ status: "degraded", db: "down" }` — a API não finge que está saudável.
- [x] **Dado** o `pnpm db:up`, **quando** o server sobe, **então** ele conecta no Postgres e `/api/health` responde `200` com `{ status: "ok", db: "ok" }` — validado direto (`:3333`) e pelo proxy do Vite (`:5173`).

### 5.2 Métricas — 🔲 a fazer

- [ ] **Dado** que não tenho nenhuma métrica, **quando** abro a aplicação, **então** vejo um estado vazio que me convida a criar a primeira (e não uma tabela vazia sem explicação).
- [ ] **Dado** o formulário de nova métrica, **quando** informo nome e unidade, **então** ela é criada e passa a aceitar registros.
- [ ] *(a detalhar quando eu abrir o `feat:` de métricas — validações, edição, exclusão)*

### 5.3 Registros — 🔲 a fazer

- [ ] **Dado** uma métrica existente, **quando** lanço um registro com valor e data, **então** ele persiste e aparece no histórico.
- [ ] **Dado** um registro com data futura ou valor inválido, **quando** tento salvar, **então** recebo um erro claro e nada é gravado.
- [ ] *(a detalhar)*

### 5.4 Estudos — 🔲 a fazer

- [ ] **Dado** uma sessão de estudo, **quando** registro matéria e duração, **então** ela entra no total do período.
- [ ] **Dado** um período selecionado, **quando** olho o resumo, **então** vejo o tempo total estudado e a divisão por matéria.
- [ ] *(a detalhar)*

### 5.5 Estatísticas e visualização — 🔲 a fazer

- [ ] **Dado** uma métrica com N registros num período, **quando** abro o resumo, **então** vejo no mínimo: contagem, média, mínimo, máximo e a tendência (subiu/desceu vs. período anterior).
- [ ] **Dado** uma métrica com **menos de 2 registros**, **quando** abro o resumo, **então** a UI diz que não há dados suficientes — não mostra média de um ponto só nem `NaN`.
- [ ] **Dado** qualquer cálculo estatístico, **quando** ele roda, **então** existe um teste (`bun test`) cobrindo o caso normal **e** o caso degenerado (lista vazia, um elemento, valores iguais).
- [ ] *(a detalhar)*

### 5.6 Atividades — cadastro (back-end) — ✅ back pronto

> API pronta e verificada de ponta a ponta contra o Postgres. A **tela** de cadastro é entrega separada do agente de front (por isso os critérios de UI da §4 ficam pendentes aqui).

- [x] **Dado** um body com `category`, `hours` e `minutes`, **quando** faço `POST /api/activities`, **então** a atividade é criada (`201`), a duração é gravada em minutos (`hours*60+minutes`) e a `date` assume o dia de hoje se eu não mandar uma.
- [x] **Dado** que quero lançar uma atividade de ontem, **quando** mando `date` no body (`YYYY-MM-DD`), **então** ela é gravada naquela data.
- [x] **Dado** `hours`/`minutes` que somam zero, **quando** tento criar, **então** recebo `422` com `code: "INVALID_DURATION"` e nada é gravado.
- [x] **Dado** uma categoria fora de `estudo|alimentacao|academia`, **quando** tento criar, **então** recebo `422 VALIDATION` — o TypeBox barra na borda e o pgEnum garante no banco.
- [x] **Dado** atividades cadastradas, **quando** faço `GET /api/activities`, **então** recebo a lista ordenada por `date` (desc).
- [x] **Dado** um id, **quando** faço `GET/PUT/DELETE /api/activities/:id`, **então** busco, edito (reusa o schema do create) ou removo (`204`); id inexistente responde `404 NOT_FOUND` no shape único.
- [ ] **(front)** Tela de cadastro de atividade com os três estados (vazio, carregando, erro) — pendente, agente de front.

---

## 6. Decisões técnicas travadas

| Decisão | Escolha |
| --- | --- |
| Estrutura | Monorepo `apps/web` + `apps/server` + `packages/shared` |
| Gerenciador de pacotes | pnpm (workspaces) |
| Runtime | Bun |
| Front | React 19 + Vite + Tailwind 4 + shadcn/ui |
| Server | Bun + **Elysia** |
| ORM | **Drizzle** (driver `postgres.js`) |
| Migrações | `drizzle-kit` — versionadas em `apps/server/drizzle/` e commitadas |
| Banco | Postgres em Docker Compose (host `:5433` → container `5432`, pra não colidir com Postgres local) |
| Autenticação | Nenhuma (single-user) |
| Modelo de Atividade | `duration_minutes` (inteiro; horas+minutos são só a entrada). `date` como **dia de calendário** (sem hora → sem fuso). Categoria como **pgEnum + TypeBox** derivados de uma lista única (`ACTIVITY_CATEGORIES`) em `shared`. |
| Contrato front↔back | Schemas **TypeBox** em `packages/shared`; Elysia valida request/response com o mesmo schema; o front deriva o tipo (`typeof Schema.static`). Contrato com body de request **exige** schema. |
| Formato de erro | Toda rota que falha responde `{ error: { message: string; code: string } }` com o HTTP status adequado — o front trata um formato só. |

## 7. Decisões em aberto

Resolver quando a primeira feature esbarrar nelas — **perguntar, não assumir**:

- **Modelagem das tabelas**: primeira tabela criada — `activities` (ver §5.6). As de métrica/registro/sessão de estudo nascem na primeira `feat:` que precisar delas.
- **Gráficos**: qual biblioteca (Recharts, visx, ...) — decidir só quando a primeira tela de gráfico existir.
- **Fuso horário / "o que é um dia"**: resolvido para atividades usando `date` (dia de calendário, sem hora) — não há UTC a converter. Revisitar se algum dado futuro precisar de timestamp com hora.
- **Roteamento no front**: o app é uma tela só ou precisa de router?
