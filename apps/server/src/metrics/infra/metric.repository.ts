import { and, asc, eq, sql } from "drizzle-orm";
import { db, type Transaction } from "@/shared/infra/databases/postgres";
import { HttpError } from "@/shared/infra/errors/http-error";
import { type MetricRow, metricsTable, type NewMetricRow } from "../domain/metric.schema";

/** Filtro "esta métrica, deste usuário": métrica de outro usuário se comporta como inexistente. */
function ownedBy(userId: string, id: number) {
  return and(eq(metricsTable.userId, userId), eq(metricsTable.id, id));
}

/**
 * Acesso à tabela `metrics`. Só query: regra de negócio fica nos use cases.
 * Toda leitura e escrita recebe o `userId` e filtra por ele.
 */
export class MetricRepository {
  static async create(data: NewMetricRow, tx?: Transaction): Promise<MetricRow> {
    const [row] = await (tx ?? db).insert(metricsTable).values(data).returning();
    if (!row) throw new HttpError(500, "Failed to save the metric.", "INTERNAL");
    return row;
  }

  /** Por nome, sem diferenciar maiúsculas (o mesmo critério do índice único). */
  static async findByName(userId: string, name: string, tx?: Transaction): Promise<MetricRow | null> {
    const [row] = await (tx ?? db)
      .select()
      .from(metricsTable)
      .where(and(eq(metricsTable.userId, userId), sql`lower(${metricsTable.name}) = lower(${name})`))
      .limit(1);
    return row ?? null;
  }

  /** As métricas do usuário por nome, sem diferenciar maiúsculas; empate (impossível pelo índice) por id. */
  static async findAll(userId: string, tx?: Transaction): Promise<MetricRow[]> {
    return (tx ?? db)
      .select()
      .from(metricsTable)
      .where(eq(metricsTable.userId, userId))
      .orderBy(asc(sql`lower(${metricsTable.name})`), asc(metricsTable.id));
  }

  static async findById(userId: string, id: number, tx?: Transaction): Promise<MetricRow | null> {
    const [row] = await (tx ?? db).select().from(metricsTable).where(ownedBy(userId, id)).limit(1);
    return row ?? null;
  }

  /** Apaga a métrica; os registros dela vão junto (fk `on delete cascade`). */
  static async delete(userId: string, id: number, tx?: Transaction): Promise<void> {
    await (tx ?? db).delete(metricsTable).where(ownedBy(userId, id));
  }
}
