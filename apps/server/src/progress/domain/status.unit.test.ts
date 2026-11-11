import { describe, expect, it } from "bun:test";
import { toDayMinutes } from "@/activities/domain/day-minutes";
import { statusOf } from "./status";

const TODAY = "2026-11-11";

describe("statusOf", () => {
  it("sem atividade: tudo 0", () => {
    expect(statusOf(toDayMinutes([]), TODAY)).toEqual({ mp: 0, sta: 0, mood: 0 });
  });

  it("MP é o study de hoje ÷ 90, com 100 no limite exato e sem passar de 100", () => {
    const mpOf = (minutes: number) => statusOf(toDayMinutes([{ date: TODAY, category: "study", minutes }]), TODAY).mp;

    expect(mpOf(45)).toBe(50);
    expect(mpOf(89)).toBe(99);
    expect(mpOf(90)).toBe(100);
    expect(mpOf(200)).toBe(100);
  });

  it("MP ignora o study de outros dias", () => {
    expect(statusOf(toDayMinutes([{ date: "2026-11-10", category: "study", minutes: 90 }]), TODAY).mp).toBe(0);
  });

  it("STA é a média de exercise dos últimos 7 dias (com hoje) ÷ 45", () => {
    const byDay = toDayMinutes([
      { date: "2026-11-05", category: "exercise", minutes: 45 },
      { date: TODAY, category: "exercise", minutes: 45 },
      // Fora da janela: 8 dias atrás.
      { date: "2026-11-04", category: "exercise", minutes: 300 },
    ]);

    // 90 ÷ 7 = 12,86 min/dia ÷ 45 = 28,6% → 29
    expect(statusOf(byDay, TODAY).sta).toBe(29);
  });

  it("STA vale 100 com 45 min em cada um dos 7 dias", () => {
    const rows = ["05", "06", "07", "08", "09", "10", "11"].map((day) => ({
      date: `2026-11-${day}`,
      category: "exercise" as const,
      minutes: 45,
    }));

    expect(statusOf(toDayMinutes(rows), TODAY).sta).toBe(100);
  });

  it("MOOD é a % das metas de hoje concluídas", () => {
    const moodOf = (study: number, exercise: number) =>
      statusOf(
        toDayMinutes([
          { date: TODAY, category: "study", minutes: study },
          { date: TODAY, category: "exercise", minutes: exercise },
        ]),
        TODAY,
      ).mood;

    expect(moodOf(0, 0)).toBe(0);
    expect(moodOf(90, 44)).toBe(50);
    expect(moodOf(89, 45)).toBe(50);
    expect(moodOf(90, 45)).toBe(100);
  });
});
