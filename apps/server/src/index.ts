import { Elysia } from "elysia";
import type { HealthResponse, HelloResponse } from "@mystatistics/shared";
import { env } from "@/env";
import { pingDb } from "@/db";

const app = new Elysia({ prefix: "/api" })
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

export type App = typeof app;
