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

export { ACTIVITY_CATEGORIES } from "./activity";
export type { Activity, ActivityCategory } from "./activity";
export { CreateActivity, UpdateActivity } from "./activity-schema";
export type { ApiError } from "./error";
