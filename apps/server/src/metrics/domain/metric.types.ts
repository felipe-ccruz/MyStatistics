import { t } from "elysia";
import { IdParam } from "@/shared/infra/id-param";

/**
 * Schemas TypeBox que só o server usa. Body de request e tipo de response são contrato e
 * moram em `packages/shared` — aqui ficam só os parâmetros de rota.
 */

/** Path param `:id` da métrica: inteiro de 1 ao limite do `integer` do Postgres (ver `IdParam`). */
export const MetricIdParams = t.Object({ id: IdParam });

export type MetricIdParams = typeof MetricIdParams.static;

/** Path params `:id` (métrica) e `:entryId` (registro). */
export const EntryIdParams = t.Object({ id: IdParam, entryId: IdParam });

export type EntryIdParams = typeof EntryIdParams.static;
