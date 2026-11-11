import type { Entry } from "@mystatistics/shared";
import type { SessionUser } from "@/auth/domain/auth.types";
import { NotFoundError } from "@/shared/infra/errors/not-found-error";
import { toEntry } from "../domain/metric.mapper";
import { METRIC_NOT_FOUND_MESSAGE } from "../domain/metric-logic";
import { EntryRepository } from "../infra/entry.repository";
import { MetricRepository } from "../infra/metric.repository";

type ListEntriesInput = SessionUser & { metricId: number };

/**
 * Lista os registros da métrica do usuário, do mais recente (`date` desc) para o mais antigo;
 * empate por `id` desc. Métrica inexistente ou de outro usuário → 404 `NOT_FOUND` (não lista vazia).
 */
export async function listEntriesUseCase({ userId, metricId }: ListEntriesInput): Promise<Entry[]> {
  const metric = await MetricRepository.findById(userId, metricId);
  if (!metric) throw new NotFoundError(METRIC_NOT_FOUND_MESSAGE);

  const rows = await EntryRepository.findAll(userId, metricId);
  return rows.map(toEntry);
}
