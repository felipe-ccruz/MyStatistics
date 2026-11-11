/**
 * Métricas e registros (ACCEPTANCE §5.2 e §5.3).
 *
 * Métrica (`metric`) é a definição do que é medido (ex.: "Weight", unidade "kg").
 * Registro (`entry`) é um lançamento dela: valor + dia. Arquivo puro; os schemas
 * de body moram em ./metric-schema.
 */

/** Uma métrica como a API devolve. */
export type Metric = {
  id: number;
  name: string;
  /** Texto livre, pode ser vazio (ex.: humor de 1 a 5, sem unidade). */
  unit: string;
};

/** Um registro de uma métrica. `date` é dia de calendário `"YYYY-MM-DD"`. */
export type Entry = {
  id: number;
  metricId: number;
  value: number;
  date: string;
};
