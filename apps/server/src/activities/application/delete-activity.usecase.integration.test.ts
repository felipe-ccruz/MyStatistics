import { afterEach, beforeAll, describe, expect, it } from "bun:test";
import { NotFoundError } from "@/shared/infra/errors/not-found-error";
import { IntegrationTestHelper } from "@/shared/utils/test-helpers/integration-test-helper";
import { activitiesTable } from "../domain/activity.schema";
import { ActivityRepository } from "../infra/activity.repository";
import { deleteActivityUseCase } from "./delete-activity.usecase";

describe("deleteActivityUseCase - Integration", () => {
  beforeAll(() => IntegrationTestHelper.setupTestDatabase());
  afterEach(() => IntegrationTestHelper.truncate(activitiesTable));

  describe("Sucesso", () => {
    it("remove a atividade e mantém as outras", async () => {
      const removed = await ActivityRepository.create({ category: "study", durationMinutes: 30, date: "2026-10-21" });
      const kept = await ActivityRepository.create({ category: "exercise", durationMinutes: 60, date: "2026-10-21" });

      await deleteActivityUseCase({ id: removed.id });

      expect(await ActivityRepository.findById(removed.id)).toBeNull();
      expect(await ActivityRepository.findById(kept.id)).not.toBeNull();
    });
  });

  describe("Erros", () => {
    it("lança NotFoundError quando o id não existe", async () => {
      await expect(deleteActivityUseCase({ id: 999 })).rejects.toThrow(NotFoundError);
    });
  });
});
