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
