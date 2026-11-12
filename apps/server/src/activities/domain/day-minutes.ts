import { ACTIVITY_CATEGORIES, type ActivityCategory } from "@mystatistics/shared";

/**
 * Minutos de atividade agregados por dia e categoria: a entrada das regras de progresso e do
 * resumo por período. Lógica pura — sem banco, sem env.
 */

/** Minutos de cada categoria (num dia, ou num período). */
export type CategoryMinutes = Record<ActivityCategory, number>;

/** Linha do agregado SQL: soma dos minutos de uma categoria num dia. */
export type DailyCategoryMinutes = { date: string; category: ActivityCategory; minutes: number };

/** Atividades `study` de um intervalo: quantas são e quantos minutos somam (entrada do FOCUS). */
export type StudySessions = { count: number; totalMinutes: number };

/** Dia `"YYYY-MM-DD"` → minutos por categoria. Dia sem atividade não aparece. */
export type DayMinutes = ReadonlyMap<string, CategoryMinutes>;

/** Todas as categorias com 0 minutos. */
export function emptyCategoryMinutes(): CategoryMinutes {
  return { study: 0, exercise: 0 };
}

/** Soma dos minutos de todas as categorias. */
export function totalMinutesOf(minutes: CategoryMinutes): number {
  return ACTIVITY_CATEGORIES.reduce((sum, category) => sum + minutes[category], 0);
}

/** Agrupa as linhas do agregado por dia (linhas repetidas do mesmo dia e categoria somam). */
export function toDayMinutes(rows: readonly DailyCategoryMinutes[]): DayMinutes {
  const byDay = new Map<string, CategoryMinutes>();
  for (const row of rows) {
    const day = byDay.get(row.date) ?? emptyCategoryMinutes();
    day[row.category] += row.minutes;
    byDay.set(row.date, day);
  }
  return byDay;
}

/** Os minutos de um dia; dia sem atividade vem com tudo 0. */
export function minutesOn(byDay: DayMinutes, date: string): CategoryMinutes {
  return byDay.get(date) ?? emptyCategoryMinutes();
}
