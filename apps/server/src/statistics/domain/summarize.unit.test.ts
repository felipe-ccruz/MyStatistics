import { describe, expect, it } from "bun:test";
import { meanOf, summarize, trendOf } from "./summarize";

describe("summarize", () => {
  it("lista vazia: contagem 0, tudo null e sem dados suficientes", () => {
    expect(summarize([])).toEqual({ count: 0, mean: null, min: null, max: null, enoughData: false });
  });

  it("um elemento: min e max são ele, mas sem média (nunca a média de um ponto só)", () => {
    expect(summarize([80])).toEqual({ count: 1, mean: null, min: 80, max: 80, enoughData: false });
  });

  it("valores iguais: média, min e max iguais", () => {
    expect(summarize([5, 5, 5])).toEqual({ count: 3, mean: 5, min: 5, max: 5, enoughData: true });
  });

  it("negativos", () => {
    expect(summarize([-3, -1, -8])).toEqual({ count: 3, mean: -4, min: -8, max: -1, enoughData: true });
  });

  it("caso normal, com fração e fora de ordem", () => {
    expect(summarize([80, 79.5, 81, 78.5])).toEqual({
      count: 4,
      mean: 79.75,
      min: 78.5,
      max: 81,
      enoughData: true,
    });
  });

  it("nunca devolve NaN", () => {
    for (const values of [[], [1], [0, 0]]) {
      const summary = summarize(values);
      expect(Object.values(summary).some((value) => Number.isNaN(value))).toBe(false);
    }
  });
});

describe("meanOf", () => {
  it("média de qualquer quantidade de valores; null com a lista vazia", () => {
    expect(meanOf([])).toBeNull();
    expect(meanOf([7])).toBe(7);
    expect(meanOf([1, 2])).toBe(1.5);
  });
});

describe("trendOf", () => {
  it("up, down e flat comparando as médias", () => {
    expect(trendOf(80, 79)).toEqual({ direction: "up", previousMean: 79 });
    expect(trendOf(78, 79)).toEqual({ direction: "down", previousMean: 79 });
    expect(trendOf(79, 79)).toEqual({ direction: "flat", previousMean: 79 });
  });

  it("flat apesar do arredondamento do ponto flutuante", () => {
    expect(trendOf((0.1 + 0.2) / 2, 0.15)?.direction).toBe("flat");
  });

  it("null quando falta uma das médias", () => {
    expect(trendOf(null, 79)).toBeNull();
    expect(trendOf(80, null)).toBeNull();
  });
});
