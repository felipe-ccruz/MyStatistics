import { describe, expect, it } from "bun:test";
import { assertFiniteValue, resolveEntryDate } from "./entry-logic";

const TODAY = "2026-11-11";

describe("resolveEntryDate", () => {
  it("usa hoje quando a data não vem", () => {
    expect(resolveEntryDate(undefined, TODAY)).toBe(TODAY);
  });

  it("aceita hoje e dias anteriores", () => {
    expect(resolveEntryDate(TODAY, TODAY)).toBe(TODAY);
    expect(resolveEntryDate("2020-01-01", TODAY)).toBe("2020-01-01");
  });

  it("recusa o dia seguinte a hoje com 422 FUTURE_DATE", () => {
    for (const date of ["2026-11-12", "2027-01-01"]) {
      expect(() => resolveEntryDate(date, TODAY)).toThrow(
        expect.objectContaining({ status: 422, apiCode: "FUTURE_DATE" }),
      );
    }
  });

  it("recusa dia que não existe com 422 VALIDATION", () => {
    expect(() => resolveEntryDate("2026-02-31", TODAY)).toThrow(
      expect.objectContaining({ status: 422, apiCode: "VALIDATION" }),
    );
  });
});

describe("assertFiniteValue", () => {
  it("aceita números finitos, inclusive 0, negativo e fração", () => {
    for (const value of [0, -3, 79.5, 1e9]) expect(() => assertFiniteValue(value)).not.toThrow();
  });

  it("recusa NaN e infinito com 422 VALIDATION", () => {
    for (const value of [Number.NaN, Number.POSITIVE_INFINITY, Number.NEGATIVE_INFINITY]) {
      expect(() => assertFiniteValue(value)).toThrow(expect.objectContaining({ status: 422, apiCode: "VALIDATION" }));
    }
  });
});
