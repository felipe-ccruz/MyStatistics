import { and, count, eq, gte, lte, sql } from "drizzle-orm";
import { activitiesTable } from "@/activities/domain/activity.schema";
import type { DailyCategoryMinutes } from "@/activities/domain/day-minutes";
import { db, type Transaction } from "@/shared/infra/databases/postgres";
import type { StudySessions } from "../domain/attributes";

/**
 * Leituras do progresso. O módulo não tem tabela própria: tudo sai das atividades do usuário,
 * agregado no SQL. Só query; as regras são as funções puras de `progress/domain`.
 */
export class ProgressRepository {
  /** Toda a história do usuário: soma dos minutos por dia e categoria. */
  static async minutesPerDayAndCategory(userId: string, tx?: Transaction): Promise<DailyCategoryMinutes[]> {
    return (tx ?? db)
      .select({
        date: activitiesTable.date,
        category: activitiesTable.category,
        minutes: sql<number>`cast(sum(${activitiesTable.durationMinutes}) as integer)`.mapWith(Number),
      })
      .from(activitiesTable)
      .where(eq(activitiesTable.userId, userId))
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
      .where(
        and(
          eq(activitiesTable.userId, userId),
          eq(activitiesTable.category, "study"),
          gte(activitiesTable.date, from),
          lte(activitiesTable.date, to),
        ),
      );
    return row ?? { count: 0, totalMinutes: 0 };
  }
}
