import { t } from "elysia";
import { MAX_INTEGER_ID } from "@/shared/utils/integer-id";

/**
 * Id inteiro num path param (`:id`, `:entryId`). `t.Numeric` converte o texto da URL em número;
 * os limites barram fração, zero, negativo e valor fora do `integer` do Postgres com 422
 * `VALIDATION` — sem eles a query chegaria ao banco e a resposta seria 500.
 */
export const IdParam = t.Numeric({ minimum: 1, maximum: MAX_INTEGER_ID, multipleOf: 1 });
