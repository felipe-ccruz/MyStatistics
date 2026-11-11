import {
  ACTIVITY_CATEGORIES,
  type ActivityCategory,
  DAILY_GOAL_MINUTES,
  DAILY_GOAL_REWARD,
  FULL_CLEAR_BONUS,
  type Progress,
} from "@mystatistics/shared";
import type { CategoryMinutes } from "@/activities/domain/day-minutes";

/** Daily quest (D5): uma meta de minutos por categoria; bater todas no mesmo dia dá o bônus. Lógica pura. */

/** A meta do dia da categoria foi batida: minutos ≥ `DAILY_GOAL_MINUTES` (o limite exato já conta). */
export function isGoalMet(category: ActivityCategory, minutes: number): boolean {
  return minutes >= DAILY_GOAL_MINUTES[category];
}

/** A daily quest de um dia, a partir dos minutos dele. Metas na ordem de `ACTIVITY_CATEGORIES`. */
export function dailyQuestOf(minutes: CategoryMinutes): Progress["dailyQuest"] {
  const goals = ACTIVITY_CATEGORIES.map((category) => ({
    category,
    targetMinutes: DAILY_GOAL_MINUTES[category],
    doneMinutes: minutes[category],
    reward: DAILY_GOAL_REWARD[category],
    completed: isGoalMet(category, minutes[category]),
  }));

  return { goals, bonus: FULL_CLEAR_BONUS, allCompleted: goals.every((goal) => goal.completed) };
}
