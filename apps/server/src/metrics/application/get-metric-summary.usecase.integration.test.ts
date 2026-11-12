import { afterEach, beforeAll, beforeEach, describe, expect, it } from "bun:test";
import { todayISO } from "@/shared/utils/calendar-day";
import { IntegrationTestHelper, type TestUser } from "@/shared/utils/test-helpers/integration-test-helper";
import type { MetricRow } from "../domain/metric.schema";
import { EntryRepository } from "../infra/entry.repository";
import { MetricRepository } from "../infra/metric.repository";
import { getMetricSummaryUseCase } from "./get-metric-summary.usecase";

const TODAY = "2026-11-11";

describe("getMetricSummaryUseCase - Integration", () => {
  let user: TestUser;
  let metric: MetricRow;

  beforeAll(() => IntegrationTestHelper.setupTestDatabase());
  beforeEach(async () => {
    user = await IntegrationTestHelper.createTestUser();
    metric = await MetricRepository.create({ userId: user.id, name: "Weight", unit: "kg" });
  });
  afterEach(() => IntegrationTestHelper.truncateAll());

  function log(value: number, date: string, metricId = metric.id, userId = user.id) {
    return EntryRepository.create({ metricId, userId, value, date });
  }

  describe("Sucesso", () => {
    it("métrica sem registro: contagem 0 e tudo null", async () => {
      const summary = await getMetricSummaryUseCase({
        userId: user.id,
        metricId: metric.id,
        period: "7d",
        today: TODAY,
      });

      expect(summary).toEqual({
        period: "7d",
        count: 0,
        mean: null,
        min: null,
        max: null,
        trend: null,
        enoughData: false,
      });
    });

    it("7d resume os registros até hoje e compara com o período anterior", async () => {
      await log(82, "2026-10-29");
      await log(80, "2026-11-04");
      await log(79, "2026-11-05");
      await log(78, TODAY);
      await log(500, "2026-10-01"); // fora dos dois períodos

      const summary = await getMetricSummaryUseCase({
        userId: user.id,
        metricId: metric.id,
        period: "7d",
        today: TODAY,
      });

      expect(summary).toEqual({
        period: "7d",
        count: 2,
        mean: 78.5,
        min: 78,
        max: 79,
        trend: { direction: "down", previousMean: 81 },
        enoughData: true,
      });
    });

    it("um registro só: sem média nem tendência", async () => {
      await log(80, "2026-11-01");
      await log(79, TODAY);

      const summary = await getMetricSummaryUseCase({
        userId: user.id,
        metricId: metric.id,
        period: "7d",
        today: TODAY,
      });

      expect(summary).toMatchObject({ count: 1, mean: null, min: 79, max: 79, trend: null, enoughData: false });
    });

    it("all cobre a história inteira, sem tendência", async () => {
      await log(-2, "2020-01-01");
      await log(4, "2026-11-01");

      const summary = await getMetricSummaryUseCase({
        userId: user.id,
        metricId: metric.id,
        period: "all",
        today: TODAY,
      });

      expect(summary).toEqual({ period: "all", count: 2, mean: 1, min: -2, max: 4, trend: null, enoughData: true });
    });

    it("ignora os registros de outra métrica do mesmo usuário", async () => {
      const other = await MetricRepository.create({ userId: user.id, name: "Mood", unit: "" });
      await log(5, TODAY, other.id);

      const summary = await getMetricSummaryUseCase({
        userId: user.id,
        metricId: metric.id,
        period: "7d",
        today: TODAY,
      });

      expect(summary.count).toBe(0);
    });

    it("usa o dia de calendário do server quando today não vem", async () => {
      await log(1, todayISO());

      expect((await getMetricSummaryUseCase({ userId: user.id, metricId: metric.id, period: "7d" })).count).toBe(1);
    });
  });

  describe("Erros", () => {
    it("responde 404 NOT_FOUND para métrica inexistente", async () => {
      const error = await IntegrationTestHelper.rejectionOf(
        getMetricSummaryUseCase({ userId: user.id, metricId: 999, period: "7d" }),
      );

      expect(error).toMatchObject({ status: 404, apiCode: "NOT_FOUND" });
    });

    it("responde 404 NOT_FOUND para métrica de outro usuário", async () => {
      const other = await IntegrationTestHelper.createTestUser();
      const theirs = await MetricRepository.create({ userId: other.id, name: "Weight", unit: "kg" });
      await log(80, TODAY, theirs.id, other.id);

      const error = await IntegrationTestHelper.rejectionOf(
        getMetricSummaryUseCase({ userId: user.id, metricId: theirs.id, period: "7d" }),
      );

      expect(error).toMatchObject({ status: 404, apiCode: "NOT_FOUND" });
    });
  });
});
