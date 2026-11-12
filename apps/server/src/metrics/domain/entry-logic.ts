import { UnprocessableEntityError } from "@/shared/infra/errors/unprocessable-entity-error";

/**
 * Regras puras dos registros de métrica — sem banco, sem env. O dia do registro segue a regra
 * comum de `shared/utils/logged-day.ts`.
 */

/** Registro inexistente, de outra métrica ou de outro usuário (mesma resposta nos três casos). */
export const ENTRY_NOT_FOUND_MESSAGE = "Entry not found.";

/** O valor precisa ser um número finito (JSON não tem `NaN`/`Infinity`, mas a regra não depende disso). */
export function assertFiniteValue(value: number): void {
  if (!Number.isFinite(value)) throw new UnprocessableEntityError("The value must be a finite number.", "VALIDATION");
}
