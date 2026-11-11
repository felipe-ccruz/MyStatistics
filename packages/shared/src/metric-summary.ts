import { Type as t } from "@sinclair/typebox";

/** Períodos do resumo de métrica. `7d`/`30d` terminam hoje (inclusive); `all` é a história inteira. */
export const METRIC_SUMMARY_PERIODS = ["7d", "30d", "all"] as const;

export type MetricSummaryPeriod = (typeof METRIC_SUMMARY_PERIODS)[number];

/** Query de `GET /api/metrics/:id/summary?period=7d|30d|all`. O server valida com ESTE schema. */
export const MetricSummaryQuery = t.Object({
  period: t.Union(METRIC_SUMMARY_PERIODS.map((p) => t.Literal(p))),
});

export type MetricSummaryQuery = typeof MetricSummaryQuery.static;

/**
 * Estatísticas dos registros de uma métrica num período (ACCEPTANCE §5.5).
 *
 * - `enoughData` é `false` com menos de 2 registros: aí `mean` e `trend` vêm `null`
 *   (a UI mostra "Not enough data yet", nunca a média de um ponto só nem `NaN`).
 * - `min`/`max` são `null` só quando não há registro.
 * - `trend` compara a média do período com a do período anterior de mesmo tamanho;
 *   é `null` se não há dados suficientes, se o anterior não tem registro, ou se `period = "all"`.
 *   `direction` é `"flat"` quando as médias são iguais.
 */
export type MetricSummary = {
  period: MetricSummaryPeriod;
  count: number;
  mean: number | null;
  min: number | null;
  max: number | null;
  trend: { direction: "up" | "down" | "flat"; previousMean: number } | null;
  enoughData: boolean;
};
