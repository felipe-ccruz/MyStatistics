import { ACTIVITY_CATEGORIES, type ActivitySummary, type SummaryPeriod } from "@mystatistics/shared";
import { addDaysISO, daysEndingOn } from "@/shared/utils/calendar-day";
import { type CategoryMinutes, type DayMinutes, emptyCategoryMinutes, minutesOn, totalMinutesOf } from "./day-minutes";

/** Resumo das atividades num período que termina hoje. Lógica pura; "hoje" é parâmetro. */

/** Quantos dias cada período tem (todos terminam hoje, inclusive). */
export const PERIOD_DAYS: Record<SummaryPeriod, number> = { "7d": 7, "30d": 30 };

/** Os dias que o resumo precisa ler: o período anterior inteiro e o atual, até hoje. */
export function summaryRangeOf(period: SummaryPeriod, today: string): { from: string; to: string } {
  return { from: addDaysISO(today, -(2 * PERIOD_DAYS[period] - 1)), to: today };
}

/**
 * - `perDay`: todos os dias do período, do mais antigo até hoje, com 0 nos vazios;
 * - `averagePerDay`: total ÷ dias do período (com ou sem atividade), sem arredondar;
 * - `bestDay`: o dia com mais minutos (empate → o mais recente); `null` se o período está vazio;
 * - `trend`: compara com o período anterior de mesmo tamanho; `changePercent` é `null` quando o
 *   anterior tem 0 minutos (não há base para a variação).
 */
export function periodSummaryOf(period: SummaryPeriod, byDay: DayMinutes, today: string): ActivitySummary {
  const length = PERIOD_DAYS[period];
  const days = daysEndingOn(today, length);
  const previousDays = daysEndingOn(addDaysISO(today, -length), length);

  const perCategory: CategoryMinutes = emptyCategoryMinutes();
  const perDay: ActivitySummary["perDay"] = [];
  let totalMinutes = 0;
  let activeDays = 0;
  let bestDay: ActivitySummary["bestDay"] = null;

  for (const date of days) {
    const minutes = { ...minutesOn(byDay, date) };
    const dayTotal = totalMinutesOf(minutes);
    perDay.push({ date, minutes });
    for (const category of ACTIVITY_CATEGORIES) perCategory[category] += minutes[category];
    totalMinutes += dayTotal;
    if (dayTotal > 0) {
      activeDays += 1;
      // `>=` com os dias em ordem crescente: no empate fica o mais recente.
      if (bestDay === null || dayTotal >= bestDay.totalMinutes) bestDay = { date, totalMinutes: dayTotal };
    }
  }

  const previousTotalMinutes = previousDays.reduce((sum, date) => sum + totalMinutesOf(minutesOn(byDay, date)), 0);
  const changePercent =
    previousTotalMinutes === 0 ? null : ((totalMinutes - previousTotalMinutes) / previousTotalMinutes) * 100;

  return {
    period,
    from: days[0] ?? today,
    to: today,
    totalMinutes,
    averagePerDay: totalMinutes / length,
    activeDays,
    perCategory,
    bestDay,
    trend: { previousTotalMinutes, changePercent },
    perDay,
  };
}
