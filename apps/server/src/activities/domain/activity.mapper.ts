import type { Activity } from "@mystatistics/shared";
import type { ActivityRow } from "./activity.schema";

/** Converte a linha do banco no DTO do contrato. Coluna nova na tabela só chega na API passando por aqui. */
export function toActivity(row: ActivityRow): Activity {
  return {
    id: row.id,
    category: row.category,
    durationMinutes: row.durationMinutes,
    date: row.date,
  };
}
