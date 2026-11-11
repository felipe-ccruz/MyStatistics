import type { Activity } from "@mystatistics/shared";
import type { SessionUser } from "@/auth/domain/auth.types";
import { toActivity } from "../domain/activity.mapper";
import { ActivityRepository } from "../infra/activity.repository";

/** Lista as atividades do usuário, da mais recente (`date` desc) para a mais antiga; empate por `id` desc. */
export async function listActivitiesUseCase({ userId }: SessionUser): Promise<Activity[]> {
  const rows = await ActivityRepository.findAll(userId);
  return rows.map(toActivity);
}
