import { afterEach, beforeAll, beforeEach, describe, expect, it } from "bun:test";
import type { ActivityCategory } from "@mystatistics/shared";
import { todayISO } from "@/shared/utils/calendar-day";
import { IntegrationTestHelper, type TestUser } from "@/shared/utils/test-helpers/integration-test-helper";
import { ActivityRepository } from "../infra/activity.repository";
import { getActivitySummaryUseCase } from "./get-activity-summary.usecase";

const TODAY = "2026-11-11";

describe("getActivitySummaryUseCase - Integration", () => {
  let user: TestUser;

  beforeAll(() => IntegrationTestHelper.setupTestDatabase());
  beforeEach(async () => {
    user = await IntegrationTestHelper.createTestUser();
  });
  afterEach(() => IntegrationTestHelper.truncateAll());

  function log(userId: string, category: ActivityCategory, durationMinutes: number, date: string) {
    return ActivityRepository.create({ userId, category, durationMinutes, date });
  }

  describe("Sucesso", () => {
    it("usuário sem atividade: período vazio com todos os dias zerados", async () => {
      const summary = await getActivitySummaryUseCase({ userId: user.id, period: "7d", today: TODAY });

      expect(summary).toMatchObject({ period: "7d", from: "2026-11-05", to: TODAY, totalMinutes: 0, bestDay: null });
      expect(summary.perDay).toHaveLength(7);
    });

    it("soma as atividades do dia por categoria e compara com o período anterior", async () => {
      const id = user.id;
      await log(id, "study", 30, TODAY);
      await log(id, "study", 30, TODAY);
      await log(id, "exercise", 45, "2026-11-10");
      await log(id, "study", 70, "2026-11-01"); // período anterior do 7d
      await log(id, "study", 500, "2026-10-28"); // antes do período anterior
      await log(id, "study", 500, "2026-11-12"); // depois de hoje

      const summary = await getActivitySummaryUseCase({ userId: id, period: "7d", today: TODAY });

      expect(summary).toMatchObject({
        totalMinutes: 105,
        averagePerDay: 15,
        activeDays: 2,
        perCategory: { study: 60, exercise: 45 },
        bestDay: { date: TODAY, totalMinutes: 60 },
        trend: { previousTotalMinutes: 70, changePercent: 50 },
      });
      expect(summary.perDay.at(-1)).toEqual({ date: TODAY, minutes: { study: 60, exercise: 0 } });
    });

    it("30d cobre 30 dias e o período anterior de 30", async () => {
      await log(user.id, "study", 30, "2026-10-13");
      await log(user.id, "study", 60, "2026-10-12");

      const summary = await getActivitySummaryUseCase({ userId: user.id, period: "30d", today: TODAY });

      expect(summary.perDay).toHaveLength(30);
      expect(summary.totalMinutes).toBe(30);
      expect(summary.trend).toEqual({ previousTotalMinutes: 60, changePercent: -50 });
    });

    it("divide o study do período por matéria, sem matéria em Other", async () => {
      await ActivityRepository.create({
        userId: user.id,
        category: "study",
        durationMinutes: 30,
        date: TODAY,
        subject: "Calculus",
      });
      await ActivityRepository.create({
        userId: user.id,
        category: "study",
        durationMinutes: 45,
        date: "2026-11-10",
        subject: "Calculus",
      });
      await log(user.id, "study", 20, "2026-11-09");
      await log(user.id, "exercise", 90, TODAY);
      await ActivityRepository.create({
        userId: user.id,
        category: "study",
        durationMinutes: 300,
        date: "2026-11-01", // período anterior: não conta
        subject: "Physics",
      });

      const summary = await getActivitySummaryUseCase({ userId: user.id, period: "7d", today: TODAY });

      expect(summary.studyBySubject).toEqual([
        { subject: "Calculus", minutes: 75 },
        { subject: "Other", minutes: 20 },
      ]);
    });

    it("usa o dia de calendário do server quando today não vem", async () => {
      const summary = await getActivitySummaryUseCase({ userId: user.id, period: "7d" });

      expect(summary.to).toBe(todayISO());
    });
  });

  describe("Isolamento", () => {
    it("ignora as atividades de outro usuário", async () => {
      const other = await IntegrationTestHelper.createTestUser();
      await log(other.id, "study", 120, TODAY);

      const summary = await getActivitySummaryUseCase({ userId: user.id, period: "7d", today: TODAY });

      expect(summary.totalMinutes).toBe(0);
    });
  });
});
