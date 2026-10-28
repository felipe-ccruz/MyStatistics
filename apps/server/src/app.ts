import { Elysia } from "elysia";
import { openapi } from "@elysiajs/openapi";
import type { HealthResponse, HelloResponse } from "@mystatistics/shared";
import { appRoutes } from "@/app.routes";
import { pingDb } from "@/shared/infra/databases/postgres";
import { env } from "@/shared/infra/env/env";
import { errorHandler } from "@/shared/infra/errors/global-error-handler";

const app = new Elysia({ prefix: "/api" })
  .use(errorHandler)
  .use(
    openapi({
      path: "/docs",
      documentation: {
        info: {
          title: "MyStatistics API",
          version: "0.1.0",
          description: "API do MyStatistics — métricas, registros e estatísticas pessoais.",
        },
      },
    }),
  )
  .use(appRoutes)
  .get("/health", async ({ set }): Promise<HealthResponse> => {
    const dbUp = await pingDb();
    if (!dbUp) set.status = 503;
    return { status: dbUp ? "ok" : "degraded", db: dbUp ? "ok" : "down" };
  })
  .get("/hello", (): HelloResponse => ({ message: "Hello, world!", method: "GET" }))
  .put("/hello", (): HelloResponse => ({ message: "Hello, world!", method: "PUT" }))
  .get("/hello/:name", ({ params }): HelloResponse => ({ message: `Hello, ${params.name}!`, method: "GET" }))
  .listen(env.PORT);

console.log(`🚀 API rodando em http://localhost:${app.server?.port}`);
console.log(`📚 Docs em http://localhost:${app.server?.port}/api/docs`);

export type App = typeof app;
