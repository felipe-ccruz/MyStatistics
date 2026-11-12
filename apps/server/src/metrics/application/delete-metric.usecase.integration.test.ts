import { afterEach, beforeAll, beforeEach, describe, expect, it } from "bun:test";
import { eq } from "drizzle-orm";
import { ProfileItemRepository } from "@/profile/infra/profile-item.repository";
import { db } from "@/shared/infra/databases/postgres";
import { IntegrationTestHelper, type TestUser } from "@/shared/utils/test-helpers/integration-test-helper";
import { entriesTable } from "../domain/metric.schema";
import { MetricRepository } from "../infra/metric.repository";
import { deleteMetricUseCase } from "./delete-metric.usecase";

describe("deleteMetricUseCase - Integration", () => {
  let user: TestUser;

  beforeAll(() => IntegrationTestHelper.setupTestDatabase());
  beforeEach(async () => {
    user = await IntegrationTestHelper.createTestUser();
  });
  afterEach(() => IntegrationTestHelper.truncateAll());

  describe("Sucesso", () => {
    it("apaga a métrica e os registros dela", async () => {
      const metric = await MetricRepository.create({ userId: user.id, name: "Weight", unit: "kg" });
      await db.insert(entriesTable).values([
        { metricId: metric.id, userId: user.id, value: 80, date: "2026-11-10" },
        { metricId: metric.id, userId: user.id, value: 79.5, date: "2026-11-11" },
      ]);

      await deleteMetricUseCase({ userId: user.id, id: metric.id });

      expect(await MetricRepository.findById(user.id, metric.id)).toBeNull();
      expect(await db.select().from(entriesTable).where(eq(entriesTable.metricId, metric.id))).toHaveLength(0);
    });

    it("remove a escolha de visibilidade da métrica no portfólio e mantém as outras", async () => {
      const metric = await MetricRepository.create({ userId: user.id, name: "Weight", unit: "kg" });
      const kept = await MetricRepository.create({ userId: user.id, name: "Mood", unit: "" });
      await ProfileItemRepository.upsert({ userId: user.id, kind: "metric", ref: String(metric.id), visible: true });
      await ProfileItemRepository.upsert({ userId: user.id, kind: "metric", ref: String(kept.id), visible: true });
      await ProfileItemRepository.upsert({ userId: user.id, kind: "progress", ref: "", visible: true });

      await deleteMetricUseCase({ userId: user.id, id: metric.id });

      const refs = (await ProfileItemRepository.findAll(user.id)).map((row) => `${row.kind}:${row.ref}`).sort();
      expect(refs).toEqual([`metric:${kept.id}`, "progress:"]);
    });
  });

  describe("Erros", () => {
    it("responde 404 NOT_FOUND para id inexistente", async () => {
      const error = await IntegrationTestHelper.rejectionOf(deleteMetricUseCase({ userId: user.id, id: 999 }));

      expect(error).toMatchObject({ status: 404, apiCode: "NOT_FOUND" });
    });

    it("responde 404 NOT_FOUND para métrica de outro usuário, sem apagá-la", async () => {
      const other = await IntegrationTestHelper.createTestUser();
      const theirs = await MetricRepository.create({ userId: other.id, name: "Weight", unit: "kg" });

      const error = await IntegrationTestHelper.rejectionOf(deleteMetricUseCase({ userId: user.id, id: theirs.id }));

      expect(error).toMatchObject({ status: 404, apiCode: "NOT_FOUND" });
      expect(await MetricRepository.findById(other.id, theirs.id)).not.toBeNull();
    });
  });
});
