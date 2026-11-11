import { describe, expect, it } from "bun:test";
import { DAILY_GOAL_MINUTES, DAILY_GOAL_REWARD, FULL_CLEAR_BONUS } from "@mystatistics/shared";
import { dailyQuestOf, isGoalMet } from "./daily-quest";

describe("isGoalMet", () => {
  it("conta o limite exato como meta batida (90 min de study, 45 de exercise)", () => {
    expect(isGoalMet("study", DAILY_GOAL_MINUTES.study)).toBe(true);
    expect(isGoalMet("study", DAILY_GOAL_MINUTES.study - 1)).toBe(false);
    expect(isGoalMet("exercise", DAILY_GOAL_MINUTES.exercise)).toBe(true);
    expect(isGoalMet("exercise", DAILY_GOAL_MINUTES.exercise - 1)).toBe(false);
  });
});

describe("dailyQuestOf", () => {
  it("monta uma meta por categoria, na ordem study → exercise", () => {
    const quest = dailyQuestOf({ study: 30, exercise: 50 });

    expect(quest).toEqual({
      goals: [
        {
          category: "study",
          targetMinutes: DAILY_GOAL_MINUTES.study,
          doneMinutes: 30,
          reward: DAILY_GOAL_REWARD.study,
          completed: false,
        },
        {
          category: "exercise",
          targetMinutes: DAILY_GOAL_MINUTES.exercise,
          doneMinutes: 50,
          reward: DAILY_GOAL_REWARD.exercise,
          completed: true,
        },
      ],
      bonus: FULL_CLEAR_BONUS,
      allCompleted: false,
    });
  });

  it("dia vazio: nenhuma meta concluída", () => {
    const quest = dailyQuestOf({ study: 0, exercise: 0 });

    expect(quest.goals.map((goal) => goal.completed)).toEqual([false, false]);
    expect(quest.allCompleted).toBe(false);
  });

  it("todas as metas nos limites exatos: allCompleted", () => {
    expect(dailyQuestOf({ study: 90, exercise: 45 }).allCompleted).toBe(true);
  });
});
