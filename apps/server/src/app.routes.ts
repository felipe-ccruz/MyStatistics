import { Elysia } from "elysia";
import { ActivityController } from "@/activities/infra/activity.controller";
import { AuthController } from "@/auth/infra/auth.controller";

/** Registro de todos os controllers. Módulo novo entra aqui com `.use()`; o prefixo `/api` vem do app. */
export const appRoutes = new Elysia().use(AuthController).use(ActivityController);
