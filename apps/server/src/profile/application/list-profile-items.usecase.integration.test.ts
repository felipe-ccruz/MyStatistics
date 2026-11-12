import { afterEach, beforeAll, beforeEach, describe, expect, it } from "bun:test";
import { MetricRepository } from "@/metrics/infra/metric.repository";
import { IntegrationTestHelper, type TestUser } from "@/shared/utils/test-helpers/integration-test-helper";
import { ProfileItemRepository } from "../infra/profile-item.repository";
import { listProfileItemsUseCase } from "./list-profile-items.usecase";

describe("listProfileItemsUseCase - Integration", () => {
  let user: TestUser;

  beforeAll(() => IntegrationTestHelper.setupTestDatabase());
  beforeEach(async () => {
    user = await IntegrationTestHelper.createTestUser();
  });
  afterEach(() => IntegrationTestHelper.truncateAll());

  describe("Sucesso", () => {
    it("usuário novo: progress e as categorias, tudo oculto", async () => {
      expect(await listProfileItemsUseCase({ userId: user.id })).toEqual([
        { kind: "progress", ref: "", label: "Progress", visible: false },
        { kind: "activity_category", ref: "study", label: "Study", visible: false },
        { kind: "activity_category", ref: "exercise", label: "Exercise", visible: false },
      ]);
    });

    it("lista as métricas por nome com o visible gravado; métrica nova nasce oculta", async () => {
      const weight = await MetricRepository.create({ userId: user.id, name: "Weight", unit: "kg" });
      const mood = await MetricRepository.create({ userId: user.id, name: "mood", unit: "" });
      await ProfileItemRepository.upsert({ userId: user.id, kind: "metric", ref: String(weight.id), visible: true });
      await ProfileItemRepository.upsert({ userId: user.id, kind: "activity_category", ref: "study", visible: true });

      const items = await listProfileItemsUseCase({ userId: user.id });

      expect(items.slice(1)).toEqual([
        { kind: "activity_category", ref: "study", label: "Study", visible: true },
        { kind: "activity_category", ref: "exercise", label: "Exercise", visible: false },
        { kind: "metric", ref: String(mood.id), label: "mood", visible: false },
        { kind: "metric", ref: String(weight.id), label: "Weight", visible: true },
      ]);
    });
  });

  describe("Isolamento", () => {
    it("não lista as métricas nem as escolhas de outro usuário", async () => {
      const other = await IntegrationTestHelper.createTestUser();
      await MetricRepository.create({ userId: other.id, name: "Weight", unit: "kg" });
      await ProfileItemRepository.upsert({ userId: other.id, kind: "progress", ref: "", visible: true });

      const items = await listProfileItemsUseCase({ userId: user.id });

      expect(items).toHaveLength(3);
      expect(items.every((item) => !item.visible)).toBe(true);
    });
  });
});
