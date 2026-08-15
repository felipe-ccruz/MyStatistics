import { Elysia, t } from "elysia";
import { desc, eq } from "drizzle-orm";
import { CreateActivity, type Activity } from "@mystatistics/shared";
import { db } from "@/db";
import { activities as activitiesTable } from "@/db/schema";
import { HttpError } from "@/errors";
import { toDurationMinutes, todayISO } from "./activity-logic";

type ActivityRow = typeof activitiesTable.$inferSelect;

/** Converte a linha do banco no DTO do contrato. */
function toActivity(row: ActivityRow): Activity {
  return {
    id: row.id,
    category: row.category,
    durationMinutes: row.durationMinutes,
    date: row.date,
  };
}

/** Busca a atividade por id ou lança 404 no shape único. */
async function findOr404(id: number): Promise<ActivityRow> {
  const [row] = await db.select().from(activitiesTable).where(eq(activitiesTable.id, id)).limit(1);
  if (!row) throw new HttpError(404, "Atividade não encontrada.", "NOT_FOUND");
  return row;
}

const idParams = t.Object({ id: t.Numeric() });

export const activities = new Elysia({ prefix: "/activities" })
  .post(
    "/",
    async ({ body, set }): Promise<Activity> => {
      const durationMinutes = toDurationMinutes(body.hours, body.minutes);
      const [row] = await db
        .insert(activitiesTable)
        .values({ category: body.category, durationMinutes, date: body.date ?? todayISO() })
        .returning();
      if (!row) throw new HttpError(500, "Falha ao gravar a atividade.", "INTERNAL");
      set.status = 201;
      return toActivity(row);
    },
    { body: CreateActivity },
  )
  .get("/", async (): Promise<Activity[]> => {
    const rows = await db
      .select()
      .from(activitiesTable)
      .orderBy(desc(activitiesTable.date), desc(activitiesTable.id));
    return rows.map(toActivity);
  })
  .get("/:id", async ({ params }): Promise<Activity> => toActivity(await findOr404(params.id)), {
    params: idParams,
  })
  .put(
    "/:id",
    async ({ params, body }): Promise<Activity> => {
      await findOr404(params.id);
      const durationMinutes = toDurationMinutes(body.hours, body.minutes);
      const [row] = await db
        .update(activitiesTable)
        .set({ category: body.category, durationMinutes, date: body.date ?? todayISO() })
        .where(eq(activitiesTable.id, params.id))
        .returning();
      if (!row) throw new HttpError(500, "Falha ao atualizar a atividade.", "INTERNAL");
      return toActivity(row);
    },
    { body: CreateActivity, params: idParams },
  )
  .delete(
    "/:id",
    async ({ params, set }): Promise<void> => {
      await findOr404(params.id);
      await db.delete(activitiesTable).where(eq(activitiesTable.id, params.id));
      set.status = 204;
    },
    { params: idParams },
  );
