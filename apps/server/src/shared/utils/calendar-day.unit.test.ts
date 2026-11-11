import { describe, expect, it } from "bun:test";
import { addDaysISO, daysEndingOn, isCalendarDay, todayISO } from "./calendar-day";

describe("todayISO", () => {
  it("devolve uma data no formato YYYY-MM-DD", () => {
    expect(todayISO()).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });
});

describe("isCalendarDay", () => {
  it("aceita dias que existem, inclusive 29 de fevereiro em ano bissexto", () => {
    expect(isCalendarDay("2026-11-11")).toBe(true);
    expect(isCalendarDay("2028-02-29")).toBe(true);
  });

  it("recusa dia que não existe ou fora do formato", () => {
    for (const text of ["2026-02-31", "2026-02-29", "2026-13-01", "2026-00-10", "2026-11-1", "11/11/2026", ""]) {
      expect(isCalendarDay(text)).toBe(false);
    }
  });
});

describe("addDaysISO", () => {
  it("soma e subtrai dias atravessando mês e ano", () => {
    expect(addDaysISO("2026-11-11", 1)).toBe("2026-11-12");
    expect(addDaysISO("2026-11-01", -1)).toBe("2026-10-31");
    expect(addDaysISO("2026-12-31", 1)).toBe("2027-01-01");
    expect(addDaysISO("2028-02-28", 1)).toBe("2028-02-29");
  });

  it("devolve o mesmo dia com 0", () => {
    expect(addDaysISO("2026-11-11", 0)).toBe("2026-11-11");
  });
});

describe("daysEndingOn", () => {
  it("lista os dias do mais antigo até o último, inclusive", () => {
    expect(daysEndingOn("2026-11-02", 3)).toEqual(["2026-10-31", "2026-11-01", "2026-11-02"]);
  });

  it("com 1 dia devolve só o último; com 0, nada", () => {
    expect(daysEndingOn("2026-11-11", 1)).toEqual(["2026-11-11"]);
    expect(daysEndingOn("2026-11-11", 0)).toEqual([]);
  });

  it("não pula nem repete dia na troca de horário de verão", () => {
    const days = daysEndingOn("2026-11-10", 30);

    expect(days).toHaveLength(30);
    expect(new Set(days).size).toBe(30);
    expect(days[0]).toBe("2026-10-12");
  });
});
