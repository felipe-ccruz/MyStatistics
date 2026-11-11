import { Type as t } from "@sinclair/typebox";

/**
 * Body de `POST /api/metrics`. Regras do server além do schema: o nome é gravado sem
 * espaços nas pontas (só espaços → 422 `VALIDATION`) e é único por usuário sem
 * diferenciar maiúsculas ("Weight" e "weight" são o mesmo) → 409 `METRIC_NAME_TAKEN`.
 */
export const CreateMetric = t.Object({
  name: t.String({ minLength: 1, maxLength: 60 }),
  unit: t.String({ maxLength: 20 }),
});

export type CreateMetric = typeof CreateMetric.static;

/**
 * Body de `POST /api/metrics/:id/entries`. `date` omitida = hoje (dia de calendário do
 * server); data futura → 422 `FUTURE_DATE` e nada é gravado.
 */
export const CreateEntry = t.Object({
  value: t.Number(),
  date: t.Optional(t.String({ pattern: "^\\d{4}-\\d{2}-\\d{2}$" })),
});

export type CreateEntry = typeof CreateEntry.static;
