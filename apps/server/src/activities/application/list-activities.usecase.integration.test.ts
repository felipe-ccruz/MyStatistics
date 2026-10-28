import { afterEach, beforeAll, describe, expect, it } from "bun:test";
import { IntegrationTestHelper } from "@/shared/utils/test-helpers/integration-test-helper";
import { activitiesTable } from "../domain/activity.schema";
import { ActivityRepository } from "../infra/activity.repository";
import { listActivitiesUseCase } from "./list-activities.usecase";

describe("listActivitiesUseCase - Integration", () => {
  beforeAll(() => IntegrationTestHelper.setupTestDatabase());
  afterEach(() => IntegrationTestHelper.truncate(activitiesTable));

  describe("Sucesso", () => {
    it("devolve lista vazia quando não há atividades", async () => {
      expect(await listActivitiesUseCase()).toEqual([]);
    });

    it("ordena por date desc e desempata por id desc", async () => {
      const older = await ActivityRepository.create({ category: "study", durationMinutes: 30, date: "2026-10-01" });
      const first = await ActivityRepository.create({ category: "exercise", durationMinutes: 60, date: "2026-10-02" });
      const second = await ActivityRepository.create({ category: "study", durationMinutes: 90, date: "2026-10-02" });

      const ids = (await listActivitiesUseCase()).map((activity) => activity.id);

      expect(ids).toEqual([second.id, first.id, older.id]);
    });
  });
});
