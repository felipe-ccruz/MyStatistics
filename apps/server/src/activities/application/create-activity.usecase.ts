import type { Activity, CreateActivity } from "@mystatistics/shared";
import type { SessionUser } from "@/auth/domain/auth.types";
import { todayISO } from "@/shared/utils/calendar-day";
import { resolveLoggedDay } from "@/shared/utils/logged-day";
import { toActivity } from "../domain/activity.mapper";
import { assertSubjectAllowed, normalizeSubject, toDurationMinutes } from "../domain/activity-logic";
import { ActivityRepository } from "../infra/activity.repository";

type CreateActivityInput = SessionUser & CreateActivity;

/**
 * Cria a atividade do usuário: horas + minutos viram minutos totais (> 0) e `date` omitida vira hoje.
 * Dia que não existe → 422 `VALIDATION`; depois de hoje → 422 `FUTURE_DATE`.
 * `subject` (sem espaços nas pontas) só em `study`; com outra categoria → 422 `SUBJECT_NOT_ALLOWED`.
 */
export async function createActivityUseCase({ userId, ...input }: CreateActivityInput): Promise<Activity> {
  const durationMinutes = toDurationMinutes(input.hours, input.minutes);
  const subject = input.subject === undefined ? null : normalizeSubject(input.subject);
  assertSubjectAllowed(input.category, subject);

  const row = await ActivityRepository.create({
    userId,
    category: input.category,
    durationMinutes,
    date: resolveLoggedDay(input.date, todayISO()),
    subject,
  });

  return toActivity(row);
}
