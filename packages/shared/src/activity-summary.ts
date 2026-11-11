import { Type as t } from "@sinclair/typebox";
import type { ActivityCategory } from "./activity";

/** Períodos do resumo de atividades. Cada um termina hoje (inclusive): `7d` = hoje e os 6 dias anteriores. */
export const SUMMARY_PERIODS = ["7d", "30d"] as const;

export type SummaryPeriod = (typeof SUMMARY_PERIODS)[number];

/** Query de `GET /api/activities/summary?period=7d|30d`. O server valida com ESTE schema (`{ query: ... }`). */
export const ActivitySummaryQuery = t.Object({
  period: t.Union(SUMMARY_PERIODS.map((p) => t.Literal(p))),
});

export type ActivitySummaryQuery = typeof ActivitySummaryQuery.static;

/**
 * Resumo das atividades do usuário logado num período. Datas em `"YYYY-MM-DD"`.
 * Minutos são inteiros; `averagePerDay` é o total ÷ número de dias do período (pode ter fração).
 */
export type ActivitySummary = {
  period: SummaryPeriod;
  /** Primeiro dia do período. */
  from: string;
  /** Último dia do período (hoje). */
  to: string;
  totalMinutes: number;
  averagePerDay: number;
  /** Dias do período com pelo menos uma atividade. */
  activeDays: number;
  /** Total do período por categoria. */
  perCategory: Record<ActivityCategory, number>;
  /** Dia com mais minutos; `null` se o período não tem atividade. Empate → o mais recente. */
  bestDay: { date: string; totalMinutes: number } | null;
  trend: {
    /** Total do período anterior de mesmo tamanho. */
    previousTotalMinutes: number;
    /** Variação % do total vs. o período anterior; `null` quando o anterior tem 0 minutos. */
    changePercent: number | null;
  };
  /** Todos os dias do período, do mais antigo até hoje, com 0 nos dias sem atividade. */
  perDay: { date: string; minutes: Record<ActivityCategory, number> }[];
};
