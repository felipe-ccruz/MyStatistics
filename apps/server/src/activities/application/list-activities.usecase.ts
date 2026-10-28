import type { Activity } from "@mystatistics/shared";
import { toActivity } from "../domain/activity.mapper";
import { ActivityRepository } from "../infra/activity.repository";

/** Lista todas as atividades, da mais recente (`date` desc) para a mais antiga; empate por `id` desc. */
export async function listActivitiesUseCase(): Promise<Activity[]> {
  const rows = await ActivityRepository.findAll();
  return rows.map(toActivity);
}
