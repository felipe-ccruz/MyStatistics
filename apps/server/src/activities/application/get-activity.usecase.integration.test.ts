import { afterEach, beforeAll, describe, expect, it } from "bun:test";
import { NotFoundError } from "@/shared/infra/errors/not-found-error";
import { IntegrationTestHelper } from "@/shared/utils/test-helpers/integration-test-helper";
import { activitiesTable } from "../domain/activity.schema";
import { ActivityRepository } from "../infra/activity.repository";
import { getActivityUseCase } from "./get-activity.usecase";

describe("getActivityUseCase - Integration", () => {
  beforeAll(() => IntegrationTestHelper.setupTestDatabase());
  afterEach(() => IntegrationTestHelper.truncate(activitiesTable));

  describe("Sucesso", () => {
    it("devolve a atividade pelo id", async () => {
      const row = await ActivityRepository.create({ category: "study", durationMinutes: 75, date: "2026-10-21" });

      expect(await getActivityUseCase({ id: row.id })).toEqual({
        id: row.id,
        category: "study",
        durationMinutes: 75,
        date: "2026-10-21",
      });
    });
  });

  describe("Erros", () => {
    it("lança NotFoundError quando o id não existe", async () => {
      await expect(getActivityUseCase({ id: 999 })).rejects.toThrow(NotFoundError);
    });
  });
});
