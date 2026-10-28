import { describe, expect, it } from "bun:test";
import { toDurationMinutes, todayISO } from "./activity-logic";
import { UnprocessableEntityError } from "@/shared/infra/errors/unprocessable-entity-error";

describe("toDurationMinutes", () => {
  it("soma horas e minutos em minutos totais", () => {
    expect(toDurationMinutes(1, 30)).toBe(90);
    expect(toDurationMinutes(0, 45)).toBe(45);
    expect(toDurationMinutes(2, 0)).toBe(120);
  });

  it("rejeita duração zero", () => {
    expect(() => toDurationMinutes(0, 0)).toThrow(UnprocessableEntityError);
  });
});

describe("todayISO", () => {
  it("devolve uma data no formato YYYY-MM-DD", () => {
    expect(todayISO()).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });
});
