import { afterEach, beforeAll, describe, expect, it } from "bun:test";
import { db } from "@/shared/infra/databases/postgres";
import { IntegrationTestHelper } from "@/shared/utils/test-helpers/integration-test-helper";
import { usersTable } from "../domain/auth.schema";
import { AuthController } from "./auth.controller";

/** POST de formulário vindo de outro site: o cenário de CSRF que o server precisa recusar. */
function crossSiteForm(path: string, body: string) {
  return AuthController.handle(
    new Request(`http://localhost/auth${path}`, {
      method: "POST",
      headers: { "content-type": "application/x-www-form-urlencoded", origin: "https://evil.example" },
      body,
    }),
  );
}

describe("AuthController - Integration", () => {
  beforeAll(() => IntegrationTestHelper.setupTestDatabase());
  afterEach(() => IntegrationTestHelper.truncateAll());

  it("recusa cadastro por formulário com 400 PARSE, sem cookie e sem criar conta", async () => {
    const response = await crossSiteForm("/signup", "email=evil%40test.local&password=evil-pass-123&slug=evil");

    expect(response.status).toBe(400);
    expect(await response.json()).toMatchObject({ error: { code: "PARSE" } });
    expect(response.headers.getSetCookie()).toEqual([]);
    expect(await db.select().from(usersTable)).toHaveLength(0);
  });

  it("recusa login por formulário com 400 PARSE, sem cookie", async () => {
    const user = await IntegrationTestHelper.createTestUser();

    const response = await crossSiteForm(
      "/login",
      `email=${encodeURIComponent(user.email)}&password=${encodeURIComponent(user.password)}`,
    );

    expect(response.status).toBe(400);
    expect(response.headers.getSetCookie()).toEqual([]);
  });
});
