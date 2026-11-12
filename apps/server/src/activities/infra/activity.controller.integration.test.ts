import { afterEach, beforeAll, describe, expect, it } from "bun:test";
import { IntegrationTestHelper } from "@/shared/utils/test-helpers/integration-test-helper";
import { ActivityController } from "./activity.controller";

function get(path: string, cookie?: string) {
  const headers = cookie ? { cookie } : undefined;
  return ActivityController.handle(new Request(`http://localhost/activities${path}`, { headers }));
}

describe("ActivityController - Integration", () => {
  beforeAll(() => IntegrationTestHelper.setupTestDatabase());
  afterEach(() => IntegrationTestHelper.truncateAll());

  describe("GET /activities/summary", () => {
    it("responde o resumo, e não cai no /:id", async () => {
      const user = await IntegrationTestHelper.createTestUser();

      const response = await get("/summary?period=7d", user.cookie);

      expect(response.status).toBe(200);
      expect(await response.json()).toMatchObject({ period: "7d", totalMinutes: 0 });
    });

    it("recusa período fora da lista, ou sem período, com 422 VALIDATION", async () => {
      const user = await IntegrationTestHelper.createTestUser();

      for (const query of ["?period=90d", ""]) {
        const response = await get(`/summary${query}`, user.cookie);

        expect(response.status).toBe(422);
        expect(await response.json()).toMatchObject({ error: { code: "VALIDATION" } });
      }
    });

    it("responde 401 sem sessão", async () => {
      expect((await get("/summary?period=7d")).status).toBe(401);
    });
  });

  describe("/:id fora dos inteiros aceitos", () => {
    it("responde 422 VALIDATION (não 500) para fração, zero, negativo e fora do integer", async () => {
      const user = await IntegrationTestHelper.createTestUser();

      for (const id of ["1.5", "0", "-1", "2147483648", "99999999999"]) {
        for (const method of ["GET", "PATCH", "DELETE"]) {
          const response = await ActivityController.handle(
            new Request(`http://localhost/activities/${id}`, {
              method,
              headers: { cookie: user.cookie, "content-type": "application/json" },
              body: method === "PATCH" ? JSON.stringify({ category: "study" }) : undefined,
            }),
          );

          expect({ id, method, status: response.status }).toEqual({ id, method, status: 422 });
          expect(await response.json()).toMatchObject({ error: { code: "VALIDATION" } });
        }
      }
    });
  });

  // Matéria com byte nulo passa no schema (minLength 1) e no trim, mas o Postgres recusa
  // o texto (22021): sem barrar antes, POST/PATCH respondem 500 em vez de 422.
  describe("subject com byte nulo", () => {
    it("POST responde 422 VALIDATION (não 500)", async () => {
      const user = await IntegrationTestHelper.createTestUser();

      const response = await ActivityController.handle(
        new Request("http://localhost/activities", {
          method: "POST",
          headers: { cookie: user.cookie, "content-type": "application/json" },
          body: JSON.stringify({ category: "study", hours: 1, minutes: 0, subject: "Calc\u0000ulus" }),
        }),
      );

      expect(response.status).toBe(422);
      expect(await response.json()).toMatchObject({ error: { code: "VALIDATION" } });
    });
  });
});
