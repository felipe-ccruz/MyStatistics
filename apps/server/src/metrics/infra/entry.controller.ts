import { CreateEntry, type Entry } from "@mystatistics/shared";
import { authGuard } from "@/shared/infra/auth.guard";
import { createController } from "@/shared/infra/base.controller";
import { createEntryUseCase } from "../application/create-entry.usecase";
import { deleteEntryUseCase } from "../application/delete-entry.usecase";
import { listEntriesUseCase } from "../application/list-entries.usecase";
import { EntryIdParams, MetricIdParams } from "../domain/metric.types";

/**
 * Rotas HTTP dos registros de uma métrica (`/metrics/:id/entries`). O controller só traduz
 * HTTP ↔ use case: valida a entrada com os schemas, chama o use case e define o status.
 *
 * Todas exigem sessão (`authGuard`: 401 sem cookie); métrica ou registro de outro usuário → 404.
 */
export const EntryController = createController({ prefix: "/metrics", tags: ["Metrics"] })
  .use(authGuard)

  // GET /api/metrics/:id/entries
  .get("/:id/entries", ({ params, userId }): Promise<Entry[]> => listEntriesUseCase({ metricId: params.id, userId }), {
    params: MetricIdParams,
    detail: { summary: "List a metric's entries", description: "Most recent first (date desc, then id desc)." },
  })

  // POST /api/metrics/:id/entries
  .post(
    "/:id/entries",
    async ({ params, body, userId, set }): Promise<Entry> => {
      const entry = await createEntryUseCase({ ...body, metricId: params.id, userId });
      set.status = 201;
      return entry;
    },
    {
      params: MetricIdParams,
      body: CreateEntry,
      detail: {
        summary: "Log an entry",
        description: "Date defaults to today; a future date answers 422 FUTURE_DATE and nothing is saved.",
      },
    },
  )

  // DELETE /api/metrics/:id/entries/:entryId
  .delete(
    "/:id/entries/:entryId",
    async ({ params, userId, set }) => {
      await deleteEntryUseCase({ metricId: params.id, entryId: params.entryId, userId });
      set.status = 204;
    },
    {
      params: EntryIdParams,
      detail: { summary: "Delete an entry" },
    },
  );
