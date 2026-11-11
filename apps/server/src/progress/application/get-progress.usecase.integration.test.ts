import { afterEach, beforeAll, beforeEach, describe, expect, it } from "bun:test";
import type { ActivityCategory } from "@mystatistics/shared";
import { ActivityRepository } from "@/activities/infra/activity.repository";
import { todayISO } from "@/shared/utils/calendar-day";
import { IntegrationTestHelper, type TestUser } from "@/shared/utils/test-helpers/integration-test-helper";
import { getProgressUseCase } from "./get-progress.usecase";

const TODAY = "2026-11-11";

describe("getProgressUseCase - Integration", () => {
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
    it("usuário sem atividade: nível 1, tudo zerado, Adventurer", async () => {
      const progress = await getProgressUseCase({ userId: user.id, today: TODAY });

      expect(progress).toMatchObject({
        today: TODAY,
        level: 1,
        xpCurrent: 0,
        xpNeeded: 300,
        xpTotal: 0,
        rank: "E",
        className: "Adventurer",
        streak: { current: 0, best: 0 },
        status: { mp: 0, sta: 0, mood: 0 },
        attributes: { int: 0, str: 0, focus: 0, discipline: 0 },
        dailyQuest: { bonus: 100, allCompleted: false },
      });
      expect(progress.streak.week).toHaveLength(7);
    });

    it("calcula tudo a partir das atividades agregadas por dia", async () => {
      const id = user.id;
      await log(id, "study", 60, TODAY);
      await log(id, "study", 30, TODAY);
      await log(id, "exercise", 45, TODAY);
      await log(id, "study", 30, "2026-11-10");
      await log(id, "exercise", 20, "2026-11-09");
      await log(id, "study", 120, "2026-10-01"); // fora da janela de 30 dias

      const progress = await getProgressUseCase({ userId: id, today: TODAY });

      // XP: hoje 90+50 + 54+40 + 100 = 334 · dia 10: 30 · dia 9: floor(24) = 24 · 01/10: 120+50 = 170
      expect(progress.xpTotal).toBe(558);
      // 558 − 300 (1→2) = 258 < 400
      expect(progress).toMatchObject({ level: 2, xpCurrent: 258, xpNeeded: 400, rank: "E" });
      expect(progress.streak.current).toBe(3);
      expect(progress.streak.best).toBe(3);
      expect(progress.streak.week.map((day) => day.active)).toEqual([false, false, false, false, true, true, true]);
      // MP 90/90 · STA (45+20)/7 = 9,29 ÷ 45 = 21 · MOOD 2 de 2 metas
      expect(progress.status).toEqual({ mp: 100, sta: 21, mood: 100 });
      // INT 120/30 = 4 ÷ 90 = 4 · STR 65/30 = 2,17 ÷ 45 = 5 · FOCUS 3 atividades study, 120 min = 40 ÷ 75 = 53
      expect(progress.attributes).toEqual({
        int: 4,
        str: 5,
        focus: 53,
        discipline: 3,
        details: {
          studyMinutesPerDay: 4,
          exerciseMinutesPerDay: 65 / 30,
          averageStudySessionMinutes: 40,
          daysWithBothCategories: 1,
        },
      });
      expect(progress.className).toBe("Iron Warrior");
      expect(progress.dailyQuest).toEqual({
        goals: [
          { category: "study", targetMinutes: 90, doneMinutes: 90, reward: 50, completed: true },
          { category: "exercise", targetMinutes: 45, doneMinutes: 45, reward: 40, completed: true },
        ],
        bonus: 100,
        allCompleted: true,
      });
    });

    it("usa o dia de calendário do server quando today não vem", async () => {
      const progress = await getProgressUseCase({ userId: user.id });

      expect(progress.today).toBe(todayISO());
    });
  });

  describe("Isolamento", () => {
    it("ignora as atividades de outro usuário", async () => {
      const other = await IntegrationTestHelper.createTestUser();
      await log(other.id, "study", 600, TODAY);
      await log(user.id, "exercise", 10, TODAY);

      const progress = await getProgressUseCase({ userId: user.id, today: TODAY });

      expect(progress.xpTotal).toBe(12);
      expect(progress.status.mp).toBe(0);
      expect(progress.attributes.focus).toBe(0);
    });
  });
});
