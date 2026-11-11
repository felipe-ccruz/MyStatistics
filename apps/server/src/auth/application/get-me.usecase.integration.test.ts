import { afterEach, beforeAll, describe, expect, it } from "bun:test";
import { UnauthorizedError } from "@/shared/infra/errors/unauthorized-error";
import { IntegrationTestHelper } from "@/shared/utils/test-helpers/integration-test-helper";
import { getMeUseCase } from "./get-me.usecase";

describe("getMeUseCase - Integration", () => {
  beforeAll(() => IntegrationTestHelper.setupTestDatabase());
  afterEach(() => IntegrationTestHelper.truncateAll());

  describe("Sucesso", () => {
    it("devolve usuário e perfil do userId", async () => {
      const user = await IntegrationTestHelper.createTestUser();

      expect(await getMeUseCase({ userId: user.id })).toEqual({
        user: { id: user.id, email: user.email },
        profile: { slug: user.slug, visibility: "private" },
      });
    });
  });

  describe("Erros", () => {
    it("lança UnauthorizedError quando o usuário não existe", async () => {
      const error = await IntegrationTestHelper.rejectionOf(getMeUseCase({ userId: "missing-user" }));

      expect(error).toBeInstanceOf(UnauthorizedError);
    });
  });
});
