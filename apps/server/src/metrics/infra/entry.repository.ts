import { and, desc, eq, gte, lte } from "drizzle-orm";
import { db, type Transaction } from "@/shared/infra/databases/postgres";
import { HttpError } from "@/shared/infra/errors/http-error";
import type { DayRange } from "@/shared/utils/calendar-day";
import { type EntryRow, entriesTable, type NewEntryRow } from "../domain/metric.schema";
import type { DatedValue } from "../domain/metric-summary";

/** Filtro "este registro, desta métrica, deste usuário": qualquer outro se comporta como inexistente. */
function ownedBy(userId: string, metricId: number, id: number) {
  return and(eq(entriesTable.userId, userId), eq(entriesTable.metricId, metricId), eq(entriesTable.id, id));
}

/**
 * Acesso à tabela `entries`. Só query: regra de negócio fica nos use cases.
 * Toda leitura e escrita recebe o `userId` e filtra por ele.
 */
export class EntryRepository {
  static async create(data: NewEntryRow, tx?: Transaction): Promise<EntryRow> {
    const [row] = await (tx ?? db).insert(entriesTable).values(data).returning();
    if (!row) throw new HttpError(500, "Failed to save the entry.", "INTERNAL");
    return row;
  }

  /** Os registros da métrica, do mais recente (`date` desc) para o mais antigo; empate por `id` desc. */
  static async findAll(userId: string, metricId: number, tx?: Transaction): Promise<EntryRow[]> {
    return (tx ?? db)
      .select()
      .from(entriesTable)
      .where(and(eq(entriesTable.userId, userId), eq(entriesTable.metricId, metricId)))
      .orderBy(desc(entriesTable.date), desc(entriesTable.id));
  }

  /** Dia e valor dos registros da métrica no intervalo (inclusive; ponta omitida = sem limite). */
  static async valuesBetween(
    userId: string,
    metricId: number,
    { from, to }: DayRange,
    tx?: Transaction,
  ): Promise<DatedValue[]> {
    return (tx ?? db)
      .select({ date: entriesTable.date, value: entriesTable.value })
      .from(entriesTable)
      .where(
        and(
          eq(entriesTable.userId, userId),
          eq(entriesTable.metricId, metricId),
          from === undefined ? undefined : gte(entriesTable.date, from),
          to === undefined ? undefined : lte(entriesTable.date, to),
        ),
      );
  }

  static async findById(userId: string, metricId: number, id: number, tx?: Transaction): Promise<EntryRow | null> {
    const [row] = await (tx ?? db)
      .select()
      .from(entriesTable)
      .where(ownedBy(userId, metricId, id))
      .limit(1);
    return row ?? null;
  }

  static async delete(userId: string, metricId: number, id: number, tx?: Transaction): Promise<void> {
    await (tx ?? db).delete(entriesTable).where(ownedBy(userId, metricId, id));
  }
}
