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
