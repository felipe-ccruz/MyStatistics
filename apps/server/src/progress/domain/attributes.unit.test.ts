import { describe, expect, it } from "bun:test";
import { toDayMinutes } from "@/activities/domain/day-minutes";
import { daysEndingOn } from "@/shared/utils/calendar-day";
import { attributesOf, attributeWindowOf } from "./attributes";

const TODAY = "2026-11-11";
const NO_SESSIONS = { count: 0, totalMinutes: 0 };

describe("attributeWindowOf", () => {
  it("cobre os 30 dias que terminam hoje", () => {
    expect(attributeWindowOf(TODAY)).toEqual({ from: "2026-10-13", to: TODAY });
  });
});

describe("attributesOf", () => {
  it("sem atividade: tudo 0, sem dividir por zero", () => {
    expect(attributesOf(toDayMinutes([]), NO_SESSIONS, TODAY)).toEqual({
      int: 0,
      str: 0,
      focus: 0,
      discipline: 0,
      details: {
        studyMinutesPerDay: 0,
        exerciseMinutesPerDay: 0,
        averageStudySessionMinutes: 0,
        daysWithBothCategories: 0,
      },
    });
  });

  it("um dia só: divide pelos 30 dias da janela", () => {
    const byDay = toDayMinutes([
      { date: TODAY, category: "study", minutes: 90 },
      { date: TODAY, category: "exercise", minutes: 45 },
    ]);

    const attributes = attributesOf(byDay, { count: 1, totalMinutes: 90 }, TODAY);

    expect(attributes.details).toEqual({
      studyMinutesPerDay: 3,
      exerciseMinutesPerDay: 1.5,
      averageStudySessionMinutes: 90,
      daysWithBothCategories: 1,
    });
    // 3 ÷ 90 = 3,3% → 3 · 1,5 ÷ 45 = 3,3% → 3 · 90 ÷ 75 = 120% → 100 · 1 ÷ 30 = 3,3% → 3
    expect(attributes).toMatchObject({ int: 3, str: 3, focus: 100, discipline: 3 });
  });

  it("vale 100 no limite exato e não passa de 100", () => {
    const studyOn = (minutes: number) => toDayMinutes([{ date: TODAY, category: "study", minutes }]);
    const exerciseOn = (minutes: number) => toDayMinutes([{ date: TODAY, category: "exercise", minutes }]);

    // 1350 ÷ 30 = 45 min/dia = metade de 90 · 2700 ÷ 30 = 90 min/dia = o alvo
    expect(attributesOf(studyOn(1350), NO_SESSIONS, TODAY).int).toBe(50);
    expect(attributesOf(studyOn(2700), NO_SESSIONS, TODAY).int).toBe(100);
    expect(attributesOf(studyOn(9000), NO_SESSIONS, TODAY).int).toBe(100);
    // 1350 ÷ 30 = 45 min/dia = o alvo de exercise
    expect(attributesOf(exerciseOn(1350), NO_SESSIONS, TODAY).str).toBe(100);
    // Média de 75 min por atividade = o alvo de FOCUS
    expect(attributesOf(toDayMinutes([]), { count: 2, totalMinutes: 150 }, TODAY).focus).toBe(100);
    expect(attributesOf(toDayMinutes([]), { count: 1, totalMinutes: 500 }, TODAY).focus).toBe(100);
  });

  it("valores iguais todo dia: DISCIPLINE 100 com as duas categorias nos 30 dias", () => {
    const rows = daysEndingOn(TODAY, 30).flatMap((date) => [
      { date, category: "study" as const, minutes: 90 },
      { date, category: "exercise" as const, minutes: 45 },
    ]);

    const attributes = attributesOf(toDayMinutes(rows), { count: 30, totalMinutes: 2700 }, TODAY);

    expect(attributes).toMatchObject({ int: 100, str: 100, discipline: 100 });
    expect(attributes.details.daysWithBothCategories).toBe(30);
  });

  it("ignora o que está fora da janela de 30 dias", () => {
    const byDay = toDayMinutes([
      { date: "2026-10-12", category: "study", minutes: 900 },
      { date: "2026-11-12", category: "study", minutes: 900 },
      { date: "2026-10-13", category: "exercise", minutes: 30 },
    ]);

    const { details } = attributesOf(byDay, NO_SESSIONS, TODAY);

    expect(details.studyMinutesPerDay).toBe(0);
    expect(details.exerciseMinutesPerDay).toBe(1);
  });

  it("FOCUS usa a média por atividade, não por dia", () => {
    // Duas atividades study de 30 min no mesmo dia: média 30 (não 60).
    const byDay = toDayMinutes([{ date: TODAY, category: "study", minutes: 60 }]);

    const attributes = attributesOf(byDay, { count: 2, totalMinutes: 60 }, TODAY);

    expect(attributes.details.averageStudySessionMinutes).toBe(30);
    expect(attributes.focus).toBe(40);
  });

  it("DISCIPLINE só conta dia com as duas categorias", () => {
    const byDay = toDayMinutes([
      { date: "2026-11-09", category: "study", minutes: 10 },
      { date: "2026-11-10", category: "study", minutes: 10 },
      { date: "2026-11-10", category: "exercise", minutes: 10 },
      { date: TODAY, category: "exercise", minutes: 10 },
    ]);

    const attributes = attributesOf(byDay, NO_SESSIONS, TODAY);

    expect(attributes.details.daysWithBothCategories).toBe(1);
    expect(attributes.discipline).toBe(3);
  });
});
