import type { MetricSummary, MetricSummaryQuery } from "@mystatistics/shared";
import type { SessionUser } from "@/auth/domain/auth.types";
import { NotFoundError } from "@/shared/infra/errors/not-found-error";
import { todayISO } from "@/shared/utils/calendar-day";
import { METRIC_NOT_FOUND_MESSAGE } from "../domain/metric-logic";
import { metricSummaryOf, metricSummaryRangeOf } from "../domain/metric-summary";
import { EntryRepository } from "../infra/entry.repository";
import { MetricRepository } from "../infra/metric.repository";

type GetMetricSummaryInput = SessionUser &
  MetricSummaryQuery & {
    metricId: number;
    /** Dia usado como "hoje". Padrão: o dia de calendário do server; os testes fixam um dia. */
    today?: string;
  };

/**
 * Estatísticas dos registros da métrica do usuário no período (`7d`/`30d` terminam hoje; `all` é a
 * história inteira), com a tendência contra o período anterior. Métrica inexistente ou de outro
 * usuário → 404 `NOT_FOUND`. O banco devolve os registros do intervalo; a conta é `metricSummaryOf`.
 */
export async function getMetricSummaryUseCase({
  userId,
  metricId,
  period,
  today = todayISO(),
}: GetMetricSummaryInput): Promise<MetricSummary> {
  const metric = await MetricRepository.findById(userId, metricId);
  if (!metric) throw new NotFoundError(METRIC_NOT_FOUND_MESSAGE);

  const entries = await EntryRepository.valuesBetween(userId, metricId, metricSummaryRangeOf(period, today));
  return metricSummaryOf(period, entries, today);
}
