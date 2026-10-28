import type { Activity } from "@mystatistics/shared";
import { NotFoundError } from "@/shared/infra/errors/not-found-error";
import { toActivity } from "../domain/activity.mapper";
import type { ActivityIdParams } from "../domain/activity.types";
import { ActivityRepository } from "../infra/activity.repository";

/** Busca uma atividade pelo id; inexistente responde 404 `NOT_FOUND`. */
export async function getActivityUseCase({ id }: ActivityIdParams): Promise<Activity> {
  const row = await ActivityRepository.findById(id);
  if (!row) throw new NotFoundError("Atividade não encontrada.");
  return toActivity(row);
}
