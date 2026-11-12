import type { ActivityCategory, ActivitySummary, ActivitySummaryQuery } from "@mystatistics/shared";
import type { SessionUser } from "@/auth/domain/auth.types";
import { todayISO } from "@/shared/utils/calendar-day";
import { toDayMinutes } from "../domain/day-minutes";
import { periodSummaryOf, summaryRangeOf } from "../domain/period-summary";
import { ActivityRepository } from "../infra/activity.repository";

type GetActivitySummaryInput = SessionUser &
  ActivitySummaryQuery & {
    /** Dia usado como "hoje". Padrão: o dia de calendário do server; os testes fixam um dia. */
    today?: string;
    /**
     * Resumo só desta categoria (uso interno: o portfólio público). Os minutos das outras vêm 0, e
     * `studyBySubject` vem vazio fora de `study`. Omitida = todas as categorias (a rota do dono).
     */
    category?: ActivityCategory;
  };

/**
 * Resumo das atividades do usuário no período que termina hoje, comparado com o período anterior
 * de mesmo tamanho, com o tempo de study por matéria. O banco agrega os minutos por dia; a conta
 * é `periodSummaryOf`.
 */
export async function getActivitySummaryUseCase({
  userId,
  period,
  today = todayISO(),
  category,
}: GetActivitySummaryInput): Promise<ActivitySummary> {
  const range = summaryRangeOf(period, today);
  const withStudy = category === undefined || category === "study";
  const [rows, studyRows] = await Promise.all([
    ActivityRepository.minutesPerDayAndCategory(userId, range),
    withStudy ? ActivityRepository.studyMinutesPerDayAndSubjectBetween(userId, range.from, range.to) : [],
  ]);
  const kept = category === undefined ? rows : rows.filter((row) => row.category === category);
  return periodSummaryOf(period, toDayMinutes(kept), today, studyRows);
}
