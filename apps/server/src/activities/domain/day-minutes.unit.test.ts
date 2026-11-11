import { describe, expect, it } from "bun:test";
import { emptyCategoryMinutes, minutesOn, toDayMinutes, totalMinutesOf } from "./day-minutes";

describe("toDayMinutes", () => {
  it("agrupa por dia, com cada categoria no seu campo", () => {
    const byDay = toDayMinutes([
      { date: "2026-11-10", category: "study", minutes: 30 },
      { date: "2026-11-10", category: "exercise", minutes: 45 },
      { date: "2026-11-11", category: "study", minutes: 90 },
    ]);

    expect(byDay.get("2026-11-10")).toEqual({ study: 30, exercise: 45 });
    expect(byDay.get("2026-11-11")).toEqual({ study: 90, exercise: 0 });
    expect(byDay.size).toBe(2);
  });

  it("soma linhas repetidas do mesmo dia e categoria", () => {
    const byDay = toDayMinutes([
      { date: "2026-11-10", category: "study", minutes: 30 },
      { date: "2026-11-10", category: "study", minutes: 15 },
    ]);

    expect(byDay.get("2026-11-10")).toEqual({ study: 45, exercise: 0 });
  });

  it("lista vazia vira mapa vazio", () => {
    expect(toDayMinutes([]).size).toBe(0);
  });
});

describe("minutesOn", () => {
  it("devolve os minutos do dia, ou tudo 0 se o dia não tem atividade", () => {
    const byDay = toDayMinutes([{ date: "2026-11-10", category: "exercise", minutes: 20 }]);

    expect(minutesOn(byDay, "2026-11-10")).toEqual({ study: 0, exercise: 20 });
    expect(minutesOn(byDay, "2026-11-09")).toEqual(emptyCategoryMinutes());
  });
});

describe("totalMinutesOf", () => {
  it("soma as categorias", () => {
    expect(totalMinutesOf({ study: 30, exercise: 45 })).toBe(75);
    expect(totalMinutesOf(emptyCategoryMinutes())).toBe(0);
  });
});
