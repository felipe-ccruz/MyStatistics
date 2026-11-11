import { eq } from "drizzle-orm";
import { db, type Transaction } from "@/shared/infra/databases/postgres";
import { usersTable } from "../domain/auth.schema";
import { type ProfileRow, profilesTable } from "../domain/profile.schema";

/** Usuário (do Better Auth) junto com o perfil (nosso). */
export type UserWithProfile = {
  user: { id: string; email: string };
  profile: ProfileRow;
};

/**
 * Leituras na tabela `users`, que é escrita pelo Better Auth. A única escrita nossa é o
 * `delete`, usado para desfazer um cadastro cujo perfil não pôde ser criado.
 */
export class UserRepository {
  static async findWithProfile(userId: string, tx?: Transaction): Promise<UserWithProfile | null> {
    const [row] = await (tx ?? db)
      .select({ user: { id: usersTable.id, email: usersTable.email }, profile: profilesTable })
      .from(usersTable)
      .innerJoin(profilesTable, eq(profilesTable.userId, usersTable.id))
      .where(eq(usersTable.id, userId))
      .limit(1);
    return row ?? null;
  }

  /** `true` se já há conta com este e-mail (o Better Auth grava o e-mail em minúsculas). */
  static async existsByEmail(email: string, tx?: Transaction): Promise<boolean> {
    const [row] = await (tx ?? db)
      .select({ id: usersTable.id })
      .from(usersTable)
      .where(eq(usersTable.email, email.toLowerCase()))
      .limit(1);
    return row !== undefined;
  }

  /** Apaga o usuário; sessões, contas e perfil vão junto (on delete cascade). */
  static async delete(userId: string, tx?: Transaction): Promise<void> {
    await (tx ?? db).delete(usersTable).where(eq(usersTable.id, userId));
  }
}
