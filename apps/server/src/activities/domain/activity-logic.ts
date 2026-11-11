import { UnprocessableEntityError } from "@/shared/infra/errors/unprocessable-entity-error";

/**
 * Lógica pura das atividades — sem banco, sem env. Fica isolada aqui para ser
 * testável com `bun test` sem subir Postgres nem carregar variáveis de ambiente.
 */

/** Minutos totais a partir de horas + minutos. Exige resultado > 0. */
export function toDurationMinutes(hours: number, minutes: number): number {
  const total = hours * 60 + minutes;
  if (total <= 0) {
    throw new UnprocessableEntityError("Duration must be greater than zero.", "INVALID_DURATION");
  }
  return total;
}
