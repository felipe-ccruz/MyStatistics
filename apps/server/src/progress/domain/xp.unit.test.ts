import { describe, expect, it } from "bun:test";
import { DAILY_GOAL_REWARD, FULL_CLEAR_BONUS } from "@mystatistics/shared";
import { toDayMinutes } from "@/activities/domain/day-minutes";
import { totalXpOf, xpOfDay } from "./xp";

describe("xpOfDay", () => {
  it("dia vazio vale 0", () => {
    expect(xpOfDay({ study: 0, exercise: 0 })).toBe(0);
  });

  it("aplica a taxa por categoria e arredonda para baixo por categoria", () => {
    // study 30 × 1 = 30 · exercise 11 × 1,2 = 13,2 → 13
    expect(xpOfDay({ study: 30, exercise: 11 })).toBe(43);
  });

  it("soma a recompensa da meta batida no limite exato", () => {
    expect(xpOfDay({ study: 89, exercise: 0 })).toBe(89);
    expect(xpOfDay({ study: 90, exercise: 0 })).toBe(90 + DAILY_GOAL_REWARD.study);
    expect(xpOfDay({ study: 0, exercise: 44 })).toBe(52); // 52,8 → 52, sem meta
    expect(xpOfDay({ study: 0, exercise: 45 })).toBe(54 + DAILY_GOAL_REWARD.exercise);
  });

  it("soma o bônus de full clear quando bate as duas metas", () => {
    // 90 + 50 (study) + 54 + 40 (exercise) + 100 (bônus)
    expect(xpOfDay({ study: 90, exercise: 45 })).toBe(90 + 50 + 54 + 40 + FULL_CLEAR_BONUS);
  });
});

describe("totalXpOf", () => {
  it("sem atividade nenhuma, 0", () => {
    expect(totalXpOf(toDayMinutes([]))).toBe(0);
  });

  it("soma os dias, cada um com as próprias metas", () => {
    const byDay = toDayMinutes([
      { date: "2026-11-09", category: "study", minutes: 60 },
      { date: "2026-11-10", category: "study", minutes: 30 },
      { date: "2026-11-10", category: "study", minutes: 60 },
    ]);

    // 60 (sem meta) + 90 + 50 (meta do dia 10)
    expect(totalXpOf(byDay)).toBe(200);
  });
});
