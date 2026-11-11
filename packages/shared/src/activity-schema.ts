import { Type as t } from "@sinclair/typebox";
import { ACTIVITY_CATEGORIES } from "./activity";

/**
 * Body de criação/edição de atividade. O server valida com ESTE mesmo schema
 * (`{ body: CreateActivity }`), o front tipa o form com `CreateActivity`.
 *
 * O tempo entra como `hours` + `minutes` (o que o usuário digita); o server
 * calcula `duration_minutes = hours*60 + minutes` e exige > 0. `date` é opcional:
 * omitida, o server usa o dia de hoje; informada, permite lançar dias anteriores.
 * Dia que não existe (ex.: `2026-02-31`) → 422 `VALIDATION`; dia depois de hoje → 422 `FUTURE_DATE`.
 *
 * `subject` (a matéria, ex.: "Calculus") é opcional e só vale para `category: "study"`;
 * com outra categoria → 422 `SUBJECT_NOT_ALLOWED`. O server grava sem espaços nas pontas
 * (só espaços → 422 `VALIDATION`). Sessão de estudo = atividade `study` com `subject`.
 */
export const CreateActivity = t.Object({
  category: t.Union(ACTIVITY_CATEGORIES.map((c) => t.Literal(c))),
  hours: t.Integer({ minimum: 0 }),
  minutes: t.Integer({ minimum: 0, maximum: 59 }),
  date: t.Optional(t.String({ pattern: "^\\d{4}-\\d{2}-\\d{2}$" })),
  subject: t.Optional(t.String({ minLength: 1, maxLength: 60 })),
});

export type CreateActivity = typeof CreateActivity.static;

/**
 * Body de atualização parcial (PATCH). Todos os campos são opcionais — o cliente
 * manda só o que quer mudar. Regra do server: `hours` e `minutes` vêm juntos (ou
 * nenhum), porque a duração é recalculada a partir dos dois; body vazio é rejeitado.
 * `subject: null` remove a matéria. Mudar a categoria para `exercise` numa atividade com
 * matéria, sem mandar `subject: null` junto, → 422 `SUBJECT_NOT_ALLOWED`.
 */
export const UpdateActivity = t.Object({
  category: t.Optional(t.Union(ACTIVITY_CATEGORIES.map((c) => t.Literal(c)))),
  hours: t.Optional(t.Integer({ minimum: 0 })),
  minutes: t.Optional(t.Integer({ minimum: 0, maximum: 59 })),
  date: t.Optional(t.String({ pattern: "^\\d{4}-\\d{2}-\\d{2}$" })),
  subject: t.Optional(t.Union([t.String({ minLength: 1, maxLength: 60 }), t.Null()])),
});

export type UpdateActivity = typeof UpdateActivity.static;
