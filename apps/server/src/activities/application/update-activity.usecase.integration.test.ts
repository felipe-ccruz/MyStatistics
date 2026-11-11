import { afterEach, beforeAll, beforeEach, describe, expect, it } from "bun:test";
import { NotFoundError } from "@/shared/infra/errors/not-found-error";
import { IntegrationTestHelper, type TestUser } from "@/shared/utils/test-helpers/integration-test-helper";
import type { ActivityRow } from "../domain/activity.schema";
import { ActivityRepository } from "../infra/activity.repository";
import { updateActivityUseCase } from "./update-activity.usecase";

describe("updateActivityUseCase - Integration", () => {
  let user: TestUser;
  let existing: ActivityRow;

  beforeAll(() => IntegrationTestHelper.setupTestDatabase());
  beforeEach(async () => {
    user = await IntegrationTestHelper.createTestUser();
    existing = await ActivityRepository.create({
      userId: user.id,
      category: "study",
      durationMinutes: 90,
      date: "2026-10-20",
    });
  });
  afterEach(() => IntegrationTestHelper.truncateAll());

  describe("Sucesso", () => {
    it("muda só os campos enviados", async () => {
      const updated = await updateActivityUseCase({ userId: user.id, id: existing.id, category: "exercise" });

      expect(updated).toEqual({ id: existing.id, category: "exercise", durationMinutes: 90, date: "2026-10-20" });
    });

    it("recalcula a duração quando hours e minutes vêm juntos", async () => {
      const updated = await updateActivityUseCase({ userId: user.id, id: existing.id, hours: 2, minutes: 15 });

      expect(updated.durationMinutes).toBe(135);
    });
  });

  describe("Erros", () => {
    it("rejeita hours sem minutes com INVALID_DURATION e não altera nada", async () => {
      const error = await IntegrationTestHelper.rejectionOf(
        updateActivityUseCase({ userId: user.id, id: existing.id, hours: 3 }),
      );

      expect(error).toMatchObject({ status: 422, apiCode: "INVALID_DURATION" });
      expect((await ActivityRepository.findById(user.id, existing.id))?.durationMinutes).toBe(90);
    });

    it("rejeita body sem nada a mudar com EMPTY_UPDATE", async () => {
      const error = await IntegrationTestHelper.rejectionOf(
        updateActivityUseCase({ userId: user.id, id: existing.id }),
      );

      expect(error).toMatchObject({ status: 422, apiCode: "EMPTY_UPDATE" });
    });

    it("lança NotFoundError quando o id não existe", async () => {
      const error = await IntegrationTestHelper.rejectionOf(
        updateActivityUseCase({ userId: user.id, id: 999, category: "exercise" }),
      );

      expect(error).toBeInstanceOf(NotFoundError);
    });
  });

  describe("Isolamento", () => {
    it("lança NotFoundError para a atividade de outro usuário e não a altera", async () => {
      const other = await IntegrationTestHelper.createTestUser();

      const error = await IntegrationTestHelper.rejectionOf(
        updateActivityUseCase({ userId: other.id, id: existing.id, category: "exercise" }),
      );

      expect(error).toBeInstanceOf(NotFoundError);
      expect(await ActivityRepository.findById(user.id, existing.id)).toEqual(existing);
    });
  });
});
