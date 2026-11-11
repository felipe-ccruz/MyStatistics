import { describe, expect, it } from "bun:test";
import { toDayMinutes } from "@/activities/domain/day-minutes";
import { streakOf } from "./streak";

const TODAY = "2026-11-11";

/** Um dia com 30 min de study em cada data. */
function activeOn(...dates: string[]) {
  return toDayMinutes(dates.map((date) => ({ date, category: "study" as const, minutes: 30 })));
}

describe("streakOf", () => {
  it("sem atividade: 0 de streak, 0 de recorde e a semana toda inativa", () => {
    const streak = streakOf(activeOn(), TODAY);

    expect(streak.current).toBe(0);
    expect(streak.best).toBe(0);
    expect(streak.week).toHaveLength(7);
    expect(streak.week.every((day) => !day.active)).toBe(true);
  });

  it("um dia só, hoje: 1 de streak e de recorde", () => {
    const streak = streakOf(activeOn(TODAY), TODAY);

    expect(streak.current).toBe(1);
    expect(streak.best).toBe(1);
  });

  it("conta os dias seguidos terminando hoje", () => {
    expect(streakOf(activeOn("2026-11-09", "2026-11-10", TODAY), TODAY).current).toBe(3);
  });

  it("se hoje ainda não tem atividade, conta a partir de ontem", () => {
    expect(streakOf(activeOn("2026-11-09", "2026-11-10"), TODAY).current).toBe(2);
  });

  it("buraco antes de ontem zera o streak", () => {
    expect(streakOf(activeOn("2026-11-08", "2026-11-09"), TODAY).current).toBe(0);
  });

  it("o recorde é a maior sequência da história, mesmo que já tenha acabado", () => {
    const streak = streakOf(
      activeOn("2026-10-01", "2026-10-02", "2026-10-03", "2026-10-04", "2026-11-10", TODAY),
      TODAY,
    );

    expect(streak.current).toBe(2);
    expect(streak.best).toBe(4);
  });

  it("a sequência atravessa a virada do mês", () => {
    const streak = streakOf(activeOn("2026-10-31", "2026-11-01"), "2026-11-01");

    expect(streak.current).toBe(2);
    expect(streak.best).toBe(2);
  });

  it("ignora dia com 0 minutos", () => {
    const byDay = toDayMinutes([{ date: TODAY, category: "study", minutes: 0 }]);

    expect(streakOf(byDay, TODAY).current).toBe(0);
  });

  it("week: os últimos 7 dias, do mais antigo até hoje", () => {
    const streak = streakOf(activeOn("2026-11-05", "2026-11-10"), TODAY);

    expect(streak.week).toEqual([
      { date: "2026-11-05", active: true },
      { date: "2026-11-06", active: false },
      { date: "2026-11-07", active: false },
      { date: "2026-11-08", active: false },
      { date: "2026-11-09", active: false },
      { date: "2026-11-10", active: true },
      { date: "2026-11-11", active: false },
    ]);
  });
});
