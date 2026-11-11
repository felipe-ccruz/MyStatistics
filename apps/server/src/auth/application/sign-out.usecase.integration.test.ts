import { afterEach, beforeAll, describe, expect, it } from "bun:test";
import { eq } from "drizzle-orm";
import { db } from "@/shared/infra/databases/postgres";
import { IntegrationTestHelper } from "@/shared/utils/test-helpers/integration-test-helper";
import { sessionsTable } from "../domain/auth.schema";
import { auth } from "../infra/better-auth";
import { signOutUseCase } from "./sign-out.usecase";

describe("signOutUseCase - Integration", () => {
  beforeAll(() => IntegrationTestHelper.setupTestDatabase());
  afterEach(() => IntegrationTestHelper.truncateAll());

  describe("Sucesso", () => {
    it("apaga a sessão e devolve o cookie expirado", async () => {
      const user = await IntegrationTestHelper.createTestUser();

      const setCookies = await signOutUseCase(user.headers);

      expect(setCookies.some((cookie) => cookie.includes("session_token=") && cookie.includes("Max-Age=0"))).toBe(true);
      expect(await db.select().from(sessionsTable).where(eq(sessionsTable.userId, user.id))).toHaveLength(0);
      expect(await auth.api.getSession({ headers: user.headers })).toBeNull();
    });

    it("funciona sem sessão", async () => {
      const setCookies = await signOutUseCase(new Headers());

      expect(setCookies).toBeArray();
    });
  });
});
