import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it } from "bun:test";
import { eq, sql } from "drizzle-orm";
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import { env } from "@/shared/infra/env/env";
import { NotFoundError } from "@/shared/infra/errors/not-found-error";
import { addDaysISO, todayISO } from "@/shared/utils/calendar-day";
import { IntegrationTestHelper, type TestUser } from "@/shared/utils/test-helpers/integration-test-helper";
import { type ActivityRow, activitiesTable } from "../domain/activity.schema";
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

      expect(updated).toEqual({
        id: existing.id,
        category: "exercise",
        durationMinutes: 90,
        date: "2026-10-20",
        subject: null,
      });
    });

    it("recalcula a duração quando hours e minutes vêm juntos", async () => {
      const updated = await updateActivityUseCase({ userId: user.id, id: existing.id, hours: 2, minutes: 15 });

      expect(updated.durationMinutes).toBe(135);
    });
  });

  describe("Matéria", () => {
    let withSubject: ActivityRow;

    beforeEach(async () => {
      withSubject = await ActivityRepository.create({
        userId: user.id,
        category: "study",
        durationMinutes: 60,
        date: "2026-10-21",
        subject: "Calculus",
      });
    });

    it("troca a matéria, sem espaços nas pontas", async () => {
      const updated = await updateActivityUseCase({ userId: user.id, id: withSubject.id, subject: " Physics " });

      expect(updated.subject).toBe("Physics");
    });

    it("mantém a matéria quando subject não vem", async () => {
      const updated = await updateActivityUseCase({ userId: user.id, id: withSubject.id, hours: 1, minutes: 30 });

      expect(updated.subject).toBe("Calculus");
    });

    it("subject: null remove a matéria", async () => {
      const updated = await updateActivityUseCase({ userId: user.id, id: withSubject.id, subject: null });

      expect(updated.subject).toBeNull();
    });

    it("muda para exercise mandando subject: null junto", async () => {
      const updated = await updateActivityUseCase({
        userId: user.id,
        id: withSubject.id,
        category: "exercise",
        subject: null,
      });

      expect(updated).toMatchObject({ category: "exercise", subject: null });
    });

    it("recusa mudar para exercise sem remover a matéria, com SUBJECT_NOT_ALLOWED, e não altera nada", async () => {
      const error = await IntegrationTestHelper.rejectionOf(
        updateActivityUseCase({ userId: user.id, id: withSubject.id, category: "exercise" }),
      );

      expect(error).toMatchObject({ status: 422, apiCode: "SUBJECT_NOT_ALLOWED" });
      expect(await ActivityRepository.findById(user.id, withSubject.id)).toEqual(withSubject);
    });

    it("recusa matéria numa atividade exercise com SUBJECT_NOT_ALLOWED", async () => {
      await updateActivityUseCase({ userId: user.id, id: existing.id, category: "exercise" });

      const error = await IntegrationTestHelper.rejectionOf(
        updateActivityUseCase({ userId: user.id, id: existing.id, subject: "Running" }),
      );

      expect(error).toMatchObject({ status: 422, apiCode: "SUBJECT_NOT_ALLOWED" });
    });

    it("recusa matéria só de espaços com VALIDATION", async () => {
      const error = await IntegrationTestHelper.rejectionOf(
        updateActivityUseCase({ userId: user.id, id: withSubject.id, subject: "  " }),
      );

      expect(error).toMatchObject({ status: 422, apiCode: "VALIDATION" });
      expect((await ActivityRepository.findById(user.id, withSubject.id))?.subject).toBe("Calculus");
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

    it("rejeita dia inexistente com VALIDATION e não altera nada", async () => {
      const error = await IntegrationTestHelper.rejectionOf(
        updateActivityUseCase({ userId: user.id, id: existing.id, date: "2026-02-31" }),
      );

      expect(error).toMatchObject({ status: 422, apiCode: "VALIDATION" });
      expect(await ActivityRepository.findById(user.id, existing.id)).toEqual(existing);
    });

    it("rejeita data depois de hoje com FUTURE_DATE e não altera nada", async () => {
      const error = await IntegrationTestHelper.rejectionOf(
        updateActivityUseCase({ userId: user.id, id: existing.id, date: addDaysISO(todayISO(), 1) }),
      );

      expect(error).toMatchObject({ status: 422, apiCode: "FUTURE_DATE" });
      expect(await ActivityRepository.findById(user.id, existing.id)).toEqual(existing);
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

/**
 * Corrida entre dois PATCH da mesma atividade (ex.: duas abas). Outra conexão muda a
 * atividade para `exercise` (removendo a matéria) numa transação ainda aberta; o use case lê a
 * versão antiga (`study`), valida `subject` contra ela e o UPDATE dele espera o lock da linha.
 * Quando a outra commita, o UPDATE só troca o `subject` — e sobra um `exercise` com matéria,
 * o que a regra SUBJECT_NOT_ALLOWED proíbe. Precisa de `SELECT ... FOR UPDATE` no `findById` da
 * transação ou de um CHECK no banco.
 */
describe("updateActivityUseCase - Integration (dois PATCH ao mesmo tempo)", () => {
  const client = postgres(env.DATABASE_URL, { max: 2 });
  const other = drizzle(client);

  beforeAll(() => IntegrationTestHelper.setupTestDatabase());
  afterEach(() => IntegrationTestHelper.truncateAll());
  afterAll(() => client.end());

  async function waitForBlockedQuery(): Promise<boolean> {
    for (let attempt = 0; attempt < 50; attempt++) {
      const rows = await other.execute<{ waiting: number }>(
        sql`select count(*)::int as waiting from pg_stat_activity
            where datname = current_database() and wait_event_type = 'Lock'`,
      );
      if ((rows[0]?.waiting ?? 0) > 0) return true;
      await Bun.sleep(20);
    }
    return false;
  }

  it("nunca deixa uma atividade exercise com matéria", async () => {
    const user = await IntegrationTestHelper.createTestUser();
    const activity = await ActivityRepository.create({
      userId: user.id,
      category: "study",
      durationMinutes: 60,
      date: "2026-10-21",
    });
    let release = () => {};
    const gate = new Promise<void>((resolve) => {
      release = resolve;
    });
    let changed = () => {};
    const changedSignal = new Promise<void>((resolve) => {
      changed = resolve;
    });

    const holder = other.transaction(async (tx) => {
      await tx
        .update(activitiesTable)
        .set({ category: "exercise", subject: null })
        .where(eq(activitiesTable.id, activity.id));
      changed();
      await gate;
    });
    await changedSignal;

    const racing = updateActivityUseCase({ userId: user.id, id: activity.id, subject: "Calculus" }).then(
      (value) => value,
      (error: unknown) => error,
    );
    await waitForBlockedQuery();
    release();
    await holder;
    await racing;

    const [row] = await other.select().from(activitiesTable).where(eq(activitiesTable.id, activity.id));
    expect(row?.category === "exercise" && row.subject !== null).toBe(false);
  });
});
