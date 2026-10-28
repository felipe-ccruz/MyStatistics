import { db } from "@/shared/infra/databases/postgres";
import { NotFoundError } from "@/shared/infra/errors/not-found-error";
import type { ActivityIdParams } from "../domain/activity.types";
import { ActivityRepository } from "../infra/activity.repository";

/** Remove a atividade; inexistente responde 404 `NOT_FOUND`. */
export async function deleteActivityUseCase({ id }: ActivityIdParams): Promise<void> {
  await db.transaction(async (tx) => {
    const current = await ActivityRepository.findById(id, tx);
    if (!current) throw new NotFoundError("Atividade não encontrada.");

    await ActivityRepository.delete(id, tx);
  });
}
