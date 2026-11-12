import { afterEach, beforeAll, beforeEach, describe, expect, it } from "bun:test";
import { addDaysISO, todayISO } from "@/shared/utils/calendar-day";
import { IntegrationTestHelper, type TestUser } from "@/shared/utils/test-helpers/integration-test-helper";
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

      expect(activity).toEqual({
        id: expect.any(Number),
        category: "study",
        durationMinutes: 90,
        date: "2026-10-20",
        subject: null,
      });
      expect(await ActivityRepository.findById(user.id, activity.id)).toMatchObject({ userId: user.id });
    });

    it("grava a matéria de uma atividade study sem espaços nas pontas", async () => {
      const activity = await createActivityUseCase({
        userId: user.id,
        category: "study",
        hours: 0,
        minutes: 50,
        subject: "  Calculus ",
      });

      expect(activity.subject).toBe("Calculus");
      expect(await ActivityRepository.findById(user.id, activity.id)).toMatchObject({ subject: "Calculus" });
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

    it("rejeita dia inexistente com VALIDATION e não grava nada", async () => {
      const error = await IntegrationTestHelper.rejectionOf(
        createActivityUseCase({ userId: user.id, category: "study", hours: 1, minutes: 0, date: "2026-02-31" }),
      );

      expect(error).toMatchObject({ status: 422, apiCode: "VALIDATION" });
      expect(await ActivityRepository.findAll(user.id)).toHaveLength(0);
    });

    it("rejeita data depois de hoje com FUTURE_DATE e não grava nada", async () => {
      const tomorrow = addDaysISO(todayISO(), 1);

      const error = await IntegrationTestHelper.rejectionOf(
        createActivityUseCase({ userId: user.id, category: "study", hours: 1, minutes: 0, date: tomorrow }),
      );

      expect(error).toMatchObject({ status: 422, apiCode: "FUTURE_DATE" });
      expect(await ActivityRepository.findAll(user.id)).toHaveLength(0);
    });

    it("rejeita matéria em exercise com SUBJECT_NOT_ALLOWED e não grava nada", async () => {
      const error = await IntegrationTestHelper.rejectionOf(
        createActivityUseCase({ userId: user.id, category: "exercise", hours: 1, minutes: 0, subject: "Running" }),
      );

      expect(error).toMatchObject({ status: 422, apiCode: "SUBJECT_NOT_ALLOWED" });
      expect(await ActivityRepository.findAll(user.id)).toHaveLength(0);
    });

    it("rejeita matéria só de espaços com VALIDATION e não grava nada", async () => {
      const error = await IntegrationTestHelper.rejectionOf(
        createActivityUseCase({ userId: user.id, category: "study", hours: 1, minutes: 0, subject: "   " }),
      );

      expect(error).toMatchObject({ status: 422, apiCode: "VALIDATION" });
      expect(await ActivityRepository.findAll(user.id)).toHaveLength(0);
    });
  });
});
