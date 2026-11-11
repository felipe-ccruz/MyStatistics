import type { SessionUser } from "@/auth/domain/auth.types";
import { db } from "@/shared/infra/databases/postgres";
import { NotFoundError } from "@/shared/infra/errors/not-found-error";
import type { MetricIdParams } from "../domain/metric.types";
import { METRIC_NOT_FOUND_MESSAGE } from "../domain/metric-logic";
import { MetricRepository } from "../infra/metric.repository";

type DeleteMetricInput = SessionUser & MetricIdParams;

/** Remove a métrica do usuário e os registros dela; inexistente ou de outro usuário → 404 `NOT_FOUND`. */
export async function deleteMetricUseCase({ userId, id }: DeleteMetricInput): Promise<void> {
  await db.transaction(async (tx) => {
    const current = await MetricRepository.findById(userId, id, tx);
    if (!current) throw new NotFoundError(METRIC_NOT_FOUND_MESSAGE);

    await MetricRepository.delete(userId, id, tx);
  });
}
