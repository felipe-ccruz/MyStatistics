/**
 * Tabela `profiles` (Drizzle): a parte da conta que é nossa, não do Better Auth.
 * Um perfil por usuário, criado no cadastro. Apagar o usuário apaga o perfil (cascade).
 */

import { PROFILE_VISIBILITIES } from "@mystatistics/shared/auth";
import { pgEnum, pgTable, text, varchar } from "drizzle-orm/pg-core";
import { usersTable } from "./auth.schema";

/** Enum de visibilidade no Postgres — mesma lista do contrato em `shared`. */
export const profileVisibility = pgEnum("profile_visibility", PROFILE_VISIBILITIES);

export const profilesTable = pgTable("profiles", {
  userId: text("user_id")
    .primaryKey()
    .references(() => usersTable.id, { onDelete: "cascade" }),
  /** Identificador público do perfil (`/u/<slug>`). Formato em `SLUG_PATTERN` (shared). */
  slug: varchar("slug", { length: 30 }).notNull().unique(),
  visibility: profileVisibility("visibility").default("private").notNull(),
});

export type ProfileRow = typeof profilesTable.$inferSelect;
export type NewProfileRow = typeof profilesTable.$inferInsert;
