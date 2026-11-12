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
});
