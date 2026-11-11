import { UnprocessableEntityError } from "@/shared/infra/errors/unprocessable-entity-error";
import { isCalendarDay } from "@/shared/utils/calendar-day";

/** Regras puras dos registros de métrica — sem banco, sem env; "hoje" é parâmetro. */

/** Registro inexistente, de outra métrica ou de outro usuário (mesma resposta nos três casos). */
export const ENTRY_NOT_FOUND_MESSAGE = "Entry not found.";

/** O valor precisa ser um número finito (JSON não tem `NaN`/`Infinity`, mas a regra não depende disso). */
export function assertFiniteValue(value: number): void {
  if (!Number.isFinite(value)) throw new UnprocessableEntityError("The value must be a finite number.", "VALIDATION");
}

/**
 * Dia do registro: `date` omitida = hoje. Dia que não existe (ex.: "2026-02-31") → 422 `VALIDATION`;
 * depois de hoje → 422 `FUTURE_DATE`. Hoje é aceito.
 */
export function resolveEntryDate(date: string | undefined, today: string): string {
  const day = date ?? today;
  if (!isCalendarDay(day)) throw new UnprocessableEntityError("Invalid date.", "VALIDATION");
  // "YYYY-MM-DD" compara como texto na mesma ordem do calendário.
  if (day > today) throw new UnprocessableEntityError("The date can't be in the future.", "FUTURE_DATE");
  return day;
}
