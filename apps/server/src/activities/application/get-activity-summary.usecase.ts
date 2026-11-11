import type { ActivitySummary, ActivitySummaryQuery } from "@mystatistics/shared";
import type { SessionUser } from "@/auth/domain/auth.types";
import { todayISO } from "@/shared/utils/calendar-day";
import { toDayMinutes } from "../domain/day-minutes";
import { periodSummaryOf, summaryRangeOf } from "../domain/period-summary";
import { ActivityRepository } from "../infra/activity.repository";

type GetActivitySummaryInput = SessionUser &
  ActivitySummaryQuery & {
    /** Dia usado como "hoje". Padrão: o dia de calendário do server; os testes fixam um dia. */
    today?: string;
  };

/**
 * Resumo das atividades do usuário no período que termina hoje, comparado com o período anterior
 * de mesmo tamanho. O banco agrega os minutos por dia; a conta é `periodSummaryOf`.
 */
export async function getActivitySummaryUseCase({
  userId,
  period,
  today = todayISO(),
}: GetActivitySummaryInput): Promise<ActivitySummary> {
  const range = summaryRangeOf(period, today);
  const rows = await ActivityRepository.minutesPerDayAndCategoryBetween(userId, range.from, range.to);
  return periodSummaryOf(period, toDayMinutes(rows), today);
}
