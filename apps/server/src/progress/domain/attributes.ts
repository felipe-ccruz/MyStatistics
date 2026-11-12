import { ACTIVITY_CATEGORIES, DAILY_GOAL_MINUTES, type Progress } from "@mystatistics/shared";
import { FOCUS_SESSION_MINUTES } from "@mystatistics/shared/progress";
import { type DayMinutes, minutesOn, type StudySessions } from "@/activities/domain/day-minutes";
import { addDaysISO, daysEndingOn } from "@/shared/utils/calendar-day";
import { toScore } from "./score";

/** Atributos (D5): médias dos últimos 30 dias, incluindo hoje, em 0–100. Lógica pura. */

/** Tamanho da janela dos atributos, em dias (terminando hoje). */
export const ATTRIBUTE_WINDOW_DAYS = 30;

/** Primeiro e último dia da janela dos atributos. */
export function attributeWindowOf(today: string): { from: string; to: string } {
  return { from: addDaysISO(today, -(ATTRIBUTE_WINDOW_DAYS - 1)), to: today };
}

/**
 * - INT = minutos de study por dia ÷ 90 (`DAILY_GOAL_MINUTES.study`);
 * - STR = minutos de exercise por dia ÷ 45 (`DAILY_GOAL_MINUTES.exercise`);
 * - FOCUS = duração média de UMA atividade study ÷ 75 (por atividade, não por dia);
 * - DISCIPLINE = % dos 30 dias com todas as categorias.
 *
 * "Por dia" divide pelos 30 dias da janela, com ou sem atividade. `studySessions` precisa ser da
 * mesma janela (`attributeWindowOf`). Os `details` saem sem arredondar: o front formata.
 */
export function attributesOf(byDay: DayMinutes, studySessions: StudySessions, today: string): Progress["attributes"] {
  let studyMinutes = 0;
  let exerciseMinutes = 0;
  let daysWithBothCategories = 0;

  for (const date of daysEndingOn(today, ATTRIBUTE_WINDOW_DAYS)) {
    const minutes = minutesOn(byDay, date);
    studyMinutes += minutes.study;
    exerciseMinutes += minutes.exercise;
    if (ACTIVITY_CATEGORIES.every((category) => minutes[category] > 0)) daysWithBothCategories += 1;
  }

  const studyMinutesPerDay = studyMinutes / ATTRIBUTE_WINDOW_DAYS;
  const exerciseMinutesPerDay = exerciseMinutes / ATTRIBUTE_WINDOW_DAYS;
  const averageStudySessionMinutes = studySessions.count > 0 ? studySessions.totalMinutes / studySessions.count : 0;

  return {
    int: toScore(studyMinutesPerDay, DAILY_GOAL_MINUTES.study),
    str: toScore(exerciseMinutesPerDay, DAILY_GOAL_MINUTES.exercise),
    focus: toScore(averageStudySessionMinutes, FOCUS_SESSION_MINUTES),
    discipline: toScore(daysWithBothCategories, ATTRIBUTE_WINDOW_DAYS),
    details: { studyMinutesPerDay, exerciseMinutesPerDay, averageStudySessionMinutes, daysWithBothCategories },
  };
}
