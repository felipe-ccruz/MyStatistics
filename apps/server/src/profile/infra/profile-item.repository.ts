import type { ProfileItemKind } from "@mystatistics/shared";
import { and, eq } from "drizzle-orm";
import { db, type Transaction } from "@/shared/infra/databases/postgres";
import { HttpError } from "@/shared/infra/errors/http-error";
import { type NewProfileItemRow, type ProfileItemRow, profileItemsTable } from "../domain/profile-item.schema";

/**
 * Acesso à tabela `profile_items`. Só query: regra de negócio fica nos use cases.
 * Toda leitura e escrita recebe o `userId` e filtra por ele.
 */
export class ProfileItemRepository {
  static async findAll(userId: string, tx?: Transaction): Promise<ProfileItemRow[]> {
    return (tx ?? db).select().from(profileItemsTable).where(eq(profileItemsTable.userId, userId));
  }

  /** Grava a escolha do item: cria a linha ou troca o `visible` da que já existe. */
  static async upsert(data: NewProfileItemRow, tx?: Transaction): Promise<ProfileItemRow> {
    const [row] = await (tx ?? db)
      .insert(profileItemsTable)
      .values(data)
      .onConflictDoUpdate({
        target: [profileItemsTable.userId, profileItemsTable.kind, profileItemsTable.ref],
        set: { visible: data.visible },
      })
      .returning();
    if (!row) throw new HttpError(500, "Failed to save the profile item.", "INTERNAL");
    return row;
  }

  /** Apaga a escolha do item (ele volta a ser oculto). */
  static async delete(userId: string, kind: ProfileItemKind, ref: string, tx?: Transaction): Promise<void> {
    await (tx ?? db)
      .delete(profileItemsTable)
      .where(
        and(eq(profileItemsTable.userId, userId), eq(profileItemsTable.kind, kind), eq(profileItemsTable.ref, ref)),
      );
  }
}
