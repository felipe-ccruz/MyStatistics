import type { Activity } from "@mystatistics/shared";
import type { SessionUser } from "@/auth/domain/auth.types";
import { NotFoundError } from "@/shared/infra/errors/not-found-error";
import { toActivity } from "../domain/activity.mapper";
import type { ActivityIdParams } from "../domain/activity.types";
import { ActivityRepository } from "../infra/activity.repository";

type GetActivityInput = SessionUser & ActivityIdParams;

/** Busca uma atividade do usuário pelo id; inexistente ou de outro usuário responde 404 `NOT_FOUND`. */
export async function getActivityUseCase({ userId, id }: GetActivityInput): Promise<Activity> {
  const row = await ActivityRepository.findById(userId, id);
  if (!row) throw new NotFoundError("Activity not found.");
  return toActivity(row);
}
