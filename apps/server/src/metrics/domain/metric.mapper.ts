import type { Entry, Metric } from "@mystatistics/shared";
import type { EntryRow, MetricRow } from "./metric.schema";

/** Converte a linha do banco no DTO do contrato. Coluna nova na tabela só chega na API passando por aqui. */
export function toMetric(row: MetricRow): Metric {
  return { id: row.id, name: row.name, unit: row.unit };
}

/** Converte a linha do banco no DTO do contrato (sem o `userId`, que não sai na API). */
export function toEntry(row: EntryRow): Entry {
  return { id: row.id, metricId: row.metricId, value: row.value, date: row.date };
}
