import type { MetricSummary } from "@mystatistics/shared";

/**
 * Estatística descritiva de uma lista de valores (ACCEPTANCE §5.5). Lógica pura — sem banco,
 * sem env. Nunca devolve `NaN` nem `Infinity`: o que não dá para calcular vem `null`.
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

  let min = Number.POSITIVE_INFINITY;
  let max = Number.NEGATIVE_INFINITY;
  for (const value of values) {
    if (value < min) min = value;
    if (value > max) max = value;
  }

  const enoughData = count >= MIN_VALUES_FOR_STATS;
  return { count, mean: enoughData ? meanOf(values) : null, min, max, enoughData };
}

/**
 * Média de todos os valores, ou `null` com a lista vazia (para a base da tendência, que pode ter
 * um ponto só). Média incremental (`média += v/n − média/n`): nenhum passo soma dois valores
 * enormes, então valores finitos perto de `Number.MAX_VALUE` não estouram para `Infinity` (que o
 * JSON serializaria como `null`).
 */
export function meanOf(values: readonly number[]): number | null {
  if (values.length === 0) return null;
  let mean = 0;
  let count = 0;
  for (const value of values) {
    count += 1;
    mean += value / count - mean / count;
  }
  return mean;
}

/**
 * Tendência da média atual contra a anterior: `null` quando uma das duas não existe.
 * `flat` quando as médias são iguais — com tolerância relativa ínfima, para o arredondamento do
 * ponto flutuante (ex.: 0,1 + 0,2) não virar "subiu". A diferença usa a metade de cada média, para
 * não estourar com médias enormes de sinais opostos.
 */
export function trendOf(currentMean: number | null, previousMean: number | null): Trend | null {
  if (currentMean === null || previousMean === null) return null;
  const halfDifference = currentMean / 2 - previousMean / 2;
  const halfTolerance = 0.5e-9 * Math.max(1, Math.abs(currentMean), Math.abs(previousMean));
  const direction = Math.abs(halfDifference) <= halfTolerance ? "flat" : halfDifference > 0 ? "up" : "down";
  return { direction, previousMean };
}
