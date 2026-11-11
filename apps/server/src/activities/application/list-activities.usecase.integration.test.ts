import { afterEach, beforeAll, beforeEach, describe, expect, it } from "bun:test";
import { IntegrationTestHelper, type TestUser } from "@/shared/utils/test-helpers/integration-test-helper";
import { ActivityRepository } from "../infra/activity.repository";
import { listActivitiesUseCase } from "./list-activities.usecase";

describe("listActivitiesUseCase - Integration", () => {
  let user: TestUser;

  beforeAll(() => IntegrationTestHelper.setupTestDatabase());
  beforeEach(async () => {
    user = await IntegrationTestHelper.createTestUser();
  });
  afterEach(() => IntegrationTestHelper.truncateAll());

  describe("Sucesso", () => {
    it("devolve lista vazia quando o usuário não tem atividades", async () => {
      expect(await listActivitiesUseCase({ userId: user.id })).toEqual([]);
    });

    it("ordena por date desc e desempata por id desc", async () => {
      const userId = user.id;
      const older = await ActivityRepository.create({
        userId,
        category: "study",
        durationMinutes: 30,
        date: "2026-10-01",
      });
      const first = await ActivityRepository.create({
        userId,
        category: "exercise",
        durationMinutes: 60,
        date: "2026-10-02",
      });
      const second = await ActivityRepository.create({
        userId,
        category: "study",
        durationMinutes: 90,
        date: "2026-10-02",
      });

      const ids = (await listActivitiesUseCase({ userId })).map((activity) => activity.id);

      expect(ids).toEqual([second.id, first.id, older.id]);
    });
  });

  describe("Isolamento", () => {
    it("não lista atividades de outro usuário", async () => {
      const other = await IntegrationTestHelper.createTestUser();
      await ActivityRepository.create({ userId: other.id, category: "study", durationMinutes: 30, date: "2026-10-01" });
      const mine = await ActivityRepository.create({
        userId: user.id,
        category: "exercise",
        durationMinutes: 45,
        date: "2026-10-01",
      });

      const ids = (await listActivitiesUseCase({ userId: user.id })).map((activity) => activity.id);

      expect(ids).toEqual([mine.id]);
    });
  });
});
