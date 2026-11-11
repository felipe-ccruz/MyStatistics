import { afterEach, beforeAll, beforeEach, describe, expect, it } from "bun:test";
import { NotFoundError } from "@/shared/infra/errors/not-found-error";
import { IntegrationTestHelper, type TestUser } from "@/shared/utils/test-helpers/integration-test-helper";
import { ActivityRepository } from "../infra/activity.repository";
import { deleteActivityUseCase } from "./delete-activity.usecase";

describe("deleteActivityUseCase - Integration", () => {
  let user: TestUser;

  beforeAll(() => IntegrationTestHelper.setupTestDatabase());
  beforeEach(async () => {
    user = await IntegrationTestHelper.createTestUser();
  });
  afterEach(() => IntegrationTestHelper.truncateAll());

  describe("Sucesso", () => {
    it("remove a atividade e mantém as outras", async () => {
      const userId = user.id;
      const removed = await ActivityRepository.create({
        userId,
        category: "study",
        durationMinutes: 30,
        date: "2026-10-21",
      });
      const kept = await ActivityRepository.create({
        userId,
        category: "exercise",
        durationMinutes: 60,
        date: "2026-10-21",
      });

      await deleteActivityUseCase({ userId, id: removed.id });

      expect(await ActivityRepository.findById(userId, removed.id)).toBeNull();
      expect(await ActivityRepository.findById(userId, kept.id)).not.toBeNull();
    });
  });

  describe("Erros", () => {
    it("lança NotFoundError quando o id não existe", async () => {
      const error = await IntegrationTestHelper.rejectionOf(deleteActivityUseCase({ userId: user.id, id: 999 }));

      expect(error).toBeInstanceOf(NotFoundError);
    });
  });

  describe("Isolamento", () => {
    it("lança NotFoundError para a atividade de outro usuário e não a apaga", async () => {
      const other = await IntegrationTestHelper.createTestUser();
      const othersActivity = await ActivityRepository.create({
        userId: other.id,
        category: "study",
        durationMinutes: 30,
        date: "2026-10-21",
      });

      const error = await IntegrationTestHelper.rejectionOf(
        deleteActivityUseCase({ userId: user.id, id: othersActivity.id }),
      );

      expect(error).toBeInstanceOf(NotFoundError);
      expect(await ActivityRepository.findById(other.id, othersActivity.id)).toEqual(othersActivity);
    });
  });
});
