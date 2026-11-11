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
});
