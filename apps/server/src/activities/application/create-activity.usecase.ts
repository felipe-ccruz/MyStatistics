import type { Activity, CreateActivity } from "@mystatistics/shared";
import type { SessionUser } from "@/auth/domain/auth.types";
import { toActivity } from "../domain/activity.mapper";
import { toDurationMinutes, todayISO } from "../domain/activity-logic";
import { ActivityRepository } from "../infra/activity.repository";

type CreateActivityInput = SessionUser & CreateActivity;

/** Cria a atividade do usuário: horas + minutos viram minutos totais (> 0) e `date` omitida vira hoje. */
export async function createActivityUseCase({ userId, ...input }: CreateActivityInput): Promise<Activity> {
  const durationMinutes = toDurationMinutes(input.hours, input.minutes);

  const row = await ActivityRepository.create({
    userId,
    category: input.category,
    durationMinutes,
    date: input.date ?? todayISO(),
  });

  return toActivity(row);
}
