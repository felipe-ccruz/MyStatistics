/**
 * Schema do banco (Drizzle).
 *
 * Ao adicionar/alterar uma tabela aqui, rode `pnpm db:generate` e depois `pnpm db:migrate`.
 */

import { date, integer, pgEnum, pgTable, serial } from "drizzle-orm/pg-core";
import { ACTIVITY_CATEGORIES } from "@mystatistics/shared/activity";

/** Enum de categoria no Postgres — mesma lista do contrato em `shared`. */
export const activityCategory = pgEnum("activity_category", ACTIVITY_CATEGORIES);

/** Uma atividade: tempo (em minutos) gasto numa categoria, num dia. */
export const activities = pgTable("activities", {
  id: serial("id").primaryKey(),
  category: activityCategory("category").notNull(),
  durationMinutes: integer("duration_minutes").notNull(),
  date: date("date").notNull(),
});
