import { afterEach, beforeAll, describe, expect, it } from "bun:test";
import { IntegrationTestHelper } from "@/shared/utils/test-helpers/integration-test-helper";
import { todayISO } from "../domain/activity-logic";
import { activitiesTable } from "../domain/activity.schema";
import { ActivityRepository } from "../infra/activity.repository";
import { createActivityUseCase } from "./create-activity.usecase";

describe("createActivityUseCase - Integration", () => {
  beforeAll(() => IntegrationTestHelper.setupTestDatabase());
  afterEach(() => IntegrationTestHelper.truncate(activitiesTable));

  describe("Sucesso", () => {
    it("grava a duração em minutos e devolve a atividade criada", async () => {
      const activity = await createActivityUseCase({ category: "study", hours: 1, minutes: 30, date: "2026-10-20" });

      expect(activity).toEqual({ id: expect.any(Number), category: "study", durationMinutes: 90, date: "2026-10-20" });
      expect(await ActivityRepository.findById(activity.id)).not.toBeNull();
    });

    it("usa o dia de hoje quando date não vem", async () => {
      const activity = await createActivityUseCase({ category: "exercise", hours: 0, minutes: 45 });

      expect(activity.date).toBe(todayISO());
    });
  });

  describe("Erros", () => {
    it("rejeita duração zero com INVALID_DURATION e não grava nada", async () => {
      await expect(createActivityUseCase({ category: "study", hours: 0, minutes: 0 })).rejects.toMatchObject({
        status: 422,
        apiCode: "INVALID_DURATION",
      });

      expect(await ActivityRepository.findAll()).toHaveLength(0);
    });
  });
});
