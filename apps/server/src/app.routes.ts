import { Elysia } from "elysia";
import { ActivityController } from "@/activities/infra/activity.controller";
import { AuthController } from "@/auth/infra/auth.controller";
import { EntryController } from "@/metrics/infra/entry.controller";
import { MetricController } from "@/metrics/infra/metric.controller";
import { ProfileController } from "@/profile/infra/profile.controller";
import { ProgressController } from "@/progress/infra/progress.controller";

/** Registro de todos os controllers. Módulo novo entra aqui com `.use()`; o prefixo `/api` vem do app. */
export const appRoutes = new Elysia()
  .use(AuthController)
  .use(ActivityController)
  .use(ProgressController)
  .use(MetricController)
  .use(EntryController)
  .use(ProfileController);
