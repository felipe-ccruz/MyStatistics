import { afterEach, beforeAll, beforeEach, describe, expect, it } from "bun:test";
import { ActivityRepository } from "@/activities/infra/activity.repository";
import { deleteMetricUseCase } from "@/metrics/application/delete-metric.usecase";
import { EntryRepository } from "@/metrics/infra/entry.repository";
import { MetricRepository } from "@/metrics/infra/metric.repository";
import { getProgressUseCase } from "@/progress/application/get-progress.usecase";
import { IntegrationTestHelper, type TestUser } from "@/shared/utils/test-helpers/integration-test-helper";
import { getPublicProfileUseCase } from "./get-public-profile.usecase";
import { updateProfileUseCase } from "./update-profile.usecase";
import { updateProfileItemUseCase } from "./update-profile-item.usecase";

const TODAY = "2026-11-11";

describe("getPublicProfileUseCase - Integration", () => {
  let user: TestUser;

  beforeAll(() => IntegrationTestHelper.setupTestDatabase());
  beforeEach(async () => {
    user = await IntegrationTestHelper.createTestUser();
  });
  afterEach(() => IntegrationTestHelper.truncateAll());

  function show(kind: "progress" | "activity_category" | "metric", ref: string, visible = true) {
    return updateProfileItemUseCase({ userId: user.id, kind, ref, visible });
  }

  function publicProfile(slug = user.slug) {
    return getPublicProfileUseCase({ slug, today: TODAY });
  }

  async function notFoundOf(slug: string) {
    return IntegrationTestHelper.rejectionOf(publicProfile(slug));
  }

  describe("Perfil inexistente ou privado", () => {
    it("perfil privado responde o mesmo 404 PROFILE_NOT_FOUND, com a mesma mensagem, que um slug inexistente", async () => {
      await show("progress", "");

      const privateError = await notFoundOf(user.slug);
      const missingError = await notFoundOf("no-such-slug");

      expect(privateError).toMatchObject({ status: 404, apiCode: "PROFILE_NOT_FOUND" });
      expect(missingError).toMatchObject({ status: 404, apiCode: "PROFILE_NOT_FOUND" });
      expect((privateError as Error).message).toBe((missingError as Error).message);
    });

    it("voltar o perfil a privado faz o portfólio responder 404 de novo", async () => {
      await updateProfileUseCase({ userId: user.id, visibility: "public" });
      expect(await publicProfile()).toEqual({ slug: user.slug });

      await updateProfileUseCase({ userId: user.id, visibility: "private" });

      expect(await notFoundOf(user.slug)).toMatchObject({ status: 404, apiCode: "PROFILE_NOT_FOUND" });
    });
  });

  describe("Perfil público", () => {
    beforeEach(async () => {
      await updateProfileUseCase({ userId: user.id, visibility: "public" });
    });

    it("sem item visível: só o slug, sem as chaves dos itens", async () => {
      expect(await publicProfile()).toEqual({ slug: user.slug });
    });

    it("mostra o progress igual ao do dono quando visível", async () => {
      await ActivityRepository.create({ userId: user.id, category: "study", durationMinutes: 120, date: TODAY });
      await show("progress", "");

      const profile = await publicProfile();

      expect(profile.progress).toEqual(await getProgressUseCase({ userId: user.id, today: TODAY }));
    });

    it("mostra só as categorias visíveis, cada uma com os resumos só dela", async () => {
      await ActivityRepository.create({ userId: user.id, category: "study", durationMinutes: 60, date: TODAY });
      await ActivityRepository.create({ userId: user.id, category: "exercise", durationMinutes: 45, date: TODAY });
      await show("activity_category", "exercise");

      const profile = await publicProfile();

      expect(profile.activities).toHaveLength(1);
      expect(profile.activities?.[0]).toMatchObject({
        category: "exercise",
        summary7d: { period: "7d", totalMinutes: 45, perCategory: { study: 0, exercise: 45 }, studyBySubject: [] },
        summary30d: { period: "30d", totalMinutes: 45 },
      });
      expect(profile.progress).toBeUndefined();
    });

    it("mostra só as métricas visíveis, com nome, unidade e o resumo de 30 dias", async () => {
      const weight = await MetricRepository.create({ userId: user.id, name: "Weight", unit: "kg" });
      await MetricRepository.create({ userId: user.id, name: "Mood", unit: "" });
      await EntryRepository.create({ metricId: weight.id, userId: user.id, value: 80, date: "2026-11-01" });
      await EntryRepository.create({ metricId: weight.id, userId: user.id, value: 79, date: TODAY });
      await show("metric", String(weight.id));

      const profile = await publicProfile();

      expect(profile.metrics).toEqual([
        {
          name: "Weight",
          unit: "kg",
          summary30d: { period: "30d", count: 2, mean: 79.5, min: 79, max: 80, trend: null, enoughData: true },
        },
      ]);
    });

    it("item ocultado de novo some do JSON", async () => {
      await show("progress", "");
      await show("progress", "", false);

      expect(await publicProfile()).toEqual({ slug: user.slug });
    });

    it("métrica nova nasce oculta mesmo com o perfil público", async () => {
      await show("progress", "");
      await MetricRepository.create({ userId: user.id, name: "Sleep", unit: "h" });

      const profile = await publicProfile();

      expect(profile.metrics).toBeUndefined();
      expect(profile.progress).toBeDefined();
    });

    it("métrica apagada some do portfólio", async () => {
      const metric = await MetricRepository.create({ userId: user.id, name: "Weight", unit: "kg" });
      await show("metric", String(metric.id));
      expect((await publicProfile()).metrics).toHaveLength(1);

      await deleteMetricUseCase({ userId: user.id, id: metric.id });

      expect((await publicProfile()).metrics).toBeUndefined();
    });

    it("não mistura os dados de outro usuário", async () => {
      const other = await IntegrationTestHelper.createTestUser();
      await ActivityRepository.create({ userId: other.id, category: "exercise", durationMinutes: 300, date: TODAY });
      await show("activity_category", "exercise");

      const profile = await publicProfile();

      expect(profile.activities?.[0]?.summary7d.totalMinutes).toBe(0);
    });
  });
});
