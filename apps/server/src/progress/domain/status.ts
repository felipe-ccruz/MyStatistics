import { DAILY_GOAL_MINUTES, type Progress } from "@mystatistics/shared";
import { type DayMinutes, minutesOn } from "@/activities/domain/day-minutes";
import { daysEndingOn } from "@/shared/utils/calendar-day";
import { dailyQuestOf } from "./daily-quest";
import { toScore } from "./score";

/** Status de hoje (D5), em 0–100. Lógica pura; "hoje" é parâmetro. */

/** Janela da STA, em dias (terminando hoje). */
export const STAMINA_WINDOW_DAYS = 7;

/**
 * - MP = study de hoje ÷ 90 (`DAILY_GOAL_MINUTES.study`);
 * - STA = média diária de exercise nos últimos 7 dias (incluindo hoje) ÷ 45 (`DAILY_GOAL_MINUTES.exercise`);
 * - MOOD = % das metas da daily quest de hoje concluídas.
 */
export function statusOf(byDay: DayMinutes, today: string): Progress["status"] {
  const todayMinutes = minutesOn(byDay, today);

  let exerciseMinutes = 0;
  for (const date of daysEndingOn(today, STAMINA_WINDOW_DAYS)) exerciseMinutes += minutesOn(byDay, date).exercise;

  const { goals } = dailyQuestOf(todayMinutes);
  const completedGoals = goals.filter((goal) => goal.completed).length;

  return {
    mp: toScore(todayMinutes.study, DAILY_GOAL_MINUTES.study),
    sta: toScore(exerciseMinutes / STAMINA_WINDOW_DAYS, DAILY_GOAL_MINUTES.exercise),
    mood: toScore(completedGoals, goals.length),
  };
}
