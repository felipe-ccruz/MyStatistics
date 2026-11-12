import { t } from "elysia";
import { IdParam } from "@/shared/infra/id-param";

/**
 * Schemas TypeBox que só o server usa. Body de request e tipo de response são contrato e
 * moram em `packages/shared` — aqui ficam só os parâmetros de rota.
 */

/** Path param `:id`: inteiro de 1 ao limite do `integer` do Postgres (ver `IdParam`). */
export const ActivityIdParams = t.Object({ id: IdParam });

export type ActivityIdParams = typeof ActivityIdParams.static;
