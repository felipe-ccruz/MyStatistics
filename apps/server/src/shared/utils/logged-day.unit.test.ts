import { describe, expect, it } from "bun:test";
import { resolveLoggedDay } from "./logged-day";

const TODAY = "2026-11-11";

describe("resolveLoggedDay", () => {
  it("usa hoje quando a data não vem", () => {
    expect(resolveLoggedDay(undefined, TODAY)).toBe(TODAY);
  });

  it("aceita hoje e dias anteriores", () => {
    expect(resolveLoggedDay(TODAY, TODAY)).toBe(TODAY);
    expect(resolveLoggedDay("2020-01-01", TODAY)).toBe("2020-01-01");
  });

  it("recusa o dia seguinte a hoje com 422 FUTURE_DATE", () => {
    for (const date of ["2026-11-12", "2027-01-01"]) {
      expect(() => resolveLoggedDay(date, TODAY)).toThrow(
        expect.objectContaining({ status: 422, apiCode: "FUTURE_DATE" }),
      );
    }
  });

  it("recusa dia que não existe com 422 VALIDATION", () => {
    for (const date of ["2026-02-31", "2026-13-01", "2026-00-10"]) {
      expect(() => resolveLoggedDay(date, TODAY)).toThrow(
        expect.objectContaining({ status: 422, apiCode: "VALIDATION" }),
      );
    }
  });
});
