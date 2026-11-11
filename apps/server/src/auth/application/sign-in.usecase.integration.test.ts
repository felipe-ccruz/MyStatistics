import { afterEach, beforeAll, describe, expect, it } from "bun:test";
import { IntegrationTestHelper } from "@/shared/utils/test-helpers/integration-test-helper";
import { INVALID_CREDENTIALS_MESSAGE } from "../domain/auth-errors";
import { signInUseCase } from "./sign-in.usecase";

describe("signInUseCase - Integration", () => {
  beforeAll(() => IntegrationTestHelper.setupTestDatabase());
  afterEach(() => IntegrationTestHelper.truncateAll());

  describe("Sucesso", () => {
    it("abre uma sessão nova e devolve o Me com o cookie", async () => {
      const user = await IntegrationTestHelper.createTestUser();

      const { me, setCookies } = await signInUseCase({ email: user.email, password: user.password });

      expect(me).toEqual({
        user: { id: user.id, email: user.email },
        profile: { slug: user.slug, visibility: "private" },
      });
      expect(setCookies.some((cookie) => cookie.includes("session_token="))).toBe(true);
    });

    it("aceita o e-mail com maiúsculas", async () => {
      const user = await IntegrationTestHelper.createTestUser();

      const { me } = await signInUseCase({ email: user.email.toUpperCase(), password: user.password });

      expect(me.user.id).toBe(user.id);
    });
  });

  describe("Erros", () => {
    it("responde o mesmo INVALID_CREDENTIALS para senha errada e para e-mail inexistente", async () => {
      const user = await IntegrationTestHelper.createTestUser();
      const expected = { status: 401, apiCode: "INVALID_CREDENTIALS", message: INVALID_CREDENTIALS_MESSAGE };

      const wrongPassword = await IntegrationTestHelper.rejectionOf(
        signInUseCase({ email: user.email, password: "wrong-password" }),
      );
      const unknownEmail = await IntegrationTestHelper.rejectionOf(
        signInUseCase({ email: "nobody@test.local", password: user.password }),
      );

      expect(wrongPassword).toMatchObject(expected);
      expect(unknownEmail).toMatchObject(expected);
    });
  });
});
