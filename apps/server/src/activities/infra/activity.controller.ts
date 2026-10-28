import { CreateActivity, UpdateActivity } from "@mystatistics/shared";
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
 */
export const ActivityController = createController({ prefix: "/activities", tags: ["Activities"] })
  // POST /api/activities
  .post(
    "/",
    async ({ body, set }) => {
      const activity = await createActivityUseCase(body);
      set.status = 201;
      return activity;
    },
    {
      body: CreateActivity,
      detail: { summary: "Create an activity", description: "Duration comes as hours + minutes; date defaults to today." },
    },
  )

  // GET /api/activities
  .get("/", () => listActivitiesUseCase(), {
    detail: { summary: "List activities", description: "Most recent first (date desc, then id desc)." },
  })

  // GET /api/activities/:id
  .get("/:id", ({ params }) => getActivityUseCase(params), {
    params: ActivityIdParams,
    detail: { summary: "Get an activity" },
  })

  // PATCH /api/activities/:id
  .patch("/:id", ({ params, body }) => updateActivityUseCase({ ...body, id: params.id }), {
    params: ActivityIdParams,
    body: UpdateActivity,
    detail: { summary: "Update an activity", description: "Partial update; hours and minutes must come together." },
  })

  // DELETE /api/activities/:id
  .delete(
    "/:id",
    async ({ params, set }) => {
      await deleteActivityUseCase(params);
      set.status = 204;
    },
    {
      params: ActivityIdParams,
      detail: { summary: "Delete an activity" },
    },
  );
