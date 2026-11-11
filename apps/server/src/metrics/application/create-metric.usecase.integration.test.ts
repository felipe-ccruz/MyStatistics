import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it } from "bun:test";
import { sql } from "drizzle-orm";
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import { isUniqueViolation } from "@/shared/infra/databases/postgres-errors";
import { env } from "@/shared/infra/env/env";
import { IntegrationTestHelper, type TestUser } from "@/shared/utils/test-helpers/integration-test-helper";
import { metricsTable } from "../domain/metric.schema";
import { MetricRepository } from "../infra/metric.repository";
import { createMetricUseCase } from "./create-metric.usecase";

/**
 * Corrida de verdade: uma segunda conexão (o pool do app tem 1 só fora de produção) insere
 * "Weight" numa transação aberta, sem commit. O use case não vê a linha na checagem, o insert
 * dele trava no índice único e, quando a outra transação commita, falha com 23505 — que tem de
 * virar 409 METRIC_NAME_TAKEN, não 500.
 */
describe("createMetricUseCase - Integration (corrida no índice único)", () => {
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
    throw new Error("The use case insert never blocked on the unique index.");
  }

  it("dois pedidos passam juntos pela checagem: o segundo recebe 409 METRIC_NAME_TAKEN", async () => {
    const user = await IntegrationTestHelper.createTestUser();
    let release = () => {};
    const gate = new Promise<void>((resolve) => {
      release = resolve;
    });
    let inserted = () => {};
    const insertedSignal = new Promise<void>((resolve) => {
      inserted = resolve;
    });

    const holder = other.transaction(async (tx) => {
      await tx.insert(metricsTable).values({ userId: user.id, name: "Weight", unit: "kg" });
      inserted();
      await gate;
    });
    await insertedSignal;

    const racing = IntegrationTestHelper.rejectionOf(
      createMetricUseCase({ userId: user.id, name: "weight", unit: "" }),
    );
    await waitForBlockedQuery();
    release();
    await holder;

    expect(await racing).toMatchObject({ status: 409, apiCode: "METRIC_NAME_TAKEN" });
    expect(await MetricRepository.findAll(user.id)).toHaveLength(1);
  });
});

describe("createMetricUseCase - Integration", () => {
  let user: TestUser;

  beforeAll(() => IntegrationTestHelper.setupTestDatabase());
  beforeEach(async () => {
    user = await IntegrationTestHelper.createTestUser();
  });
  afterEach(() => IntegrationTestHelper.truncateAll());

  describe("Sucesso", () => {
    it("grava a métrica do usuário sem espaços nas pontas e a devolve", async () => {
      const metric = await createMetricUseCase({ userId: user.id, name: "  Body weight ", unit: " kg " });

      expect(metric).toEqual({ id: expect.any(Number), name: "Body weight", unit: "kg" });
      expect(await MetricRepository.findById(user.id, metric.id)).toMatchObject({ userId: user.id });
    });

    it("aceita unidade vazia", async () => {
      const metric = await createMetricUseCase({ userId: user.id, name: "Mood", unit: "" });

      expect(metric.unit).toBe("");
    });

    it("deixa outro usuário usar o mesmo nome", async () => {
      const other = await IntegrationTestHelper.createTestUser();
      await createMetricUseCase({ userId: other.id, name: "Weight", unit: "kg" });

      const metric = await createMetricUseCase({ userId: user.id, name: "Weight", unit: "lb" });

      expect(metric.name).toBe("Weight");
    });
  });

  describe("Erros", () => {
    it("recusa nome só de espaços com 422 VALIDATION e não grava nada", async () => {
      const error = await IntegrationTestHelper.rejectionOf(
        createMetricUseCase({ userId: user.id, name: "   ", unit: "kg" }),
      );

      expect(error).toMatchObject({ status: 422, apiCode: "VALIDATION" });
      expect(await MetricRepository.findAll(user.id)).toHaveLength(0);
    });

    it("recusa nome repetido sem diferenciar maiúsculas nem espaços com 409 METRIC_NAME_TAKEN", async () => {
      await createMetricUseCase({ userId: user.id, name: "Weight", unit: "kg" });

      for (const name of ["Weight", "weight", " WEIGHT "]) {
        const error = await IntegrationTestHelper.rejectionOf(createMetricUseCase({ userId: user.id, name, unit: "" }));

        expect(error).toMatchObject({ status: 409, apiCode: "METRIC_NAME_TAKEN" });
      }
      expect(await MetricRepository.findAll(user.id)).toHaveLength(1);
    });

    it("o índice único barra o nome repetido mesmo sem a checagem do use case (corrida)", async () => {
      await MetricRepository.create({ userId: user.id, name: "Weight", unit: "kg" });

      const error = await IntegrationTestHelper.rejectionOf(
        MetricRepository.create({ userId: user.id, name: "WEIGHT", unit: "kg" }),
      );

      expect(isUniqueViolation(error)).toBe(true);
    });
  });
});
