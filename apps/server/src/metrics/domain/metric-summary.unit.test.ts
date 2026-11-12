import { describe, expect, it } from "bun:test";
import { metricSummaryOf, metricSummaryRangeOf } from "./metric-summary";

const TODAY = "2026-11-11";

describe("metricSummaryRangeOf", () => {
  it("cobre o período anterior e o atual, terminando hoje; all não tem limite", () => {
    expect(metricSummaryRangeOf("7d", TODAY)).toEqual({ from: "2026-10-29", to: TODAY });
    expect(metricSummaryRangeOf("30d", TODAY)).toEqual({ from: "2026-09-13", to: TODAY });
    expect(metricSummaryRangeOf("all", TODAY)).toEqual({});
  });
});

describe("metricSummaryOf", () => {
  it("sem registros: contagem 0, tudo null", () => {
    expect(metricSummaryOf("7d", [], TODAY)).toEqual({
      period: "7d",
      count: 0,
      mean: null,
      min: null,
      max: null,
      trend: null,
      enoughData: false,
    });
  });

  it("7d conta só de 05/11 a hoje e compara a média com 29/10 a 04/11", () => {
    const entries = [
      { date: "2026-10-28", value: 999 }, // antes do período anterior
      { date: "2026-10-29", value: 82 },
      { date: "2026-11-04", value: 80 },
      { date: "2026-11-05", value: 79 },
      { date: TODAY, value: 78 },
    ];

    expect(metricSummaryOf("7d", entries, TODAY)).toEqual({
      period: "7d",
      count: 2,
      mean: 78.5,
      min: 78,
      max: 79,
      trend: { direction: "down", previousMean: 81 },
      enoughData: true,
    });
  });

  it("um registro só no período: sem média e sem tendência, mas com min e max", () => {
    const entries = [
      { date: "2026-11-01", value: 70 },
      { date: TODAY, value: 72 },
    ];

    expect(metricSummaryOf("7d", entries, TODAY)).toMatchObject({
      count: 1,
      mean: null,
      min: 72,
      max: 72,
      trend: null,
      enoughData: false,
    });
  });

  it("sem registro no período anterior: tendência null", () => {
    const entries = [
      { date: "2026-11-10", value: 1 },
      { date: TODAY, value: 2 },
    ];

    expect(metricSummaryOf("7d", entries, TODAY).trend).toBeNull();
  });

  it("um registro no anterior já basta de base para a tendência", () => {
    const entries = [
      { date: "2026-10-01", value: 5 }, // período anterior do 30d: 13/09 a 12/10
      { date: "2026-11-01", value: 5 },
      { date: TODAY, value: 5 },
    ];

    expect(metricSummaryOf("30d", entries, TODAY).trend).toEqual({ direction: "flat", previousMean: 5 });
  });

  it("all usa todos os registros e não tem tendência", () => {
    const entries = [
      { date: "2020-01-01", value: -2 },
      { date: "2026-11-01", value: 4 },
    ];

    expect(metricSummaryOf("all", entries, TODAY)).toEqual({
      period: "all",
      count: 2,
      mean: 1,
      min: -2,
      max: 4,
      trend: null,
      enoughData: true,
    });
  });
});
