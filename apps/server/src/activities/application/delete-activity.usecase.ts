import type { SessionUser } from "@/auth/domain/auth.types";
import { db } from "@/shared/infra/databases/postgres";
import { NotFoundError } from "@/shared/infra/errors/not-found-error";
import type { ActivityIdParams } from "../domain/activity.types";
import { ActivityRepository } from "../infra/activity.repository";

type DeleteActivityInput = SessionUser & ActivityIdParams;

/** Remove a atividade do usuário; inexistente ou de outro usuário responde 404 `NOT_FOUND`. */
export async function deleteActivityUseCase({ userId, id }: DeleteActivityInput): Promise<void> {
  await db.transaction(async (tx) => {
    const current = await ActivityRepository.findById(userId, id, tx);
    if (!current) throw new NotFoundError("Activity not found.");

    await ActivityRepository.delete(userId, id, tx);
  });
}
