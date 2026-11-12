import type { SessionUser } from "@/auth/domain/auth.types";
import { metricRefOf } from "@/profile/domain/profile-item-logic";
import { ProfileItemRepository } from "@/profile/infra/profile-item.repository";
import { db } from "@/shared/infra/databases/postgres";
import { NotFoundError } from "@/shared/infra/errors/not-found-error";
import type { MetricIdParams } from "../domain/metric.types";
import { METRIC_NOT_FOUND_MESSAGE } from "../domain/metric-logic";
import { MetricRepository } from "../infra/metric.repository";

type DeleteMetricInput = SessionUser & MetricIdParams;

/**
 * Remove a métrica do usuário, os registros dela e a escolha de visibilidade dela no portfólio
 * (o item some da lista); inexistente ou de outro usuário → 404 `NOT_FOUND`. Tudo numa transação.
 */
export async function deleteMetricUseCase({ userId, id }: DeleteMetricInput): Promise<void> {
  await db.transaction(async (tx) => {
    const current = await MetricRepository.findById(userId, id, tx);
    if (!current) throw new NotFoundError(METRIC_NOT_FOUND_MESSAGE);

    await MetricRepository.delete(userId, id, tx);
    await ProfileItemRepository.delete(userId, "metric", metricRefOf(id), tx);
  });
}
