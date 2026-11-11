import { describe, expect, it } from "bun:test";
import { UnprocessableEntityError } from "@/shared/infra/errors/unprocessable-entity-error";
import { toDurationMinutes } from "./activity-logic";

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
