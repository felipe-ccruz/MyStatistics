import { ACTIVITY_CATEGORIES, DAILY_GOAL_REWARD, FULL_CLEAR_BONUS, XP_RATE } from "@mystatistics/shared";
import type { CategoryMinutes, DayMinutes } from "@/activities/domain/day-minutes";
import { isGoalMet } from "./daily-quest";

/** XP (D5). Lógica pura. */

/**
 * XP de um dia: para cada categoria, `floor(minutos × XP_RATE)` + `DAILY_GOAL_REWARD` se a meta
 * do dia foi batida; e `FULL_CLEAR_BONUS` se TODAS as metas foram batidas.
 */
export function xpOfDay(minutes: CategoryMinutes): number {
  let xp = 0;
  let allGoalsMet = true;

  for (const category of ACTIVITY_CATEGORIES) {
    xp += Math.floor(minutes[category] * XP_RATE[category]);
    if (isGoalMet(category, minutes[category])) xp += DAILY_GOAL_REWARD[category];
    else allGoalsMet = false;
  }

  return allGoalsMet ? xp + FULL_CLEAR_BONUS : xp;
}

/** XP de toda a história: a soma do XP de cada dia. */
export function totalXpOf(byDay: DayMinutes): number {
  let total = 0;
  for (const minutes of byDay.values()) total += xpOfDay(minutes);
  return total;
}
