import { describe, expect, it } from "bun:test";
import { todayISO } from "./calendar-day";

describe("todayISO", () => {
  it("devolve uma data no formato YYYY-MM-DD", () => {
    expect(todayISO()).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });
});
