import { afterEach, beforeAll, beforeEach, describe, expect, it } from "bun:test";
import { IntegrationTestHelper, type TestUser } from "@/shared/utils/test-helpers/integration-test-helper";
import { todayISO } from "../domain/activity-logic";
import { ActivityRepository } from "../infra/activity.repository";
import { createActivityUseCase } from "./create-activity.usecase";

describe("createActivityUseCase - Integration", () => {
  let user: TestUser;

  beforeAll(() => IntegrationTestHelper.setupTestDatabase());
  beforeEach(async () => {
    user = await IntegrationTestHelper.createTestUser();
  });
  afterEach(() => IntegrationTestHelper.truncateAll());

  describe("Sucesso", () => {
    it("grava a duração em minutos para o usuário e devolve a atividade criada", async () => {
      const activity = await createActivityUseCase({
        userId: user.id,
        category: "study",
        hours: 1,
        minutes: 30,
        date: "2026-10-20",
      });

      expect(activity).toEqual({ id: expect.any(Number), category: "study", durationMinutes: 90, date: "2026-10-20" });
      expect(await ActivityRepository.findById(user.id, activity.id)).toMatchObject({ userId: user.id });
    });

    it("usa o dia de hoje quando date não vem", async () => {
      const activity = await createActivityUseCase({ userId: user.id, category: "exercise", hours: 0, minutes: 45 });

      expect(activity.date).toBe(todayISO());
    });
  });

  describe("Erros", () => {
    it("rejeita duração zero com INVALID_DURATION e não grava nada", async () => {
      const error = await IntegrationTestHelper.rejectionOf(
        createActivityUseCase({ userId: user.id, category: "study", hours: 0, minutes: 0 }),
      );

      expect(error).toMatchObject({ status: 422, apiCode: "INVALID_DURATION" });
      expect(await ActivityRepository.findAll(user.id)).toHaveLength(0);
    });
  });
});
