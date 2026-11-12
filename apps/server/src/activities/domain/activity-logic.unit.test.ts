import { describe, expect, it } from "bun:test";
import { UnprocessableEntityError } from "@/shared/infra/errors/unprocessable-entity-error";
import { assertSubjectAllowed, normalizeSubject, toDurationMinutes, updatedSubjectOf } from "./activity-logic";

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

describe("normalizeSubject", () => {
  it("tira os espaços das pontas", () => {
    expect(normalizeSubject("  Linear Algebra ")).toBe("Linear Algebra");
  });

  it("rejeita matéria só de espaços com VALIDATION", () => {
    expect(() => normalizeSubject("   ")).toThrow(expect.objectContaining({ apiCode: "VALIDATION" }));
  });
});

describe("assertSubjectAllowed", () => {
  it("aceita matéria em study e qualquer categoria sem matéria", () => {
    expect(() => assertSubjectAllowed("study", "Calculus")).not.toThrow();
    expect(() => assertSubjectAllowed("study", null)).not.toThrow();
    expect(() => assertSubjectAllowed("exercise", null)).not.toThrow();
  });

  it("rejeita matéria em exercise com SUBJECT_NOT_ALLOWED", () => {
    expect(() => assertSubjectAllowed("exercise", "Running")).toThrow(
      expect.objectContaining({ status: 422, apiCode: "SUBJECT_NOT_ALLOWED" }),
    );
  });
});

describe("updatedSubjectOf", () => {
  const study = { category: "study" as const, subject: "Calculus" };

  it("sem subject no body mantém a atual", () => {
    expect(updatedSubjectOf(study, {})).toBe("Calculus");
  });

  it("null remove e texto troca (normalizado)", () => {
    expect(updatedSubjectOf(study, { subject: null })).toBeNull();
    expect(updatedSubjectOf(study, { subject: " Physics " })).toBe("Physics");
  });

  it("mudar para exercise exige remover a matéria", () => {
    expect(() => updatedSubjectOf(study, { category: "exercise" })).toThrow(
      expect.objectContaining({ apiCode: "SUBJECT_NOT_ALLOWED" }),
    );
    expect(updatedSubjectOf(study, { category: "exercise", subject: null })).toBeNull();
  });

  it("matéria nova numa atividade exercise é recusada", () => {
    expect(() => updatedSubjectOf({ category: "exercise", subject: null }, { subject: "Running" })).toThrow(
      expect.objectContaining({ apiCode: "SUBJECT_NOT_ALLOWED" }),
    );
  });
});
