import { CreateMetric, type Metric, type MetricSummary, MetricSummaryQuery } from "@mystatistics/shared";
import { authGuard } from "@/shared/infra/auth.guard";
import { createController } from "@/shared/infra/base.controller";
import { createMetricUseCase } from "../application/create-metric.usecase";
import { deleteMetricUseCase } from "../application/delete-metric.usecase";
import { getMetricSummaryUseCase } from "../application/get-metric-summary.usecase";
import { listMetricsUseCase } from "../application/list-metrics.usecase";
import { MetricIdParams } from "../domain/metric.types";

/**
 * Rotas HTTP de métricas. O controller só traduz HTTP ↔ use case: valida a entrada com os
 * schemas, chama o use case e define o status.
 *
 * Todas exigem sessão (`authGuard`: 401 sem cookie) e só enxergam as métricas do usuário
 * logado — o `userId` vem da sessão, nunca do request.
 */
export const MetricController = createController({ prefix: "/metrics", tags: ["Metrics"] })
  .use(authGuard)

  // GET /api/metrics
  .get("/", ({ userId }): Promise<Metric[]> => listMetricsUseCase({ userId }), {
    detail: { summary: "List metrics", description: "The logged-in user's metrics, by name." },
  })

  // POST /api/metrics
  .post(
    "/",
    async ({ body, userId, set }): Promise<Metric> => {
      const metric = await createMetricUseCase({ ...body, userId });
      set.status = 201;
      return metric;
    },
    {
      body: CreateMetric,
      detail: {
        summary: "Create a metric",
        description: "Name is trimmed and unique per user, case-insensitively (409 METRIC_NAME_TAKEN).",
      },
    },
  )

  // GET /api/metrics/:id/summary?period=7d|30d|all
  .get(
    "/:id/summary",
    ({ params, query, userId }): Promise<MetricSummary> =>
      getMetricSummaryUseCase({ ...query, metricId: params.id, userId }),
    {
      params: MetricIdParams,
      query: MetricSummaryQuery,
      detail: {
        summary: "Summarize a metric's entries",
        description:
          "Count, mean, min and max over 7d, 30d (both ending today) or all; with fewer than 2 entries the mean " +
          "is null. The trend compares the mean with the previous period of the same length.",
      },
    },
  )

  // DELETE /api/metrics/:id
  .delete(
    "/:id",
    async ({ params, userId, set }) => {
      await deleteMetricUseCase({ ...params, userId });
      set.status = 204;
    },
    {
      params: MetricIdParams,
      detail: { summary: "Delete a metric", description: "Its entries are deleted too." },
    },
  );
