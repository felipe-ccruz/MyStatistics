import { UnprocessableEntityError } from "@/shared/infra/errors/unprocessable-entity-error";
import { hasControlCharacter } from "@/shared/utils/text";

/** Regras puras das métricas — sem banco, sem env. */

export const METRIC_NAME_TAKEN_MESSAGE = "You already have a metric with this name.";

/** Métrica inexistente ou de outro usuário (mesma resposta nos dois casos). */
export const METRIC_NOT_FOUND_MESSAGE = "Metric not found.";

/**
 * Nome da métrica sem espaços nas pontas. Só espaços, ou caractere de controle (ex.: byte nulo)
 * → 422 `VALIDATION` (o schema só exige 1 caractere).
 */
export function normalizeMetricName(name: string): string {
  if (hasControlCharacter(name)) throw new UnprocessableEntityError("Invalid metric name.", "VALIDATION");
  const trimmed = name.trim();
  if (trimmed === "") throw new UnprocessableEntityError("Metric name can't be blank.", "VALIDATION");
  return trimmed;
}

/** Unidade sem espaços nas pontas; vazia é válida (ex.: humor de 1 a 5). Caractere de controle → 422 `VALIDATION`. */
export function normalizeMetricUnit(unit: string): string {
  if (hasControlCharacter(unit)) throw new UnprocessableEntityError("Invalid unit.", "VALIDATION");
  return unit.trim();
}
