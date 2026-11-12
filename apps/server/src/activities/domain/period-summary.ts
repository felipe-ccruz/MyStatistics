import { ACTIVITY_CATEGORIES, type ActivitySummary, type SummaryPeriod } from "@mystatistics/shared";
import { addDaysISO, daysEndingOn } from "@/shared/utils/calendar-day";
import { type CategoryMinutes, type DayMinutes, emptyCategoryMinutes, minutesOn, totalMinutesOf } from "./day-minutes";

/** Resumo das atividades num período que termina hoje. Lógica pura; "hoje" é parâmetro. */

/** Nome do grupo das atividades `study` sem matéria, em `studyBySubject`. */
export const NO_SUBJECT_LABEL = "Other";

/** Linha do agregado SQL: soma dos minutos de `study` de uma matéria (ou sem matéria) num dia. */
export type DailySubjectMinutes = { date: string; subject: string | null; minutes: number };

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
 *   anterior tem 0 minutos (não há base para a variação);
 * - `studyBySubject`: ver `studyBySubjectOf`; `studyRows` são as linhas de `study` por dia e matéria
 *   (as de fora do período são ignoradas).
 */
export function periodSummaryOf(
  period: SummaryPeriod,
  byDay: DayMinutes,
  today: string,
  studyRows: readonly DailySubjectMinutes[] = [],
): ActivitySummary {
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
    studyBySubject: studyBySubjectOf(studyRows, new Set(days)),
  };
}

/**
 * Minutos de `study` por matéria nos dias dados: sem matéria entra em `"Other"`, do maior para o
 * menor e, no empate, por nome. Matéria com 0 minutos (e dia fora de `days`) não entra.
 */
export function studyBySubjectOf(
  rows: readonly DailySubjectMinutes[],
  days: ReadonlySet<string>,
): ActivitySummary["studyBySubject"] {
  const bySubject = new Map<string, number>();
  for (const row of rows) {
    if (!days.has(row.date)) continue;
    const subject = row.subject ?? NO_SUBJECT_LABEL;
    bySubject.set(subject, (bySubject.get(subject) ?? 0) + row.minutes);
  }
  return [...bySubject]
    .filter(([, minutes]) => minutes > 0)
    .map(([subject, minutes]) => ({ subject, minutes }))
    .sort((a, b) => b.minutes - a.minutes || compareText(a.subject, b.subject));
}

/** Ordem por código de caractere: determinística, sem depender do locale do server. */
function compareText(a: string, b: string): number {
  return a < b ? -1 : a > b ? 1 : 0;
}
