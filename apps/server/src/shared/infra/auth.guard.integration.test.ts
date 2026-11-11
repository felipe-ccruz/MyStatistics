import { afterEach, beforeAll, describe, expect, it } from "bun:test";
import { IntegrationTestHelper } from "@/shared/utils/test-helpers/integration-test-helper";
import { authGuard } from "./auth.guard";
import { createController } from "./base.controller";

/** Rota mínima atrás do guard, montada sozinha com `.handle()` (sem subir servidor). */
const protectedRoute = createController()
  .use(authGuard)
  .get("/whoami", ({ userId }) => ({ userId }));

function whoami(headers: Record<string, string> = {}) {
  return protectedRoute.handle(new Request("http://localhost/whoami", { headers }));
}

describe("authGuard - Integration", () => {
  beforeAll(() => IntegrationTestHelper.setupTestDatabase());
  afterEach(() => IntegrationTestHelper.truncateAll());

  it("expõe o userId da sessão do cookie", async () => {
    const user = await IntegrationTestHelper.createTestUser();

    const response = await whoami({ cookie: user.cookie });

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ userId: user.id });
  });

  it("responde 401 UNAUTHORIZED sem cookie", async () => {
    const response = await whoami();

    expect(response.status).toBe(401);
    expect(await response.json()).toEqual({
      error: { message: "You need to be logged in.", code: "UNAUTHORIZED" },
    });
  });

  it("responde 401 UNAUTHORIZED com cookie inválido", async () => {
    const response = await whoami({ cookie: "better-auth.session_token=forged.value" });

    expect(response.status).toBe(401);
  });
});
