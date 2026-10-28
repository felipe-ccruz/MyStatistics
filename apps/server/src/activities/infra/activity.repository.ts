import { desc, eq } from "drizzle-orm";
import { db, type Transaction } from "@/shared/infra/databases/postgres";
import { HttpError } from "@/shared/infra/errors/http-error";
import { activitiesTable, type ActivityRow, type NewActivityRow } from "../domain/activity.schema";

/** Campos que um update pode mudar (o `id` nunca muda). */
export type ActivityChanges = Partial<Pick<NewActivityRow, "category" | "durationMinutes" | "date">>;

/** Acesso à tabela `activities`. Só query: regra de negócio fica nos use cases. */
export class ActivityRepository {
  static async create(data: NewActivityRow, tx?: Transaction): Promise<ActivityRow> {
    const [row] = await (tx ?? db).insert(activitiesTable).values(data).returning();
    if (!row) throw new HttpError(500, "Falha ao gravar a atividade.", "INTERNAL");
    return row;
  }

  static async findAll(tx?: Transaction): Promise<ActivityRow[]> {
    return (tx ?? db)
      .select()
      .from(activitiesTable)
      .orderBy(desc(activitiesTable.date), desc(activitiesTable.id));
  }

  static async findById(id: number, tx?: Transaction): Promise<ActivityRow | null> {
    const [row] = await (tx ?? db).select().from(activitiesTable).where(eq(activitiesTable.id, id)).limit(1);
    return row ?? null;
  }

  static async update(id: number, changes: ActivityChanges, tx?: Transaction): Promise<ActivityRow> {
    const [row] = await (tx ?? db)
      .update(activitiesTable)
      .set(changes)
      .where(eq(activitiesTable.id, id))
      .returning();
    if (!row) throw new HttpError(500, "Falha ao atualizar a atividade.", "INTERNAL");
    return row;
  }

  static async delete(id: number, tx?: Transaction): Promise<void> {
    await (tx ?? db).delete(activitiesTable).where(eq(activitiesTable.id, id));
  }
}
