/**
 * Tabelas `metrics` e `entries` (Drizzle).
 *
 * O drizzle-kit encontra as tabelas em todo arquivo `*.schema.ts` dentro de `src` (ver drizzle.config.ts).
 * Ao adicionar/alterar uma tabela, rode `pnpm db:generate` e depois `pnpm db:migrate`.
 */

import { sql } from "drizzle-orm";
import { date, doublePrecision, index, integer, pgTable, serial, text, uniqueIndex } from "drizzle-orm/pg-core";
// Import relativo: o drizzle-kit lê os *.schema.ts sem o alias `@/` do tsconfig.
import { usersTable } from "../../auth/domain/auth.schema";

/** Uma métrica: o que o usuário mede (ex.: "Weight", em "kg"). */
export const metricsTable = pgTable(
  "metrics",
  {
    id: serial("id").primaryKey(),
    /** Dono da métrica. Apagar o usuário apaga as métricas dele. */
    userId: text("user_id")
      .notNull()
      .references(() => usersTable.id, { onDelete: "cascade" }),
    /** Gravado sem espaços nas pontas. */
    name: text("name").notNull(),
    /** Texto livre; pode ser vazio. */
    unit: text("unit").notNull(),
  },
  // Nome único por usuário sem diferenciar maiúsculas: "Weight" e "weight" são a mesma métrica.
  (table) => [uniqueIndex("metrics_user_id_lower_name_idx").on(table.userId, sql`lower(${table.name})`)],
);

/** Um registro de uma métrica: valor + dia. */
export const entriesTable = pgTable(
  "entries",
  {
    id: serial("id").primaryKey(),
    /** Apagar a métrica apaga os registros dela. */
    metricId: integer("metric_id")
      .notNull()
      .references(() => metricsTable.id, { onDelete: "cascade" }),
    /** Dono do registro (o mesmo da métrica): filtra por usuário sem precisar de join. */
    userId: text("user_id")
      .notNull()
      .references(() => usersTable.id, { onDelete: "cascade" }),
    value: doublePrecision("value").notNull(),
    date: date("date").notNull(),
  },
  // Toda leitura é "os registros desta métrica, por data".
  (table) => [index("entries_metric_id_date_idx").on(table.metricId, table.date)],
);

export type MetricRow = typeof metricsTable.$inferSelect;
export type NewMetricRow = typeof metricsTable.$inferInsert;
export type EntryRow = typeof entriesTable.$inferSelect;
export type NewEntryRow = typeof entriesTable.$inferInsert;
