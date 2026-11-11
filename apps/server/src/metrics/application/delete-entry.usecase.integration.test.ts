import { afterEach, beforeAll, beforeEach, describe, expect, it } from "bun:test";
import { IntegrationTestHelper, type TestUser } from "@/shared/utils/test-helpers/integration-test-helper";
import type { MetricRow } from "../domain/metric.schema";
import { EntryRepository } from "../infra/entry.repository";
import { MetricRepository } from "../infra/metric.repository";
import { deleteEntryUseCase } from "./delete-entry.usecase";

describe("deleteEntryUseCase - Integration", () => {
  let user: TestUser;
  let metric: MetricRow;

  beforeAll(() => IntegrationTestHelper.setupTestDatabase());
  beforeEach(async () => {
    user = await IntegrationTestHelper.createTestUser();
    metric = await MetricRepository.create({ userId: user.id, name: "Weight", unit: "kg" });
  });
  afterEach(() => IntegrationTestHelper.truncateAll());

  describe("Sucesso", () => {
    it("apaga só o registro pedido", async () => {
      const gone = await EntryRepository.create({
        metricId: metric.id,
        userId: user.id,
        value: 80,
        date: "2026-10-01",
      });
      const kept = await EntryRepository.create({
        metricId: metric.id,
        userId: user.id,
        value: 79,
        date: "2026-10-02",
      });

      await deleteEntryUseCase({ userId: user.id, metricId: metric.id, entryId: gone.id });

      const ids = (await EntryRepository.findAll(user.id, metric.id)).map((entry) => entry.id);
      expect(ids).toEqual([kept.id]);
    });
  });

  describe("Erros", () => {
    it("responde 404 NOT_FOUND para registro inexistente", async () => {
      const error = await IntegrationTestHelper.rejectionOf(
        deleteEntryUseCase({ userId: user.id, metricId: metric.id, entryId: 999 }),
      );

      expect(error).toMatchObject({ status: 404, apiCode: "NOT_FOUND" });
    });

    it("responde 404 NOT_FOUND para registro de outra métrica do mesmo usuário, sem apagá-lo", async () => {
      const mood = await MetricRepository.create({ userId: user.id, name: "Mood", unit: "" });
      const entry = await EntryRepository.create({ metricId: mood.id, userId: user.id, value: 4, date: "2026-10-01" });

      const error = await IntegrationTestHelper.rejectionOf(
        deleteEntryUseCase({ userId: user.id, metricId: metric.id, entryId: entry.id }),
      );

      expect(error).toMatchObject({ status: 404, apiCode: "NOT_FOUND" });
      expect(await EntryRepository.findById(user.id, mood.id, entry.id)).not.toBeNull();
    });

    it("responde 404 NOT_FOUND para registro de outro usuário, sem apagá-lo", async () => {
      const other = await IntegrationTestHelper.createTestUser();
      const theirs = await MetricRepository.create({ userId: other.id, name: "Weight", unit: "kg" });
      const entry = await EntryRepository.create({
        metricId: theirs.id,
        userId: other.id,
        value: 70,
        date: "2026-10-01",
      });

      const error = await IntegrationTestHelper.rejectionOf(
        deleteEntryUseCase({ userId: user.id, metricId: theirs.id, entryId: entry.id }),
      );

      expect(error).toMatchObject({ status: 404, apiCode: "NOT_FOUND" });
      expect(await EntryRepository.findById(other.id, theirs.id, entry.id)).not.toBeNull();
    });
  });
});
