import { type Activity, CreateActivity, UpdateActivity } from "@mystatistics/shared";
import { authGuard } from "@/shared/infra/auth.guard";
import { createController } from "@/shared/infra/base.controller";
import { createActivityUseCase } from "../application/create-activity.usecase";
import { deleteActivityUseCase } from "../application/delete-activity.usecase";
import { getActivityUseCase } from "../application/get-activity.usecase";
import { listActivitiesUseCase } from "../application/list-activities.usecase";
import { updateActivityUseCase } from "../application/update-activity.usecase";
import { ActivityIdParams } from "../domain/activity.types";

/**
 * Rotas HTTP de atividades. O controller só traduz HTTP ↔ use case: valida a entrada com os
 * schemas, chama o use case e define o status. Nada de regra de negócio nem query aqui.
 *
 * Todas exigem sessão (`authGuard`: 401 sem cookie) e só enxergam as atividades do usuário
 * logado — o `userId` vem da sessão, nunca do request.
 */
export const ActivityController = createController({ prefix: "/activities", tags: ["Activities"] })
  .use(authGuard)

  // POST /api/activities
  .post(
    "/",
    async ({ body, userId, set }): Promise<Activity> => {
      const activity = await createActivityUseCase({ ...body, userId });
      set.status = 201;
      return activity;
    },
    {
      body: CreateActivity,
      detail: {
        summary: "Create an activity",
        description: "Duration comes as hours + minutes; date defaults to today.",
      },
    },
  )

  // GET /api/activities
  .get("/", ({ userId }): Promise<Activity[]> => listActivitiesUseCase({ userId }), {
    detail: {
      summary: "List activities",
      description: "The logged-in user's activities, most recent first (date desc, then id desc).",
    },
  })

  // GET /api/activities/:id
  .get("/:id", ({ params, userId }): Promise<Activity> => getActivityUseCase({ ...params, userId }), {
    params: ActivityIdParams,
    detail: { summary: "Get an activity", description: "Another user's activity answers 404." },
  })

  // PATCH /api/activities/:id
  .patch(
    "/:id",
    ({ params, body, userId }): Promise<Activity> => updateActivityUseCase({ ...body, id: params.id, userId }),
    {
      params: ActivityIdParams,
      body: UpdateActivity,
      detail: { summary: "Update an activity", description: "Partial update; hours and minutes must come together." },
    },
  )

  // DELETE /api/activities/:id
  .delete(
    "/:id",
    async ({ params, userId, set }) => {
      await deleteActivityUseCase({ ...params, userId });
      set.status = 204;
    },
    {
      params: ActivityIdParams,
      detail: { summary: "Delete an activity" },
    },
  );
