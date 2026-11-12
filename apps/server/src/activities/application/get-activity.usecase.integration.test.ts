import { afterEach, beforeAll, beforeEach, describe, expect, it } from "bun:test";
import { NotFoundError } from "@/shared/infra/errors/not-found-error";
import { IntegrationTestHelper, type TestUser } from "@/shared/utils/test-helpers/integration-test-helper";
import { ActivityRepository } from "../infra/activity.repository";
import { getActivityUseCase } from "./get-activity.usecase";

describe("getActivityUseCase - Integration", () => {
  let user: TestUser;

  beforeAll(() => IntegrationTestHelper.setupTestDatabase());
  beforeEach(async () => {
    user = await IntegrationTestHelper.createTestUser();
  });
  afterEach(() => IntegrationTestHelper.truncateAll());

  describe("Sucesso", () => {
    it("devolve a atividade do usuário pelo id", async () => {
      const row = await ActivityRepository.create({
        userId: user.id,
        category: "study",
        durationMinutes: 75,
        date: "2026-10-21",
        subject: "Calculus",
      });

      expect(await getActivityUseCase({ userId: user.id, id: row.id })).toEqual({
        id: row.id,
        category: "study",
        durationMinutes: 75,
        date: "2026-10-21",
        subject: "Calculus",
      });
    });
  });

  describe("Erros", () => {
    it("lança NotFoundError quando o id não existe", async () => {
      const error = await IntegrationTestHelper.rejectionOf(getActivityUseCase({ userId: user.id, id: 999 }));

      expect(error).toBeInstanceOf(NotFoundError);
    });
  });

  describe("Isolamento", () => {
    it("lança NotFoundError para a atividade de outro usuário", async () => {
      const other = await IntegrationTestHelper.createTestUser();
      const othersActivity = await ActivityRepository.create({
        userId: other.id,
        category: "study",
        durationMinutes: 30,
        date: "2026-10-21",
      });

      const error = await IntegrationTestHelper.rejectionOf(
        getActivityUseCase({ userId: user.id, id: othersActivity.id }),
      );

      expect(error).toBeInstanceOf(NotFoundError);
    });
  });
});
