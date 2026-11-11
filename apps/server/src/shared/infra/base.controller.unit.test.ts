import { describe, expect, it } from "bun:test";
import { t } from "elysia";
import { createController } from "./base.controller";

/** Controller mínimo, montado sozinho com `.handle()` (sem servidor, sem banco). */
const controller = createController()
  .post("/echo", ({ body }) => body, { body: t.Object({ name: t.String() }) })
  .post("/no-body", () => ({ ok: true }))
  .delete("/thing", ({ set }) => {
    set.status = 204;
  })
  .get("/thing", () => ({ ok: true }));

function request(method: string, path: string, init: { contentType?: string; body?: string | FormData } = {}) {
  const headers = new Headers();
  if (init.contentType) headers.set("content-type", init.contentType);
  return controller.handle(new Request(`http://localhost${path}`, { method, headers, body: init.body }));
}

describe("createController: só corpo JSON", () => {
  it("aceita JSON, inclusive com charset", async () => {
    for (const contentType of ["application/json", "application/json; charset=utf-8"]) {
      const response = await request("POST", "/echo", { contentType, body: '{"name":"ana"}' });

      expect(response.status).toBe(200);
      expect(await response.json()).toEqual({ name: "ana" });
    }
  });

  it("recusa urlencoded, text/plain e multipart com 400 PARSE", async () => {
    const multipart = new FormData();
    multipart.set("name", "ana");
    const cases = [
      request("POST", "/echo", { contentType: "application/x-www-form-urlencoded", body: "name=ana" }),
      request("POST", "/echo", { contentType: "text/plain", body: '{"name":"ana"}' }),
      // Sem content-type explícito: o Request põe `multipart/form-data; boundary=...` sozinho.
      request("POST", "/echo", { body: multipart }),
    ];

    for (const response of await Promise.all(cases)) {
      expect(response.status).toBe(400);
      expect(await response.json()).toMatchObject({ error: { code: "PARSE" } });
    }
  });

  it("recusa form também em rota que não lê o corpo", async () => {
    const response = await request("POST", "/no-body", {
      contentType: "application/x-www-form-urlencoded",
      body: "a=1",
    });

    expect(response.status).toBe(400);
  });

  it("deixa passar requisição sem corpo (POST, DELETE, GET)", async () => {
    expect((await request("POST", "/no-body")).status).toBe(200);
    expect((await request("DELETE", "/thing")).status).toBe(204);
    expect((await request("GET", "/thing")).status).toBe(200);
  });
});
