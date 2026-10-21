/**
 * Atividade: um registro de tempo gasto numa categoria, num dia.
 *
 * Este arquivo é PURO de propósito (sem importar Elysia/TypeBox): o schema do
 * Drizzle importa `ACTIVITY_CATEGORIES` daqui para o pgEnum sem puxar o framework.
 * O schema de validação do body mora em ./activity-schema.
 */

/** Fonte única da verdade das categorias. Alimenta o pgEnum (banco) e o TypeBox (borda). */
export const ACTIVITY_CATEGORIES = ["study", "exercise"] as const;

export type ActivityCategory = (typeof ACTIVITY_CATEGORIES)[number];

/** Uma atividade como a API a devolve. `date` é dia de calendário no formato "YYYY-MM-DD". */
export type Activity = {
  id: number;
  category: ActivityCategory;
  durationMinutes: number;
  date: string;
};
