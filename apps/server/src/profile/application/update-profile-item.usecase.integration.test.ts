import { afterEach, beforeAll, beforeEach, describe, expect, it } from "bun:test";
import type { UpdateProfileItem } from "@mystatistics/shared";
import { deleteMetricUseCase } from "@/metrics/application/delete-metric.usecase";
import { MetricRepository } from "@/metrics/infra/metric.repository";
import { IntegrationTestHelper, type TestUser } from "@/shared/utils/test-helpers/integration-test-helper";
import { ProfileItemRepository } from "../infra/profile-item.repository";
import { updateProfileItemUseCase } from "./update-profile-item.usecase";

describe("updateProfileItemUseCase - Integration", () => {
  let user: TestUser;

  beforeAll(() => IntegrationTestHelper.setupTestDatabase());
  beforeEach(async () => {
    user = await IntegrationTestHelper.createTestUser();
  });
  afterEach(() => IntegrationTestHelper.truncateAll());

  function update(item: UpdateProfileItem, userId = user.id) {
    return updateProfileItemUseCase({ userId, ...item });
  }

  describe("Sucesso", () => {
    it("mostra e oculta o progress, sem duplicar a linha (upsert)", async () => {
      expect(await update({ kind: "progress", ref: "", visible: true })).toEqual({
        kind: "progress",
        ref: "",
        label: "Progress",
        visible: true,
      });
      expect(await update({ kind: "progress", ref: "", visible: false })).toMatchObject({ visible: false });

      expect(await ProfileItemRepository.findAll(user.id)).toEqual([
        { userId: user.id, kind: "progress", ref: "", visible: false },
      ]);
    });

    it("mostra uma categoria de atividade", async () => {
      expect(await update({ kind: "activity_category", ref: "exercise", visible: true })).toEqual({
        kind: "activity_category",
        ref: "exercise",
        label: "Exercise",
        visible: true,
      });
    });

    it("mostra uma métrica do usuário, com o nome dela de rótulo", async () => {
      const metric = await MetricRepository.create({ userId: user.id, name: "Weight", unit: "kg" });

      expect(await update({ kind: "metric", ref: String(metric.id), visible: true })).toEqual({
        kind: "metric",
        ref: String(metric.id),
        label: "Weight",
        visible: true,
      });
    });
  });

  describe("Erros", () => {
    async function expectNotFound(item: UpdateProfileItem, userId = user.id) {
      const error = await IntegrationTestHelper.rejectionOf(update(item, userId));

      expect(error).toMatchObject({ status: 404, apiCode: "NOT_FOUND" });
    }

    it('responde 404 NOT_FOUND para ref diferente de "" em progress', async () => {
      await expectNotFound({ kind: "progress", ref: "x", visible: true });
    });

    it("responde 404 NOT_FOUND para categoria inválida", async () => {
      for (const ref of ["", "Study", "food"]) await expectNotFound({ kind: "activity_category", ref, visible: true });
    });

    it("responde 404 NOT_FOUND para ref de métrica inexistente ou fora do formato", async () => {
      for (const ref of ["999", "", "abc", "01", "1.5", "99999999999"]) {
        await expectNotFound({ kind: "metric", ref, visible: true });
      }
    });

    it("responde 404 NOT_FOUND para métrica apagada", async () => {
      const metric = await MetricRepository.create({ userId: user.id, name: "Weight", unit: "kg" });
      await deleteMetricUseCase({ userId: user.id, id: metric.id });

      await expectNotFound({ kind: "metric", ref: String(metric.id), visible: true });
    });

    it("responde 404 NOT_FOUND para métrica de outro usuário, sem gravar nada", async () => {
      const other = await IntegrationTestHelper.createTestUser();
      const theirs = await MetricRepository.create({ userId: other.id, name: "Weight", unit: "kg" });

      await expectNotFound({ kind: "metric", ref: String(theirs.id), visible: true });
      expect(await ProfileItemRepository.findAll(user.id)).toHaveLength(0);
      expect(await ProfileItemRepository.findAll(other.id)).toHaveLength(0);
    });
  });
});
