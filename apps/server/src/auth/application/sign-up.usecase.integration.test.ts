import { afterEach, beforeAll, describe, expect, it, spyOn } from "bun:test";
import { eq } from "drizzle-orm";
import { db } from "@/shared/infra/databases/postgres";
import { IntegrationTestHelper } from "@/shared/utils/test-helpers/integration-test-helper";
import { accountsTable, sessionsTable, usersTable } from "../domain/auth.schema";
import { ProfileRepository } from "../infra/profile.repository";
import { UserRepository } from "../infra/user.repository";
import { signUpUseCase } from "./sign-up.usecase";

async function usersWithEmail(email: string) {
  return db.select().from(usersTable).where(eq(usersTable.email, email));
}

describe("signUpUseCase - Integration", () => {
  beforeAll(() => IntegrationTestHelper.setupTestDatabase());
  afterEach(() => IntegrationTestHelper.truncateAll());

  describe("Sucesso", () => {
    it("cria usuário, credencial, perfil private e sessão, e devolve o Me com o cookie", async () => {
      const { me, setCookies } = await signUpUseCase({
        email: "ana@test.local",
        password: "correct-horse",
        slug: "ana",
      });

      expect(me).toEqual({
        user: { id: expect.any(String), email: "ana@test.local" },
        profile: { slug: "ana", visibility: "private" },
      });
      expect(setCookies.some((cookie) => cookie.includes("session_token="))).toBe(true);
      expect(setCookies.every((cookie) => cookie.includes("HttpOnly"))).toBe(true);

      expect(await ProfileRepository.findByUserId(me.user.id)).toMatchObject({ slug: "ana", visibility: "private" });
      const accounts = await db.select().from(accountsTable).where(eq(accountsTable.userId, me.user.id));
      expect(accounts).toHaveLength(1);
      expect(accounts[0]?.password).not.toBe("correct-horse");
      expect(await db.select().from(sessionsTable).where(eq(sessionsTable.userId, me.user.id))).toHaveLength(1);
    });

    it("guarda o e-mail em minúsculas", async () => {
      const { me } = await signUpUseCase({ email: "Bia@Test.Local", password: "correct-horse", slug: "bia" });

      expect(me.user.email).toBe("bia@test.local");
    });
  });

  describe("Erros", () => {
    it("rejeita slug já usado com SLUG_TAKEN e não cria o usuário", async () => {
      await IntegrationTestHelper.createTestUser({ slug: "taken" });

      const error = await IntegrationTestHelper.rejectionOf(
        signUpUseCase({ email: "other@test.local", password: "correct-horse", slug: "taken" }),
      );

      expect(error).toMatchObject({ status: 409, apiCode: "SLUG_TAKEN" });
      expect(await usersWithEmail("other@test.local")).toHaveLength(0);
    });

    it("rejeita e-mail já usado (sem diferenciar maiúsculas) com EMAIL_TAKEN e não cria perfil", async () => {
      await IntegrationTestHelper.createTestUser({ email: "dup@test.local" });

      const error = await IntegrationTestHelper.rejectionOf(
        signUpUseCase({ email: "DUP@test.local", password: "correct-horse", slug: "fresh-slug" }),
      );

      expect(error).toMatchObject({ status: 409, apiCode: "EMAIL_TAKEN" });
      expect(await ProfileRepository.findBySlug("fresh-slug")).toBeNull();
    });

    it("desfaz o usuário e responde SLUG_TAKEN quando o slug é levado entre a checagem e o perfil", async () => {
      await IntegrationTestHelper.createTestUser({ slug: "race" });
      // Simula a corrida: a checagem prévia não vê o slug, e o índice único barra o perfil (23505).
      const findBySlug = spyOn(ProfileRepository, "findBySlug").mockResolvedValueOnce(null);

      const error = await IntegrationTestHelper.rejectionOf(
        signUpUseCase({ email: "late@test.local", password: "correct-horse", slug: "race" }),
      );
      findBySlug.mockRestore();

      expect(error).toMatchObject({ status: 409, apiCode: "SLUG_TAKEN" });
      expect(await usersWithEmail("late@test.local")).toHaveLength(0);
    });

    it("desfaz usuário, credencial e sessão e relança o erro original quando o perfil falha por outro motivo", async () => {
      const original = new Error("connection lost");
      const create = spyOn(ProfileRepository, "create").mockRejectedValueOnce(original);

      const error = await IntegrationTestHelper.rejectionOf(
        signUpUseCase({ email: "boom@test.local", password: "correct-horse", slug: "boom" }),
      );
      create.mockRestore();

      expect(error).toBe(original);
      expect(await usersWithEmail("boom@test.local")).toHaveLength(0);
      expect(await db.select().from(sessionsTable)).toHaveLength(0);
      expect(await db.select().from(accountsTable)).toHaveLength(0);
    });

    it("relança o erro original quando nem a compensação consegue apagar o usuário", async () => {
      const original = new Error("connection lost");
      const create = spyOn(ProfileRepository, "create").mockRejectedValueOnce(original);
      const remove = spyOn(UserRepository, "delete").mockRejectedValueOnce(new Error("still down"));
      const log = spyOn(console, "error").mockImplementation(() => {});

      const error = await IntegrationTestHelper.rejectionOf(
        signUpUseCase({ email: "orphan@test.local", password: "correct-horse", slug: "orphan" }),
      );
      const logCalls = log.mock.calls.length;
      create.mockRestore();
      remove.mockRestore();
      log.mockRestore();

      expect(error).toBe(original);
      expect(logCalls).toBe(1);
    });

    it("responde EMAIL_TAKEN para o segundo de dois cadastros simultâneos com o mesmo e-mail", async () => {
      const log = spyOn(console, "error").mockImplementation(() => {});

      const results = await Promise.allSettled([
        signUpUseCase({ email: "twin@test.local", password: "correct-horse", slug: "twin-a" }),
        signUpUseCase({ email: "twin@test.local", password: "correct-horse", slug: "twin-b" }),
      ]);
      log.mockRestore();

      const rejected = results.filter((result) => result.status === "rejected");
      expect(results.filter((result) => result.status === "fulfilled")).toHaveLength(1);
      expect(rejected).toHaveLength(1);
      expect(rejected[0]?.reason).toMatchObject({ status: 409, apiCode: "EMAIL_TAKEN" });
      expect(await usersWithEmail("twin@test.local")).toHaveLength(1);
    });
  });
});
