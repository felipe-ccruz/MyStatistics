import { afterEach, beforeAll, beforeEach, describe, expect, it } from "bun:test";
import { addDaysISO, todayISO } from "@/shared/utils/calendar-day";
import { IntegrationTestHelper, type TestUser } from "@/shared/utils/test-helpers/integration-test-helper";
import type { MetricRow } from "../domain/metric.schema";
import { EntryRepository } from "../infra/entry.repository";
import { MetricRepository } from "../infra/metric.repository";
import { createEntryUseCase } from "./create-entry.usecase";

describe("createEntryUseCase - Integration", () => {
  let user: TestUser;
  let metric: MetricRow;

  beforeAll(() => IntegrationTestHelper.setupTestDatabase());
  beforeEach(async () => {
    user = await IntegrationTestHelper.createTestUser();
    metric = await MetricRepository.create({ userId: user.id, name: "Weight", unit: "kg" });
  });
  afterEach(() => IntegrationTestHelper.truncateAll());

  describe("Sucesso", () => {
    it("grava o registro na métrica do usuário e o devolve", async () => {
      const entry = await createEntryUseCase({ userId: user.id, metricId: metric.id, value: 79.5, date: "2026-10-20" });

      expect(entry).toEqual({ id: expect.any(Number), metricId: metric.id, value: 79.5, date: "2026-10-20" });
      expect(await EntryRepository.findById(user.id, metric.id, entry.id)).toMatchObject({ userId: user.id });
    });

    it("usa o dia de hoje quando date não vem, e aceita hoje", async () => {
      const entry = await createEntryUseCase({ userId: user.id, metricId: metric.id, value: 80 });

      expect(entry.date).toBe(todayISO());
    });

    it("aceita 0 e valor negativo", async () => {
      const zero = await createEntryUseCase({ userId: user.id, metricId: metric.id, value: 0 });
      const negative = await createEntryUseCase({ userId: user.id, metricId: metric.id, value: -2.5 });

      expect([zero.value, negative.value]).toEqual([0, -2.5]);
    });
  });

  describe("Erros", () => {
    it("recusa data futura com 422 FUTURE_DATE e não grava nada", async () => {
      const tomorrow = addDaysISO(todayISO(), 1);

      const error = await IntegrationTestHelper.rejectionOf(
        createEntryUseCase({ userId: user.id, metricId: metric.id, value: 80, date: tomorrow }),
      );

      expect(error).toMatchObject({ status: 422, apiCode: "FUTURE_DATE" });
      expect(await EntryRepository.findAll(user.id, metric.id)).toHaveLength(0);
    });

    it("recusa dia inexistente com 422 VALIDATION", async () => {
      const error = await IntegrationTestHelper.rejectionOf(
        createEntryUseCase({ userId: user.id, metricId: metric.id, value: 80, date: "2026-02-31" }),
      );

      expect(error).toMatchObject({ status: 422, apiCode: "VALIDATION" });
    });

    it("recusa valor não finito com 422 VALIDATION", async () => {
      const error = await IntegrationTestHelper.rejectionOf(
        createEntryUseCase({ userId: user.id, metricId: metric.id, value: Number.POSITIVE_INFINITY }),
      );

      expect(error).toMatchObject({ status: 422, apiCode: "VALIDATION" });
    });

    it("responde 404 NOT_FOUND para métrica inexistente", async () => {
      const error = await IntegrationTestHelper.rejectionOf(
        createEntryUseCase({ userId: user.id, metricId: 999, value: 80 }),
      );

      expect(error).toMatchObject({ status: 404, apiCode: "NOT_FOUND" });
    });

    it("responde 404 NOT_FOUND para métrica de outro usuário, sem gravar nada nela", async () => {
      const other = await IntegrationTestHelper.createTestUser();
      const theirs = await MetricRepository.create({ userId: other.id, name: "Weight", unit: "kg" });

      const error = await IntegrationTestHelper.rejectionOf(
        createEntryUseCase({ userId: user.id, metricId: theirs.id, value: 80 }),
      );

      expect(error).toMatchObject({ status: 404, apiCode: "NOT_FOUND" });
      expect(await EntryRepository.findAll(other.id, theirs.id)).toHaveLength(0);
    });
  });
});
