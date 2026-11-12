import type { MetricSummary } from "@mystatistics/shared";

/**
 * Estatística descritiva de uma lista de valores (ACCEPTANCE §5.5). Lógica pura — sem banco,
 * sem env. Nunca devolve `NaN`: o que não dá para calcular vem `null`.
 */

/** Menos que isto de valores e a média não diz nada: `enoughData` é `false` e `mean` vem `null`. */
export const MIN_VALUES_FOR_STATS = 2;

export type Summary = Pick<MetricSummary, "count" | "mean" | "min" | "max" | "enoughData">;

export type Trend = NonNullable<MetricSummary["trend"]>;

/**
 * - `count`: quantos valores;
 * - `min`/`max`: `null` só com a lista vazia (com um valor só, os dois são ele);
 * - `mean`: `null` com menos de `MIN_VALUES_FOR_STATS` valores (nunca a média de um ponto só);
 * - `enoughData`: `count >= MIN_VALUES_FOR_STATS`.
 */
export function summarize(values: readonly number[]): Summary {
  const count = values.length;
  if (count === 0) return { count, mean: null, min: null, max: null, enoughData: false };

  let sum = 0;
  let min = Number.POSITIVE_INFINITY;
  let max = Number.NEGATIVE_INFINITY;
  for (const value of values) {
    sum += value;
    if (value < min) min = value;
    if (value > max) max = value;
  }

  const enoughData = count >= MIN_VALUES_FOR_STATS;
  return { count, mean: enoughData ? sum / count : null, min, max, enoughData };
}

/** Média de todos os valores, ou `null` com a lista vazia (para a base da tendência, que pode ter um ponto só). */
export function meanOf(values: readonly number[]): number | null {
  if (values.length === 0) return null;
  return values.reduce((sum, value) => sum + value, 0) / values.length;
}

/**
 * Tendência da média atual contra a anterior: `null` quando uma das duas não existe.
 * `flat` quando as médias são iguais — com tolerância relativa ínfima, para o arredondamento do
 * ponto flutuante (ex.: 0,1 + 0,2) não virar "subiu".
 */
export function trendOf(currentMean: number | null, previousMean: number | null): Trend | null {
  if (currentMean === null || previousMean === null) return null;
  const tolerance = 1e-9 * Math.max(1, Math.abs(currentMean), Math.abs(previousMean));
  const difference = currentMean - previousMean;
  const direction = Math.abs(difference) <= tolerance ? "flat" : difference > 0 ? "up" : "down";
  return { direction, previousMean };
}
