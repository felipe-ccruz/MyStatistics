import { and, desc, eq, gte, lte, sql } from "drizzle-orm";
import { db, type Transaction } from "@/shared/infra/databases/postgres";
import { HttpError } from "@/shared/infra/errors/http-error";
import { type ActivityRow, activitiesTable, type NewActivityRow } from "../domain/activity.schema";
import type { DailyCategoryMinutes } from "../domain/day-minutes";
import type { DailySubjectMinutes } from "../domain/period-summary";

/** Campos que um update pode mudar (o `id` e o dono nunca mudam). */
export type ActivityChanges = Partial<Pick<NewActivityRow, "category" | "durationMinutes" | "date" | "subject">>;

/** Filtro "esta atividade, deste usuário": atividade de outro usuário se comporta como inexistente. */
function ownedBy(userId: string, id: number) {
  return and(eq(activitiesTable.userId, userId), eq(activitiesTable.id, id));
}

/**
 * Acesso à tabela `activities`. Só query: regra de negócio fica nos use cases.
 * Toda leitura e escrita recebe o `userId` e filtra por ele — não há método que enxergue
 * atividades de todos os usuários.
 */
export class ActivityRepository {
  static async create(data: NewActivityRow, tx?: Transaction): Promise<ActivityRow> {
    const [row] = await (tx ?? db).insert(activitiesTable).values(data).returning();
    if (!row) throw new HttpError(500, "Failed to save the activity.", "INTERNAL");
    return row;
  }

  static async findAll(userId: string, tx?: Transaction): Promise<ActivityRow[]> {
    return (tx ?? db)
      .select()
      .from(activitiesTable)
      .where(eq(activitiesTable.userId, userId))
      .orderBy(desc(activitiesTable.date), desc(activitiesTable.id));
  }

  static async findById(userId: string, id: number, tx?: Transaction): Promise<ActivityRow | null> {
    const [row] = await (tx ?? db).select().from(activitiesTable).where(ownedBy(userId, id)).limit(1);
    return row ?? null;
  }

  static async update(userId: string, id: number, changes: ActivityChanges, tx?: Transaction): Promise<ActivityRow> {
    const [row] = await (tx ?? db).update(activitiesTable).set(changes).where(ownedBy(userId, id)).returning();
    if (!row) throw new HttpError(500, "Failed to update the activity.", "INTERNAL");
    return row;
  }

  static async delete(userId: string, id: number, tx?: Transaction): Promise<void> {
    await (tx ?? db).delete(activitiesTable).where(ownedBy(userId, id));
  }

  /** Soma dos minutos por dia e categoria entre `from` e `to` (inclusive), agregada no SQL. */
  static async minutesPerDayAndCategoryBetween(
    userId: string,
    from: string,
    to: string,
    tx?: Transaction,
  ): Promise<DailyCategoryMinutes[]> {
    return (tx ?? db)
      .select({
        date: activitiesTable.date,
        category: activitiesTable.category,
        minutes: sql<number>`cast(sum(${activitiesTable.durationMinutes}) as integer)`.mapWith(Number),
      })
      .from(activitiesTable)
      .where(and(eq(activitiesTable.userId, userId), gte(activitiesTable.date, from), lte(activitiesTable.date, to)))
      .groupBy(activitiesTable.date, activitiesTable.category);
  }

  /** Soma dos minutos de `study` por dia e matéria (`null` = sem matéria) entre `from` e `to` (inclusive). */
  static async studyMinutesPerDayAndSubjectBetween(
    userId: string,
    from: string,
    to: string,
    tx?: Transaction,
  ): Promise<DailySubjectMinutes[]> {
    return (tx ?? db)
      .select({
        date: activitiesTable.date,
        subject: activitiesTable.subject,
        minutes: sql<number>`cast(sum(${activitiesTable.durationMinutes}) as integer)`.mapWith(Number),
      })
      .from(activitiesTable)
      .where(
        and(
          eq(activitiesTable.userId, userId),
          eq(activitiesTable.category, "study"),
          gte(activitiesTable.date, from),
          lte(activitiesTable.date, to),
        ),
      )
      .groupBy(activitiesTable.date, activitiesTable.subject);
  }
}
