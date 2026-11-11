import { afterEach, beforeAll, beforeEach, describe, expect, it } from "bun:test";
import { IntegrationTestHelper, type TestUser } from "@/shared/utils/test-helpers/integration-test-helper";
import type { MetricRow } from "../domain/metric.schema";
import { EntryRepository } from "../infra/entry.repository";
import { MetricRepository } from "../infra/metric.repository";
import { listEntriesUseCase } from "./list-entries.usecase";

describe("listEntriesUseCase - Integration", () => {
  let user: TestUser;
  let metric: MetricRow;

  beforeAll(() => IntegrationTestHelper.setupTestDatabase());
  beforeEach(async () => {
    user = await IntegrationTestHelper.createTestUser();
    metric = await MetricRepository.create({ userId: user.id, name: "Weight", unit: "kg" });
  });
  afterEach(() => IntegrationTestHelper.truncateAll());

  function log(metricId: number, value: number, date: string, userId = user.id) {
    return EntryRepository.create({ metricId, userId, value, date });
  }

  describe("Sucesso", () => {
    it("devolve lista vazia quando a métrica não tem registros", async () => {
      expect(await listEntriesUseCase({ userId: user.id, metricId: metric.id })).toEqual([]);
    });

    it("ordena por date desc e desempata por id desc", async () => {
      const older = await log(metric.id, 81, "2026-10-01");
      const first = await log(metric.id, 80, "2026-10-02");
      const second = await log(metric.id, 79.5, "2026-10-02");

      const entries = await listEntriesUseCase({ userId: user.id, metricId: metric.id });

      expect(entries.map((entry) => entry.id)).toEqual([second.id, first.id, older.id]);
      expect(entries[0]).toEqual({ id: second.id, metricId: metric.id, value: 79.5, date: "2026-10-02" });
    });

    it("só traz os registros desta métrica", async () => {
      const otherMetric = await MetricRepository.create({ userId: user.id, name: "Mood", unit: "" });
      await log(otherMetric.id, 4, "2026-10-01");
      const mine = await log(metric.id, 80, "2026-10-01");

      const ids = (await listEntriesUseCase({ userId: user.id, metricId: metric.id })).map((entry) => entry.id);

      expect(ids).toEqual([mine.id]);
    });
  });

  describe("Erros", () => {
    it("responde 404 NOT_FOUND para métrica inexistente", async () => {
      const error = await IntegrationTestHelper.rejectionOf(listEntriesUseCase({ userId: user.id, metricId: 999 }));

      expect(error).toMatchObject({ status: 404, apiCode: "NOT_FOUND" });
    });

    it("responde 404 NOT_FOUND para métrica de outro usuário", async () => {
      const other = await IntegrationTestHelper.createTestUser();
      const theirs = await MetricRepository.create({ userId: other.id, name: "Weight", unit: "kg" });
      await log(theirs.id, 70, "2026-10-01", other.id);

      const error = await IntegrationTestHelper.rejectionOf(
        listEntriesUseCase({ userId: user.id, metricId: theirs.id }),
      );

      expect(error).toMatchObject({ status: 404, apiCode: "NOT_FOUND" });
    });
  });
});
