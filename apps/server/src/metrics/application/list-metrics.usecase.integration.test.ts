import { afterEach, beforeAll, beforeEach, describe, expect, it } from "bun:test";
import { IntegrationTestHelper, type TestUser } from "@/shared/utils/test-helpers/integration-test-helper";
import { MetricRepository } from "../infra/metric.repository";
import { listMetricsUseCase } from "./list-metrics.usecase";

describe("listMetricsUseCase - Integration", () => {
  let user: TestUser;

  beforeAll(() => IntegrationTestHelper.setupTestDatabase());
  beforeEach(async () => {
    user = await IntegrationTestHelper.createTestUser();
  });
  afterEach(() => IntegrationTestHelper.truncateAll());

  describe("Sucesso", () => {
    it("devolve lista vazia quando o usuário não tem métricas", async () => {
      expect(await listMetricsUseCase({ userId: user.id })).toEqual([]);
    });

    it("ordena por nome, sem diferenciar maiúsculas", async () => {
      for (const name of ["weight", "Body fat", "Mood"]) {
        await MetricRepository.create({ userId: user.id, name, unit: "" });
      }

      const names = (await listMetricsUseCase({ userId: user.id })).map((metric) => metric.name);

      expect(names).toEqual(["Body fat", "Mood", "weight"]);
    });
  });

  describe("Isolamento", () => {
    it("não lista métricas de outro usuário", async () => {
      const other = await IntegrationTestHelper.createTestUser();
      await MetricRepository.create({ userId: other.id, name: "Theirs", unit: "" });
      const mine = await MetricRepository.create({ userId: user.id, name: "Mine", unit: "kg" });

      expect(await listMetricsUseCase({ userId: user.id })).toEqual([{ id: mine.id, name: "Mine", unit: "kg" }]);
    });
  });
});
