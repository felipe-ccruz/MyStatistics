import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it } from "bun:test";
import { eq, sql } from "drizzle-orm";
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import { env } from "@/shared/infra/env/env";
import { addDaysISO, todayISO } from "@/shared/utils/calendar-day";
import { IntegrationTestHelper, type TestUser } from "@/shared/utils/test-helpers/integration-test-helper";
import { entriesTable, type MetricRow, metricsTable } from "../domain/metric.schema";
import { EntryRepository } from "../infra/entry.repository";
import { MetricRepository } from "../infra/metric.repository";
import { createEntryUseCase } from "./create-entry.usecase";

/**
 * Corrida de verdade: uma segunda conexão (o pool do app tem 1 só fora de produção) apaga a
 * métrica numa transação aberta, sem commit. O use case ainda vê a métrica na checagem, o insert
 * dele trava na chave estrangeira e, quando a outra transação commita, falha com 23503 — que tem
 * de virar 404 NOT_FOUND, não 500.
 */
describe("createEntryUseCase - Integration (métrica apagada no meio)", () => {
  const client = postgres(env.DATABASE_URL, { max: 2 });
  const other = drizzle(client);

  beforeAll(() => IntegrationTestHelper.setupTestDatabase());
  afterEach(() => IntegrationTestHelper.truncateAll());
  afterAll(() => client.end());

  async function waitForBlockedQuery(): Promise<void> {
    for (let attempt = 0; attempt < 100; attempt++) {
      const rows = await other.execute<{ waiting: number }>(
        sql`select count(*)::int as waiting from pg_stat_activity
            where datname = current_database() and wait_event_type = 'Lock'`,
      );
      if ((rows[0]?.waiting ?? 0) > 0) return;
      await Bun.sleep(20);
    }
    throw new Error("The use case insert never blocked on the foreign key.");
  }

  it("responde 404 NOT_FOUND e não grava nada", async () => {
    const user = await IntegrationTestHelper.createTestUser();
    const metric = await MetricRepository.create({ userId: user.id, name: "Weight", unit: "kg" });
    let release = () => {};
    const gate = new Promise<void>((resolve) => {
      release = resolve;
    });
    let deleted = () => {};
    const deletedSignal = new Promise<void>((resolve) => {
      deleted = resolve;
    });

    const holder = other.transaction(async (tx) => {
      await tx.delete(metricsTable).where(eq(metricsTable.id, metric.id));
      deleted();
      await gate;
    });
    await deletedSignal;

    const racing = IntegrationTestHelper.rejectionOf(
      createEntryUseCase({ userId: user.id, metricId: metric.id, value: 80 }),
    );
    await waitForBlockedQuery();
    release();
    await holder;

    expect(await racing).toMatchObject({ status: 404, apiCode: "NOT_FOUND" });
    expect(await other.select().from(entriesTable)).toHaveLength(0);
  });
});

describe("createEntryUseCase - Integration", () => {
  let user: TestUser;
  let metric: MetricRow;

  beforeAll(() => IntegrationTestHelper.setupTestDatabase());
  beforeEach(async () => {
    user = await IntegrationTestHelper.createTestUser();
    metric = await MetricRepository.create({ userId: user.id, name: "Weight", unit: "kg" });
  });
  afterEach(() => IntegrationTestHelper.truncateAll());

  describe("Sucesso", () => {
    it("grava o registro na métrica do usuário e o devolve", async () => {
      const entry = await createEntryUseCase({ userId: user.id, metricId: metric.id, value: 79.5, date: "2026-10-20" });

      expect(entry).toEqual({ id: expect.any(Number), metricId: metric.id, value: 79.5, date: "2026-10-20" });
      expect(await EntryRepository.findById(user.id, metric.id, entry.id)).toMatchObject({ userId: user.id });
    });

    it("usa o dia de hoje quando date não vem, e aceita hoje", async () => {
      const entry = await createEntryUseCase({ userId: user.id, metricId: metric.id, value: 80 });

      expect(entry.date).toBe(todayISO());
    });

    it("aceita 0 e valor negativo", async () => {
      const zero = await createEntryUseCase({ userId: user.id, metricId: metric.id, value: 0 });
      const negative = await createEntryUseCase({ userId: user.id, metricId: metric.id, value: -2.5 });

      expect([zero.value, negative.value]).toEqual([0, -2.5]);
    });
  });

  describe("Erros", () => {
    it("recusa data futura com 422 FUTURE_DATE e não grava nada", async () => {
      const tomorrow = addDaysISO(todayISO(), 1);

      const error = await IntegrationTestHelper.rejectionOf(
        createEntryUseCase({ userId: user.id, metricId: metric.id, value: 80, date: tomorrow }),
      );

      expect(error).toMatchObject({ status: 422, apiCode: "FUTURE_DATE" });
      expect(await EntryRepository.findAll(user.id, metric.id)).toHaveLength(0);
    });

    it("recusa dia inexistente com 422 VALIDATION", async () => {
      const error = await IntegrationTestHelper.rejectionOf(
        createEntryUseCase({ userId: user.id, metricId: metric.id, value: 80, date: "2026-02-31" }),
      );

      expect(error).toMatchObject({ status: 422, apiCode: "VALIDATION" });
    });

    it("recusa valor não finito com 422 VALIDATION", async () => {
      const error = await IntegrationTestHelper.rejectionOf(
        createEntryUseCase({ userId: user.id, metricId: metric.id, value: Number.POSITIVE_INFINITY }),
      );

      expect(error).toMatchObject({ status: 422, apiCode: "VALIDATION" });
    });

    it("responde 404 NOT_FOUND para métrica inexistente", async () => {
      const error = await IntegrationTestHelper.rejectionOf(
        createEntryUseCase({ userId: user.id, metricId: 999, value: 80 }),
      );

      expect(error).toMatchObject({ status: 404, apiCode: "NOT_FOUND" });
    });

    it("responde 404 NOT_FOUND para métrica de outro usuário, sem gravar nada nela", async () => {
      const other = await IntegrationTestHelper.createTestUser();
      const theirs = await MetricRepository.create({ userId: other.id, name: "Weight", unit: "kg" });

      const error = await IntegrationTestHelper.rejectionOf(
        createEntryUseCase({ userId: user.id, metricId: theirs.id, value: 80 }),
      );

      expect(error).toMatchObject({ status: 404, apiCode: "NOT_FOUND" });
      expect(await EntryRepository.findAll(other.id, theirs.id)).toHaveLength(0);
    });
  });
});
