/**
 * Contratos de API compartilhados entre apps/web e apps/server.
 * Toda rota nova deve ter seu tipo de request/response declarado aqui.
 */

export type HealthResponse = {
  status: "ok" | "degraded";
  db: "ok" | "down";
};

export type HelloResponse = {
  message: string;
  method: string;
};

export type { Activity, ActivityCategory } from "./activity";
export { ACTIVITY_CATEGORIES } from "./activity";
export { CreateActivity, UpdateActivity } from "./activity-schema";
export type { Me, ProfileVisibility } from "./auth";
export { PROFILE_VISIBILITIES, SLUG_PATTERN } from "./auth";
export { SignIn, SignUp } from "./auth-schema";
export type { ApiError } from "./error";
