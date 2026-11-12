/**
 * Tabela `profile_items` (Drizzle): o que o dono escolheu mostrar ou ocultar no portfólio público.
 *
 * **Sem linha = oculto.** Expor é sempre uma escolha explícita: item novo (ex.: métrica criada
 * depois de o perfil virar público) nasce oculto sem código extra. Apagar o usuário apaga as linhas.
 *
 * O drizzle-kit encontra as tabelas em todo arquivo `*.schema.ts` dentro de `src` (ver drizzle.config.ts).
 * Ao adicionar/alterar uma tabela, rode `pnpm db:generate` e depois `pnpm db:migrate`.
 */

// O índice do shared: o contrato não tem um ponto de entrada puro só para `profile` (ver relatório).
import { PROFILE_ITEM_KINDS } from "@mystatistics/shared";
import { boolean, pgEnum, pgTable, primaryKey, text, varchar } from "drizzle-orm/pg-core";
// Import relativo: o drizzle-kit lê os *.schema.ts sem o alias `@/` do tsconfig.
import { usersTable } from "../../auth/domain/auth.schema";

/** Enum do tipo de item no Postgres — mesma lista do contrato em `shared`. */
export const profileItemKind = pgEnum("profile_item_kind", PROFILE_ITEM_KINDS);

export const profileItemsTable = pgTable(
  "profile_items",
  {
    userId: text("user_id")
      .notNull()
      .references(() => usersTable.id, { onDelete: "cascade" }),
    kind: profileItemKind("kind").notNull(),
    /** `""` em `progress`, a categoria em `activity_category`, o id da métrica (em texto) em `metric`. */
    ref: varchar("ref", { length: 40 }).notNull(),
    visible: boolean("visible").notNull(),
  },
  (table) => [primaryKey({ columns: [table.userId, table.kind, table.ref] })],
);

export type ProfileItemRow = typeof profileItemsTable.$inferSelect;
export type NewProfileItemRow = typeof profileItemsTable.$inferInsert;
