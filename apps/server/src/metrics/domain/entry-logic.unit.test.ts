import { describe, expect, it } from "bun:test";
import { assertFiniteValue } from "./entry-logic";

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
