import { t } from "elysia";

/**
 * Schemas TypeBox que só o server usa. Body de request e tipo de response são contrato e
 * moram em `packages/shared` — aqui ficam só os parâmetros de rota.
 */

/** Path param `:id`. `t.Numeric()` converte a string da URL em número e rejeita o que não for. */
export const ActivityIdParams = t.Object({ id: t.Numeric() });

export type ActivityIdParams = typeof ActivityIdParams.static;
