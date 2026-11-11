import type { Progress } from "@mystatistics/shared";
import { type DayMinutes, totalMinutesOf } from "@/activities/domain/day-minutes";
import { addDaysISO, daysEndingOn } from "@/shared/utils/calendar-day";

/** Streak (D5): dias seguidos com pelo menos uma atividade. Lógica pura; "hoje" é parâmetro. */

/** Quantos dias o `week` do streak mostra (os últimos 7, terminando hoje). */
export const STREAK_WEEK_DAYS = 7;

/**
 * - `current`: dias seguidos terminando hoje; se hoje ainda não tem atividade, terminando ontem
 *   (o streak não "quebra" antes de o dia acabar).
 * - `best`: a maior sequência da história (inclui dias depois de hoje, se houver).
 * - `week`: os últimos 7 dias, do mais antigo até hoje.
 */
export function streakOf(byDay: DayMinutes, today: string): Progress["streak"] {
  const activeDays = new Set([...byDay].filter(([, minutes]) => totalMinutesOf(minutes) > 0).map(([date]) => date));

  let current = 0;
  let day = activeDays.has(today) ? today : addDaysISO(today, -1);
  while (activeDays.has(day)) {
    current += 1;
    day = addDaysISO(day, -1);
  }

  return {
    current,
    best: longestRunOf(activeDays),
    week: daysEndingOn(today, STREAK_WEEK_DAYS).map((date) => ({ date, active: activeDays.has(date) })),
  };
}

/** Maior sequência de dias consecutivos do conjunto. */
function longestRunOf(activeDays: ReadonlySet<string>): number {
  let best = 0;
  let run = 0;
  let previous: string | null = null;

  // "YYYY-MM-DD" ordena como texto na mesma ordem do calendário.
  for (const date of [...activeDays].sort()) {
    run = previous !== null && addDaysISO(previous, 1) === date ? run + 1 : 1;
    best = Math.max(best, run);
    previous = date;
  }
  return best;
}
