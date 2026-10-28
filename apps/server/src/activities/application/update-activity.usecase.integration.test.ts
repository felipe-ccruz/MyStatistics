import { afterEach, beforeAll, beforeEach, describe, expect, it } from "bun:test";
import { NotFoundError } from "@/shared/infra/errors/not-found-error";
import { IntegrationTestHelper } from "@/shared/utils/test-helpers/integration-test-helper";
import { activitiesTable, type ActivityRow } from "../domain/activity.schema";
import { ActivityRepository } from "../infra/activity.repository";
import { updateActivityUseCase } from "./update-activity.usecase";

describe("updateActivityUseCase - Integration", () => {
  let existing: ActivityRow;

  beforeAll(() => IntegrationTestHelper.setupTestDatabase());
  beforeEach(async () => {
    existing = await ActivityRepository.create({ category: "study", durationMinutes: 90, date: "2026-10-20" });
  });
  afterEach(() => IntegrationTestHelper.truncate(activitiesTable));

  describe("Sucesso", () => {
    it("muda só os campos enviados", async () => {
      const updated = await updateActivityUseCase({ id: existing.id, category: "exercise" });

      expect(updated).toEqual({ id: existing.id, category: "exercise", durationMinutes: 90, date: "2026-10-20" });
    });

    it("recalcula a duração quando hours e minutes vêm juntos", async () => {
      const updated = await updateActivityUseCase({ id: existing.id, hours: 2, minutes: 15 });

      expect(updated.durationMinutes).toBe(135);
    });
  });

  describe("Erros", () => {
    it("rejeita hours sem minutes com INVALID_DURATION e não altera nada", async () => {
      await expect(updateActivityUseCase({ id: existing.id, hours: 3 })).rejects.toMatchObject({
        status: 422,
        apiCode: "INVALID_DURATION",
      });

      expect((await ActivityRepository.findById(existing.id))?.durationMinutes).toBe(90);
    });

    it("rejeita body sem nada a mudar com EMPTY_UPDATE", async () => {
      await expect(updateActivityUseCase({ id: existing.id })).rejects.toMatchObject({
        status: 422,
        apiCode: "EMPTY_UPDATE",
      });
    });

    it("lança NotFoundError quando o id não existe", async () => {
      await expect(updateActivityUseCase({ id: 999, category: "exercise" })).rejects.toThrow(NotFoundError);
    });
  });
});
