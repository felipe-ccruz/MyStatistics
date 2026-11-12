import { afterEach, beforeAll, describe, expect, it } from "bun:test";
import { Elysia } from "elysia";
import { IntegrationTestHelper } from "@/shared/utils/test-helpers/integration-test-helper";
import { EntryController } from "./entry.controller";
import { MetricController } from "./metric.controller";

const app = new Elysia().use(MetricController).use(EntryController);

function request(method: string, path: string, cookie: string, body?: unknown) {
  return app.handle(
    new Request(`http://localhost/metrics${path}`, {
      method,
      headers: { cookie, "content-type": "application/json" },
      body: body === undefined ? undefined : JSON.stringify(body),
    }),
  );
}

describe("MetricController/EntryController - Integration", () => {
  beforeAll(() => IntegrationTestHelper.setupTestDatabase());
  afterEach(() => IntegrationTestHelper.truncateAll());

  describe("ids fora dos inteiros aceitos", () => {
    it("respondem 422 VALIDATION (não 500) em todas as rotas com id", async () => {
      const user = await IntegrationTestHelper.createTestUser();

      for (const id of ["1.5", "0", "-1", "2147483648", "99999999999"]) {
        const calls = [
          request("DELETE", `/${id}`, user.cookie),
          request("GET", `/${id}/entries`, user.cookie),
          request("POST", `/${id}/entries`, user.cookie, { value: 1 }),
          request("GET", `/${id}/summary?period=7d`, user.cookie),
          request("DELETE", `/${id}/entries/1`, user.cookie),
          request("DELETE", `/1/entries/${id}`, user.cookie),
        ];

        for (const response of await Promise.all(calls)) {
          expect({ id, status: response.status }).toEqual({ id, status: 422 });
          expect(await response.json()).toMatchObject({ error: { code: "VALIDATION" } });
        }
      }
    });
  });

  describe("GET /metrics/:id/summary", () => {
    it("responde o resumo da métrica do usuário", async () => {
      const user = await IntegrationTestHelper.createTestUser();
      const created = await request("POST", "/", user.cookie, { name: "Weight", unit: "kg" });
      const { id } = (await created.json()) as { id: number };

      const response = await request("GET", `/${id}/summary?period=all`, user.cookie);

      expect(response.status).toBe(200);
      expect(await response.json()).toMatchObject({ period: "all", count: 0, enoughData: false });
    });

    it("recusa período fora da lista, ou sem período, com 422 VALIDATION", async () => {
      const user = await IntegrationTestHelper.createTestUser();

      for (const query of ["?period=90d", ""]) {
        const response = await request("GET", `/1/summary${query}`, user.cookie);

        expect(response.status).toBe(422);
        expect(await response.json()).toMatchObject({ error: { code: "VALIDATION" } });
      }
    });

    it("responde 401 sem sessão", async () => {
      expect((await request("GET", "/1/summary?period=7d", "")).status).toBe(401);
    });
  });
});
