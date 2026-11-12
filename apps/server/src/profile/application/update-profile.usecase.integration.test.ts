import { afterEach, beforeAll, beforeEach, describe, expect, it } from "bun:test";
import { ProfileRepository } from "@/auth/infra/profile.repository";
import { IntegrationTestHelper, type TestUser } from "@/shared/utils/test-helpers/integration-test-helper";
import { updateProfileUseCase } from "./update-profile.usecase";

describe("updateProfileUseCase - Integration", () => {
  let user: TestUser;

  beforeAll(() => IntegrationTestHelper.setupTestDatabase());
  beforeEach(async () => {
    user = await IntegrationTestHelper.createTestUser();
  });
  afterEach(() => IntegrationTestHelper.truncateAll());

  describe("Sucesso", () => {
    it("torna o perfil público e de volta privado, devolvendo o perfil", async () => {
      expect(await updateProfileUseCase({ userId: user.id, visibility: "public" })).toEqual({
        slug: user.slug,
        visibility: "public",
      });
      expect((await ProfileRepository.findByUserId(user.id))?.visibility).toBe("public");

      expect(await updateProfileUseCase({ userId: user.id, visibility: "private" })).toEqual({
        slug: user.slug,
        visibility: "private",
      });
    });
  });

  describe("Isolamento", () => {
    it("não mexe no perfil de outro usuário", async () => {
      const other = await IntegrationTestHelper.createTestUser();

      await updateProfileUseCase({ userId: user.id, visibility: "public" });

      expect((await ProfileRepository.findByUserId(other.id))?.visibility).toBe("private");
    });
  });

  describe("Erros", () => {
    it("responde 401 para sessão de usuário sem perfil", async () => {
      const error = await IntegrationTestHelper.rejectionOf(
        updateProfileUseCase({ userId: "no-such-user", visibility: "public" }),
      );

      expect(error).toMatchObject({ status: 401, apiCode: "UNAUTHORIZED" });
    });
  });
});
