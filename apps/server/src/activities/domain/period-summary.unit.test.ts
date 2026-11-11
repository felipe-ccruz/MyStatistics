import { describe, expect, it } from "bun:test";
import { toDayMinutes } from "./day-minutes";
import { periodSummaryOf, summaryRangeOf } from "./period-summary";

const TODAY = "2026-11-11";

describe("summaryRangeOf", () => {
  it("cobre o período anterior e o atual, terminando hoje", () => {
    expect(summaryRangeOf("7d", TODAY)).toEqual({ from: "2026-10-29", to: TODAY });
    expect(summaryRangeOf("30d", TODAY)).toEqual({ from: "2026-09-13", to: TODAY });
  });
});

describe("periodSummaryOf", () => {
  it("período vazio: zeros, bestDay null, changePercent null e todos os dias com 0", () => {
    const summary = periodSummaryOf("7d", toDayMinutes([]), TODAY);

    expect(summary).toMatchObject({
      period: "7d",
      from: "2026-11-05",
      to: TODAY,
      totalMinutes: 0,
      averagePerDay: 0,
      activeDays: 0,
      perCategory: { study: 0, exercise: 0 },
      bestDay: null,
      trend: { previousTotalMinutes: 0, changePercent: null },
    });
    expect(summary.perDay).toHaveLength(7);
    expect(summary.perDay[0]).toEqual({ date: "2026-11-05", minutes: { study: 0, exercise: 0 } });
    expect(summary.perDay.at(-1)?.date).toBe(TODAY);
  });

  it("30d traz os 30 dias, do mais antigo até hoje", () => {
    const summary = periodSummaryOf("30d", toDayMinutes([]), TODAY);

    expect(summary.from).toBe("2026-10-13");
    expect(summary.perDay).toHaveLength(30);
    expect(summary.perDay[0]?.date).toBe("2026-10-13");
  });

  it("um dia só: total, média pelos dias do período e melhor dia", () => {
    const byDay = toDayMinutes([
      { date: "2026-11-08", category: "study", minutes: 50 },
      { date: "2026-11-08", category: "exercise", minutes: 20 },
    ]);

    const summary = periodSummaryOf("7d", byDay, TODAY);

    expect(summary.totalMinutes).toBe(70);
    expect(summary.averagePerDay).toBe(10);
    expect(summary.activeDays).toBe(1);
    expect(summary.perCategory).toEqual({ study: 50, exercise: 20 });
    expect(summary.bestDay).toEqual({ date: "2026-11-08", totalMinutes: 70 });
    expect(summary.perDay.find((day) => day.date === "2026-11-08")?.minutes).toEqual({ study: 50, exercise: 20 });
  });

  it("empate no melhor dia fica com o mais recente", () => {
    const byDay = toDayMinutes([
      { date: "2026-11-06", category: "study", minutes: 40 },
      { date: "2026-11-09", category: "exercise", minutes: 40 },
      { date: "2026-11-07", category: "study", minutes: 10 },
    ]);

    expect(periodSummaryOf("7d", byDay, TODAY).bestDay).toEqual({ date: "2026-11-09", totalMinutes: 40 });
  });

  it("a média pode ter fração", () => {
    const byDay = toDayMinutes([{ date: TODAY, category: "study", minutes: 10 }]);

    expect(periodSummaryOf("7d", byDay, TODAY).averagePerDay).toBeCloseTo(10 / 7);
  });

  it("tendência compara com o período anterior de mesmo tamanho", () => {
    const byDay = toDayMinutes([
      // Período anterior do 7d: 29/10 a 04/11.
      { date: "2026-10-29", category: "study", minutes: 40 },
      { date: "2026-11-04", category: "exercise", minutes: 40 },
      // Antes do período anterior: não conta.
      { date: "2026-10-28", category: "study", minutes: 999 },
      // Período atual: 05/11 a 11/11.
      { date: "2026-11-05", category: "study", minutes: 60 },
      { date: TODAY, category: "exercise", minutes: 60 },
    ]);

    const summary = periodSummaryOf("7d", byDay, TODAY);

    expect(summary.totalMinutes).toBe(120);
    expect(summary.trend).toEqual({ previousTotalMinutes: 80, changePercent: 50 });
  });

  it("queda vira variação negativa; período atual vazio é -100%", () => {
    const byDay = toDayMinutes([{ date: "2026-11-01", category: "study", minutes: 30 }]);

    expect(periodSummaryOf("7d", byDay, TODAY).trend).toEqual({ previousTotalMinutes: 30, changePercent: -100 });
  });

  it("valores iguais nos dois períodos: variação 0", () => {
    const byDay = toDayMinutes([
      { date: "2026-11-01", category: "study", minutes: 30 },
      { date: "2026-11-10", category: "study", minutes: 30 },
    ]);

    expect(periodSummaryOf("7d", byDay, TODAY).trend.changePercent).toBe(0);
  });

  it("ignora dias depois de hoje", () => {
    const byDay = toDayMinutes([{ date: "2026-11-12", category: "study", minutes: 30 }]);

    expect(periodSummaryOf("7d", byDay, TODAY).totalMinutes).toBe(0);
  });
});
