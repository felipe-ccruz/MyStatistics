import { UnprocessableEntityError } from "@/shared/infra/errors/unprocessable-entity-error";

/**
 * Lógica pura das atividades — sem banco, sem env. Fica isolada aqui para ser
 * testável com `bun test` sem subir Postgres nem carregar variáveis de ambiente.
 */

/** Minutos totais a partir de horas + minutos. Exige resultado > 0. */
export function toDurationMinutes(hours: number, minutes: number): number {
  const total = hours * 60 + minutes;
  if (total <= 0) {
    throw new UnprocessableEntityError("A duração precisa ser maior que zero.", "INVALID_DURATION");
  }
  return total;
}

/** Dia de hoje no formato "YYYY-MM-DD" (horário local do servidor). */
export function todayISO(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}
