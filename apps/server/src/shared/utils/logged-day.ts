import { UnprocessableEntityError } from "@/shared/infra/errors/unprocessable-entity-error";
import { isCalendarDay } from "./calendar-day";

/**
 * Dia em que algo é lançado (atividade, registro de métrica). Regra pura — sem banco, sem env;
 * "hoje" é parâmetro.
 *
 * `date` omitida = hoje. Dia que não existe (ex.: "2026-02-31") → 422 `VALIDATION`; depois de
 * hoje → 422 `FUTURE_DATE`. Hoje é aceito.
 */
export function resolveLoggedDay(date: string | undefined, today: string): string {
  const day = date ?? today;
  if (!isCalendarDay(day)) throw new UnprocessableEntityError("Invalid date.", "VALIDATION");
  // "YYYY-MM-DD" compara como texto na mesma ordem do calendário.
  if (day > today) throw new UnprocessableEntityError("The date can't be in the future.", "FUTURE_DATE");
  return day;
}
