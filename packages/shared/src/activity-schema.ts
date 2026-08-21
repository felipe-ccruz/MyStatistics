import { t } from "elysia";
import { ACTIVITY_CATEGORIES } from "./activity";

/**
 * Body de criação/edição de atividade. O server valida com ESTE mesmo schema
 * (`{ body: CreateActivity }`), o front tipa o form com `CreateActivity`.
 *
 * O tempo entra como `hours` + `minutes` (o que o usuário digita); o server
 * calcula `duration_minutes = hours*60 + minutes` e exige > 0. `date` é opcional:
 * omitida, o server usa o dia de hoje; informada, permite lançar dias anteriores.
 */
export const CreateActivity = t.Object({
  category: t.Union(ACTIVITY_CATEGORIES.map((c) => t.Literal(c))),
  hours: t.Integer({ minimum: 0 }),
  minutes: t.Integer({ minimum: 0, maximum: 59 }),
  date: t.Optional(t.String({ pattern: "^\\d{4}-\\d{2}-\\d{2}$" })),
});

export type CreateActivity = typeof CreateActivity.static;

/**
 * Body de atualização parcial (PATCH). Todos os campos são opcionais — o cliente
 * manda só o que quer mudar. Regra do server: `hours` e `minutes` vêm juntos (ou
 * nenhum), porque a duração é recalculada a partir dos dois; body vazio é rejeitado.
 */
export const UpdateActivity = t.Object({
  category: t.Optional(t.Union(ACTIVITY_CATEGORIES.map((c) => t.Literal(c)))),
  hours: t.Optional(t.Integer({ minimum: 0 })),
  minutes: t.Optional(t.Integer({ minimum: 0, maximum: 59 })),
  date: t.Optional(t.String({ pattern: "^\\d{4}-\\d{2}-\\d{2}$" })),
});

export type UpdateActivity = typeof UpdateActivity.static;
