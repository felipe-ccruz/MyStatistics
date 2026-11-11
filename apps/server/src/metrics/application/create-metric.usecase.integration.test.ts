import { afterEach, beforeAll, beforeEach, describe, expect, it } from "bun:test";
import { isUniqueViolation } from "@/shared/infra/databases/postgres-errors";
import { IntegrationTestHelper, type TestUser } from "@/shared/utils/test-helpers/integration-test-helper";
import { MetricRepository } from "../infra/metric.repository";
import { createMetricUseCase } from "./create-metric.usecase";

describe("createMetricUseCase - Integration", () => {
  let user: TestUser;

  beforeAll(() => IntegrationTestHelper.setupTestDatabase());
  beforeEach(async () => {
    user = await IntegrationTestHelper.createTestUser();
  });
  afterEach(() => IntegrationTestHelper.truncateAll());

  describe("Sucesso", () => {
    it("grava a métrica do usuário sem espaços nas pontas e a devolve", async () => {
      const metric = await createMetricUseCase({ userId: user.id, name: "  Body weight ", unit: " kg " });

      expect(metric).toEqual({ id: expect.any(Number), name: "Body weight", unit: "kg" });
      expect(await MetricRepository.findById(user.id, metric.id)).toMatchObject({ userId: user.id });
    });

    it("aceita unidade vazia", async () => {
      const metric = await createMetricUseCase({ userId: user.id, name: "Mood", unit: "" });

      expect(metric.unit).toBe("");
    });

    it("deixa outro usuário usar o mesmo nome", async () => {
      const other = await IntegrationTestHelper.createTestUser();
      await createMetricUseCase({ userId: other.id, name: "Weight", unit: "kg" });

      const metric = await createMetricUseCase({ userId: user.id, name: "Weight", unit: "lb" });

      expect(metric.name).toBe("Weight");
    });
  });

  describe("Erros", () => {
    it("recusa nome só de espaços com 422 VALIDATION e não grava nada", async () => {
      const error = await IntegrationTestHelper.rejectionOf(
        createMetricUseCase({ userId: user.id, name: "   ", unit: "kg" }),
      );

      expect(error).toMatchObject({ status: 422, apiCode: "VALIDATION" });
      expect(await MetricRepository.findAll(user.id)).toHaveLength(0);
    });

    it("recusa nome repetido sem diferenciar maiúsculas nem espaços com 409 METRIC_NAME_TAKEN", async () => {
      await createMetricUseCase({ userId: user.id, name: "Weight", unit: "kg" });

      for (const name of ["Weight", "weight", " WEIGHT "]) {
        const error = await IntegrationTestHelper.rejectionOf(createMetricUseCase({ userId: user.id, name, unit: "" }));

        expect(error).toMatchObject({ status: 409, apiCode: "METRIC_NAME_TAKEN" });
      }
      expect(await MetricRepository.findAll(user.id)).toHaveLength(1);
    });

    it("o índice único barra o nome repetido mesmo sem a checagem do use case (corrida)", async () => {
      await MetricRepository.create({ userId: user.id, name: "Weight", unit: "kg" });

      const error = await IntegrationTestHelper.rejectionOf(
        MetricRepository.create({ userId: user.id, name: "WEIGHT", unit: "kg" }),
      );

      expect(isUniqueViolation(error)).toBe(true);
    });
  });
});
