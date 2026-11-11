import type { SessionUser } from "@/auth/domain/auth.types";
import { db } from "@/shared/infra/databases/postgres";
import { NotFoundError } from "@/shared/infra/errors/not-found-error";
import { ENTRY_NOT_FOUND_MESSAGE } from "../domain/entry-logic";
import { EntryRepository } from "../infra/entry.repository";

type DeleteEntryInput = SessionUser & { metricId: number; entryId: number };

/**
 * Remove um registro da métrica do usuário. Registro inexistente, de outra métrica ou de outro
 * usuário → 404 `NOT_FOUND`.
 */
export async function deleteEntryUseCase({ userId, metricId, entryId }: DeleteEntryInput): Promise<void> {
  await db.transaction(async (tx) => {
    const current = await EntryRepository.findById(userId, metricId, entryId, tx);
    if (!current) throw new NotFoundError(ENTRY_NOT_FOUND_MESSAGE);

    await EntryRepository.delete(userId, metricId, entryId, tx);
  });
}
