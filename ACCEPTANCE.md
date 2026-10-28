# Critérios de Aceite — MyStatistics

> Documento vivo. É a fonte da verdade sobre **o que a aplicação precisa fazer** e **quando uma feature está pronta**.
> Toda feature (`feat:`) termina com este arquivo atualizado. Se um critério aqui não passa, a feature não está pronta.

**Última atualização:** 2026-10-21

---

## 1. Visão

MyStatistics é uma aplicação **multiusuário** para registrar métricas do dia a dia e transformá-las em estatística útil. Cada pessoa tem a **própria conta** e o **próprio perfil**, e os dados de um usuário nunca se misturam com os de outro. Junta três coisas num lugar só:

- **Métricas do dia a dia** — números que eu registro periodicamente (ex.: peso, sono, gasto, humor).
- **Registros pessoais** — os lançamentos em si, com data, valor e contexto.
- **Estatísticas de estudo** — tempo estudado, por matéria/tópico, e a evolução disso ao longo do tempo.

O valor não está em guardar o dado, está em **ver o que ele diz**: tendência, média, comparação entre períodos.

**Perfil como portfólio.** O perfil é **privado por padrão**: só o dono vê. Se quiser, o dono ativa um **link público** (ex.: `/u/felipe`) e o perfil vira um portfólio. Mesmo público, o dono **escolhe item por item** o que fica visível. Dá pra mostrar horas de estudo e o level e esconder peso e humor, por exemplo.

## 2. Fora de escopo (por enquanto)

Registrado aqui para não virar discussão depois. Nada disso entra sem eu mudar este arquivo primeiro:

- App mobile nativo.
- Importação automática de fontes externas (Google Fit, planilhas, bancos).
- Recursos sociais: seguir, curtir, comentar, feed, ranking entre usuários. O portfólio é **só leitura**.
- Busca ou listagem de perfis públicos. Visitante só chega a um portfólio pelo link.
- Exportação de dados (CSV, PDF...).

## 3. Glossário

Vocabulário fixo. Código, rotas e UI usam **estes** nomes — sem sinônimos soltos.

| Termo | Significado |
| --- | --- |
| **Usuário** (`user`) | Uma conta: quem faz login. Todo dado (métrica, registro, atividade...) pertence a exatamente um usuário. |
| **Perfil** (`profile`) | A página de estatísticas de um usuário. Tem um identificador único na URL (`slug`) e uma visibilidade (`private` ou `public`). |
| **Portfólio** | O perfil visto por um **visitante**, quando o dono tornou o perfil público. Mostra só os itens marcados como visíveis. |
| **Visitante** | Quem abre um portfólio sem ser o dono, logado ou não. Só lê, nunca edita. |
| **Métrica** (`metric`) | A *definição* do que é medido: nome, unidade, tipo de valor. Ex.: "Peso (kg)". |
| **Registro** (`entry`) | Um *lançamento* de uma métrica: valor + data. Ex.: "Peso = 78.4 em 2026-07-12". |
| **Sessão de estudo** (`study session`) | Um bloco de estudo: matéria/tópico, duração, data. |
| **Atividade** (`activity`) | Um lançamento de tempo gasto numa categoria (`study` ou `exercise`), num dia. `exercise` cobre qualquer exercício físico: academia, corrida, bike etc. Ex.: "Study = 90 min em 2026-08-21". |
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
- [ ] **Isolamento entre usuários:** toda rota que lê ou escreve dado filtra pelo usuário logado. O usuário A nunca lê, edita nem apaga dado do usuário B, nem chutando o id na URL (responde `404`, não `403`, para não revelar que o id existe).
- [ ] Os critérios da própria feature foram adicionados na seção 5 deste arquivo.

## 5. Critérios por funcionalidade

> Formato: **Dado / Quando / Então**. Cada `feat:` implementado ganha um bloco aqui.

### 5.1 Infra e fundação — ✅ pronto

- [x] **Dado** que estou na raiz do projeto, **quando** rodo `pnpm dev`, **então** front (`:5173`) e server (`:3333`) sobem juntos, com logs prefixados, sem eu entrar em nenhuma pasta.
- [x] **Dado** que os dois estão no ar, **quando** o front chama `/api/...`, **então** o Vite faz proxy pro server e a resposta chega — sem o front conhecer a porta da API.
- [x] **Dado** um tipo em `packages/shared`, **quando** front e server o importam, **então** os dois compilam contra o mesmo contrato.
- [x] **Dado** que o Postgres está **fora do ar**, **quando** chamo `/api/health`, **então** recebo `503` com `{ status: "degraded", db: "down" }` — a API não finge que está saudável.
- [x] **Dado** o `pnpm db:up`, **quando** o server sobe, **então** ele conecta no Postgres e `/api/health` responde `200` com `{ status: "ok", db: "ok" }` — validado direto (`:3333`) e pelo proxy do Vite (`:5173`).

### 5.1.1 Contas e perfil — 🔲 a fazer

> Base de tudo o que vem depois: nenhuma outra feature de dado fica pronta sem dono.

- [ ] **Dado** que não tenho conta, **quando** me cadastro, **então** minha conta é criada junto com um perfil **privado** e já entro logado.
- [ ] **Dado** que tenho conta, **quando** faço login, **então** vejo as **minhas** estatísticas e só elas.
- [ ] **Dado** que não estou logado, **quando** tento abrir o dashboard ou chamar uma rota de dados, **então** sou mandado para o login (front) ou recebo `401 UNAUTHORIZED` no shape único (API).
- [ ] **Dado** que estou logado, **quando** faço logout, **então** a sessão acaba e um `F5` não me loga de volta.
- [ ] **Dado** o cadastro, **quando** escolho um `slug` que já existe, **então** recebo um erro claro e escolho outro.
- [ ] *(a detalhar no `feat:` — método de autenticação, recuperação de senha, edição de perfil)*

### 5.1.2 Portfólio público — 🔲 a fazer

- [ ] **Dado** um perfil novo, **quando** ninguém mexeu na visibilidade, **então** ele é **privado**.
- [ ] **Dado** um perfil privado, **quando** um visitante abre `/u/<slug>`, **então** vê "perfil não encontrado", a mesma resposta de um slug inexistente. Não dá pra descobrir que o perfil existe.
- [ ] **Dado** que sou o dono, **quando** torno meu perfil público, **então** `/u/<slug>` passa a abrir para qualquer pessoa, mesmo deslogada.
- [ ] **Dado** um perfil público, **quando** marco um item como **oculto** (ex.: a métrica "Peso"), **então** o visitante não vê esse item em lugar nenhum: nem na tela, nem na resposta da API.
- [ ] **Dado** um item novo criado com o perfil já público, **quando** eu não disser nada, **então** ele nasce **oculto**. Expor é sempre uma escolha explícita.
- [ ] **Dado** que sou visitante, **quando** abro um portfólio, **então** só leio: nenhum botão de criar, editar ou apagar aparece, e a API recusa a escrita.
- [ ] **Dado** que volto o perfil para privado, **quando** um visitante abre o link de novo, **então** recebe "perfil não encontrado".
- [ ] *(a detalhar no `feat:` — granularidade exata do que pode ser exposto: métrica, categoria de atividade, level/XP, registros individuais ou só resumo)*

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
- [x] **Dado** uma categoria fora de `study|exercise` (inclusive os valores antigos `estudo`, `alimentacao`, `academia`), **quando** tento criar, **então** recebo `422 VALIDATION` — o TypeBox barra na borda e o pgEnum garante no banco.
- [x] **Dado** atividades cadastradas, **quando** faço `GET /api/activities`, **então** recebo a lista ordenada por `date` (desc).
- [x] **Dado** um id, **quando** faço `GET/PATCH/DELETE /api/activities/:id`, **então** busco, edito ou removo (`204`); id inexistente responde `404 NOT_FOUND` no shape único.
- [x] **Dado** um `PATCH` parcial, **quando** mando só os campos que quero mudar, **então** só eles mudam; `hours`/`minutes` vêm juntos (ou nenhum) para recalcular a duração, e body vazio responde `422`.
- [ ] **(front)** Tela de cadastro de atividade com os três estados (vazio, carregando, erro) — pendente, agente de front.
- [ ] **(multiusuário)** Atividade passa a pertencer a um usuário (`user_id`). Todas as rotas acima filtram pelo usuário logado, conforme o isolamento da §4. Depende da §5.1.1.

---

## 6. Decisões técnicas travadas

| Decisão | Escolha |
| --- | --- |
| Estrutura | Monorepo `apps/web` + `apps/server` + `packages/shared` |
| Gerenciador de pacotes | pnpm (workspaces) |
| Runtime | Bun |
| Front | React 19 + Vite + Tailwind 4 + shadcn/ui |
| Idioma da UI | **Inglês** (ex.: rótulos "Study" / "Exercise"). |
| Server | Bun + **Elysia** |
| ORM | **Drizzle** (driver `postgres.js`) |
| Migrações | `drizzle-kit` — versionadas em `apps/server/drizzle/` e commitadas |
| Estrutura do server | **Módulos por feature** em `apps/server/src/<modulo>/`, com `domain` / `application` / `infra`: controller → use case → repository. Módulo de referência: `activities`. |
| Testes | Só no server, com `bun test`: **unitário** para regra pura e **integração** por use case, contra um Postgres de teste separado (`db-test`) recriado a partir das migrações. |
| Banco | Postgres em Docker Compose (host `:5433` → container `5432`, pra não colidir com Postgres local) |
| Usuários | **Multiusuário.** Todo dado tem dono (`user_id`). Perfil privado por padrão, com portfólio público opcional e visibilidade escolhida item a item. |
| Modelo de Atividade | `duration_minutes` (inteiro; horas+minutos são só a entrada). `date` como **dia de calendário** (sem hora → sem fuso). Categoria como **pgEnum + TypeBox** derivados de uma lista única (`ACTIVITY_CATEGORIES`) em `shared`: `study` e `exercise`, valores em inglês (`exercise` cobre qualquer exercício físico). |
| Contrato front↔back | Schemas **TypeBox** em `packages/shared`; Elysia valida request/response com o mesmo schema; o front deriva o tipo (`typeof Schema.static`). Contrato com body de request **exige** schema. |
| Formato de erro | Toda rota que falha responde `{ error: { message: string; code: string } }` com o HTTP status adequado — o front trata um formato só. |

## 7. Decisões em aberto

Resolver quando a primeira feature esbarrar nelas — **perguntar, não assumir**:

- **Modelagem das tabelas**: primeira tabela criada — `activities` (ver §5.6). As de métrica/registro/sessão de estudo nascem na primeira `feat:` que precisar delas.
- **Gráficos**: qual biblioteca (Recharts, visx, ...) — decidir só quando a primeira tela de gráfico existir.
- **Fuso horário / "o que é um dia"**: resolvido para atividades usando `date` (dia de calendário, sem hora) — não há UTC a converter. Revisitar se algum dado futuro precisar de timestamp com hora.
- **Autenticação**: método (e-mail + senha, login com Google, link mágico por e-mail) e mecanismo (sessão em cookie httpOnly vs. token; lib pronta tipo Better Auth vs. feito à mão). Decidir no `feat:` de contas (§5.1.1).
- **Atividades existentes sem dono**: na migração para multiusuário, os registros atuais vão para o primeiro usuário criado ou são descartados?
- **Roteamento no front**: o portfólio exige URL própria (`/u/<slug>`) além do login e do dashboard, então **vai precisar de router**. Falta escolher qual (React Router, TanStack Router).
