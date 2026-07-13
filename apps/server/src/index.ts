import { serve } from "bun";
import type { HelloResponse } from "@mystatistics/shared";

const port = Number(process.env.PORT ?? 3333);

const server = serve({
  port,
  routes: {
    "/api/health": () => Response.json({ status: "ok" }),

    "/api/hello": {
      GET: () => Response.json({ message: "Hello, world!", method: "GET" } satisfies HelloResponse),
      PUT: () => Response.json({ message: "Hello, world!", method: "PUT" } satisfies HelloResponse),
    },

    "/api/hello/:name": req =>
      Response.json({ message: `Hello, ${req.params.name}!`, method: "GET" } satisfies HelloResponse),
  },

  development: process.env.NODE_ENV !== "production",
});

console.log(`🚀 API rodando em ${server.url}`);
