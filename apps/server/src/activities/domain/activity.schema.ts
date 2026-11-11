/**
 * Tabela `activities` (Drizzle).
 *
 * O drizzle-kit encontra as tabelas em todo arquivo `*.schema.ts` dentro de `src` (ver drizzle.config.ts).
 * Ao adicionar/alterar uma tabela, rode `pnpm db:generate` e depois `pnpm db:migrate`.
 */

import { ACTIVITY_CATEGORIES } from "@mystatistics/shared/activity";
import { date, index, integer, pgEnum, pgTable, serial, text } from "drizzle-orm/pg-core";
// Import relativo: o drizzle-kit lê os *.schema.ts sem o alias `@/` do tsconfig.
import { usersTable } from "../../auth/domain/auth.schema";

/** Enum de categoria no Postgres — mesma lista do contrato em `shared`. */
export const activityCategory = pgEnum("activity_category", ACTIVITY_CATEGORIES);

/** Uma atividade: tempo (em minutos) gasto numa categoria, num dia, por um usuário. */
export const activitiesTable = pgTable(
  "activities",
  {
    id: serial("id").primaryKey(),
    /** Dono da atividade. Apagar o usuário apaga as atividades dele. */
    userId: text("user_id")
      .notNull()
      .references(() => usersTable.id, { onDelete: "cascade" }),
    category: activityCategory("category").notNull(),
    durationMinutes: integer("duration_minutes").notNull(),
    date: date("date").notNull(),
  },
  // Toda leitura é "as atividades do usuário, por data".
  (table) => [index("activities_user_id_date_idx").on(table.userId, table.date)],
);

export type ActivityRow = typeof activitiesTable.$inferSelect;
export type NewActivityRow = typeof activitiesTable.$inferInsert;
