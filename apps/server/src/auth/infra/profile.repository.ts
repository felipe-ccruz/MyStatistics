import { eq } from "drizzle-orm";
import { db, type Transaction } from "@/shared/infra/databases/postgres";
import { HttpError } from "@/shared/infra/errors/http-error";
import { type NewProfileRow, type ProfileRow, profilesTable } from "../domain/profile.schema";

/** Acesso à tabela `profiles`. Só query: regra de negócio fica nos use cases. */
export class ProfileRepository {
  /** Falha com o erro do driver (23505) se o slug já existir: quem chama decide o que fazer. */
  static async create(data: NewProfileRow, tx?: Transaction): Promise<ProfileRow> {
    const [row] = await (tx ?? db).insert(profilesTable).values(data).returning();
    if (!row) throw new HttpError(500, "Failed to save the profile.", "INTERNAL");
    return row;
  }

  static async findByUserId(userId: string, tx?: Transaction): Promise<ProfileRow | null> {
    const [row] = await (tx ?? db).select().from(profilesTable).where(eq(profilesTable.userId, userId)).limit(1);
    return row ?? null;
  }

  static async findBySlug(slug: string, tx?: Transaction): Promise<ProfileRow | null> {
    const [row] = await (tx ?? db).select().from(profilesTable).where(eq(profilesTable.slug, slug)).limit(1);
    return row ?? null;
  }
}
