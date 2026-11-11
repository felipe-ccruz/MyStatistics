import type { CreateMetric, Metric } from "@mystatistics/shared";
import type { SessionUser } from "@/auth/domain/auth.types";
import { db } from "@/shared/infra/databases/postgres";
import { isUniqueViolation } from "@/shared/infra/databases/postgres-errors";
import { ConflictError } from "@/shared/infra/errors/conflict-error";
import { toMetric } from "../domain/metric.mapper";
import { METRIC_NAME_TAKEN_MESSAGE, normalizeMetricName, normalizeMetricUnit } from "../domain/metric-logic";
import { MetricRepository } from "../infra/metric.repository";

type CreateMetricInput = SessionUser & CreateMetric;

/**
 * Cria a métrica do usuário. Nome e unidade gravados sem espaços nas pontas; nome só de espaços
 * → 422 `VALIDATION`. Nome que o usuário já usa, sem diferenciar maiúsculas → 409 `METRIC_NAME_TAKEN`,
 * também na corrida em que dois pedidos passam juntos pela checagem e o índice único barra o segundo.
 */
export async function createMetricUseCase({ userId, ...input }: CreateMetricInput): Promise<Metric> {
  const name = normalizeMetricName(input.name);
  const unit = normalizeMetricUnit(input.unit);

  try {
    return await db.transaction(async (tx) => {
      if (await MetricRepository.findByName(userId, name, tx)) throw metricNameTaken();

      return toMetric(await MetricRepository.create({ userId, name, unit }, tx));
    });
  } catch (error) {
    if (isUniqueViolation(error)) throw metricNameTaken();
    throw error;
  }
}

function metricNameTaken(): ConflictError {
  return new ConflictError(METRIC_NAME_TAKEN_MESSAGE, "METRIC_NAME_TAKEN");
}
