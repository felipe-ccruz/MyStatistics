import { describe, expect, it } from "bun:test";
import { normalizeMetricName, normalizeMetricUnit } from "./metric-logic";

describe("normalizeMetricName", () => {
  it("tira os espaços das pontas e mantém os do meio", () => {
    expect(normalizeMetricName("  Body weight ")).toBe("Body weight");
    expect(normalizeMetricName("Weight")).toBe("Weight");
  });

  it("recusa nome só de espaços com 422 VALIDATION", () => {
    for (const name of [" ", "   ", "\t\n"]) {
      expect(() => normalizeMetricName(name)).toThrow(expect.objectContaining({ status: 422, apiCode: "VALIDATION" }));
    }
  });
});

describe("normalizeMetricUnit", () => {
  it("tira os espaços das pontas e aceita unidade vazia", () => {
    expect(normalizeMetricUnit(" kg ")).toBe("kg");
    expect(normalizeMetricUnit("")).toBe("");
    expect(normalizeMetricUnit("  ")).toBe("");
  });
});
