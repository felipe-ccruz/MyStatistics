import type { Metric } from "@mystatistics/shared";
import type { SessionUser } from "@/auth/domain/auth.types";
import { toMetric } from "../domain/metric.mapper";
import { MetricRepository } from "../infra/metric.repository";

/** Lista as métricas do usuário por nome (sem diferenciar maiúsculas). */
export async function listMetricsUseCase({ userId }: SessionUser): Promise<Metric[]> {
  const rows = await MetricRepository.findAll(userId);
  return rows.map(toMetric);
}
