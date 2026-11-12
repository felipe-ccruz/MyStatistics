import { and, count, desc, eq, gte, lte, type SQL, sql } from "drizzle-orm";
import { db, type Transaction } from "@/shared/infra/databases/postgres";
import { HttpError } from "@/shared/infra/errors/http-error";
import type { DayRange } from "@/shared/utils/calendar-day";
import { type ActivityRow, activitiesTable, type NewActivityRow } from "../domain/activity.schema";
import type { DailyCategoryMinutes, StudySessions } from "../domain/day-minutes";
import type { DailySubjectMinutes } from "../domain/period-summary";

/** Campos que um update pode mudar (o `id` e o dono nunca mudam). */
export type ActivityChanges = Partial<Pick<NewActivityRow, "category" | "durationMinutes" | "date" | "subject">>;

/** Filtro "esta atividade, deste usuário": atividade de outro usuário se comporta como inexistente. */
function ownedBy(userId: string, id: number) {
  return and(eq(activitiesTable.userId, userId), eq(activitiesTable.id, id));
}

/** As condições de data do intervalo (nenhuma quando as duas pontas faltam). */
function inRange({ from, to }: DayRange): SQL[] {
  const conditions: SQL[] = [];
  if (from !== undefined) conditions.push(gte(activitiesTable.date, from));
  if (to !== undefined) conditions.push(lte(activitiesTable.date, to));
  return conditions;
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

  /**
   * Como `findById`, mas trava a linha (`for update`) até o fim da transação: outro update da
   * mesma atividade espera, e a regra aplicada sobre a leitura vale também na escrita. Use dentro
   * de `db.transaction`, passando o `tx`.
   */
  static async findByIdForUpdate(userId: string, id: number, tx: Transaction): Promise<ActivityRow | null> {
    const [row] = await tx.select().from(activitiesTable).where(ownedBy(userId, id)).limit(1).for("update");
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

  /**
   * Soma dos minutos por dia e categoria, agregada no SQL. Sem `from`/`to`, a história inteira
   * (progresso); com eles, só os dias entre os dois, inclusive (resumo por período).
   */
  static async minutesPerDayAndCategory(
    userId: string,
    range: DayRange = {},
    tx?: Transaction,
  ): Promise<DailyCategoryMinutes[]> {
    return (tx ?? db)
      .select({
        date: activitiesTable.date,
        category: activitiesTable.category,
        minutes: sql<number>`cast(sum(${activitiesTable.durationMinutes}) as integer)`.mapWith(Number),
      })
      .from(activitiesTable)
      .where(and(eq(activitiesTable.userId, userId), ...inRange(range)))
      .groupBy(activitiesTable.date, activitiesTable.category);
  }

  /**
   * Quantas atividades `study` o usuário tem entre `from` e `to` (inclusive) e quantos minutos
   * elas somam. É por atividade, não por dia: é o que a média do FOCUS precisa.
   */
  static async studySessionsBetween(
    userId: string,
    from: string,
    to: string,
    tx?: Transaction,
  ): Promise<StudySessions> {
    const [row] = await (tx ?? db)
      .select({
        count: count(),
        totalMinutes: sql<number>`cast(coalesce(sum(${activitiesTable.durationMinutes}), 0) as integer)`.mapWith(
          Number,
        ),
      })
      .from(activitiesTable)
      .where(and(eq(activitiesTable.userId, userId), eq(activitiesTable.category, "study"), ...inRange({ from, to })));
    return row ?? { count: 0, totalMinutes: 0 };
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
