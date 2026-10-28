import type { Activity, CreateActivity } from "@mystatistics/shared";
import { toDurationMinutes, todayISO } from "../domain/activity-logic";
import { toActivity } from "../domain/activity.mapper";
import { ActivityRepository } from "../infra/activity.repository";

/** Cria a atividade: horas + minutos viram minutos totais (> 0) e `date` omitida vira hoje. */
export async function createActivityUseCase(input: CreateActivity): Promise<Activity> {
  const durationMinutes = toDurationMinutes(input.hours, input.minutes);

  const row = await ActivityRepository.create({
    category: input.category,
    durationMinutes,
    date: input.date ?? todayISO(),
  });

  return toActivity(row);
}
