import type { MetricSummary, MetricSummaryPeriod } from "@mystatistics/shared";
import { addDaysISO, type DayRange } from "@/shared/utils/calendar-day";
import { meanOf, summarize, trendOf } from "@/statistics/domain/summarize";

/** Resumo dos registros de uma métrica num período. Lógica pura; "hoje" é parâmetro. */

/** Quantos dias têm os períodos com fim (todos terminam hoje, inclusive). `all` não tem limite. */
export const METRIC_PERIOD_DAYS: Record<Exclude<MetricSummaryPeriod, "all">, number> = { "7d": 7, "30d": 30 };

/** O valor e o dia de um registro: o que o resumo precisa. */
export type DatedValue = { date: string; value: number };

/** Os dias que o resumo precisa ler: o período anterior inteiro e o atual, até hoje; `all` lê tudo. */
export function metricSummaryRangeOf(period: MetricSummaryPeriod, today: string): DayRange {
  if (period === "all") return {};
  return { from: addDaysISO(today, -(2 * METRIC_PERIOD_DAYS[period] - 1)), to: today };
}

/**
 * `7d`/`30d`: os registros dos últimos N dias até hoje; a tendência compara a média deles com a
 * do período anterior de mesmo tamanho (`null` sem dados suficientes no atual ou sem registro no
 * anterior). `all`: todos os registros, sem tendência.
 */
export function metricSummaryOf(
  period: MetricSummaryPeriod,
  entries: readonly DatedValue[],
  today: string,
): MetricSummary {
  if (period === "all") return { period, ...summarize(entries.map((entry) => entry.value)), trend: null };

  const length = METRIC_PERIOD_DAYS[period];
  const from = addDaysISO(today, -(length - 1));
  const previousFrom = addDaysISO(today, -(2 * length - 1));
  // "YYYY-MM-DD" compara como texto na mesma ordem do calendário.
  const current = entries.filter((entry) => entry.date >= from && entry.date <= today).map((entry) => entry.value);
  const previous = entries
    .filter((entry) => entry.date >= previousFrom && entry.date < from)
    .map((entry) => entry.value);

  const summary = summarize(current);
  return { period, ...summary, trend: trendOf(summary.mean, meanOf(previous)) };
}
