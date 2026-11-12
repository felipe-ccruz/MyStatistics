import { describe, expect, it } from "bun:test";
import { isActivityCategory, isVisible, metricIdOf, metricRefOf, profileItemsOf } from "./profile-item-logic";

describe("profileItemsOf", () => {
  it("sem escolha gravada, tudo oculto: progress, as categorias e as métricas, nesta ordem", () => {
    const items = profileItemsOf(
      [
        { id: 7, name: "Mood" },
        { id: 3, name: "Weight" },
      ],
      [],
    );

    expect(items).toEqual([
      { kind: "progress", ref: "", label: "Progress", visible: false },
      { kind: "activity_category", ref: "study", label: "Study", visible: false },
      { kind: "activity_category", ref: "exercise", label: "Exercise", visible: false },
      { kind: "metric", ref: "7", label: "Mood", visible: false },
      { kind: "metric", ref: "3", label: "Weight", visible: false },
    ]);
  });

  it("usa o visible gravado e ignora escolha de item que não existe mais", () => {
    const items = profileItemsOf(
      [{ id: 3, name: "Weight" }],
      [
        { kind: "progress", ref: "", visible: true },
        { kind: "activity_category", ref: "study", visible: false },
        { kind: "metric", ref: "3", visible: true },
        { kind: "metric", ref: "99", visible: true }, // métrica apagada
      ],
    );

    expect(items.map((item) => [item.ref, item.visible])).toEqual([
      ["", true],
      ["study", false],
      ["exercise", false],
      ["3", true],
    ]);
  });
});

describe("isVisible", () => {
  it("só com escolha gravada e visible = true", () => {
    const choices = [
      { kind: "progress" as const, ref: "", visible: true },
      { kind: "metric" as const, ref: "3", visible: false },
    ];

    expect(isVisible(choices, "progress", "")).toBe(true);
    expect(isVisible(choices, "metric", "3")).toBe(false);
    expect(isVisible(choices, "activity_category", "study")).toBe(false);
  });
});

describe("metricIdOf / metricRefOf", () => {
  it("lê só a forma canônica do id", () => {
    expect(metricIdOf("12")).toBe(12);
    expect(metricIdOf(metricRefOf(2147483647))).toBe(2147483647);
  });

  it("recusa o que não é um id de métrica", () => {
    for (const ref of ["", "0", "012", "-1", "1.5", " 1", "1e3", "abc", "2147483648", "99999999999"]) {
      expect(metricIdOf(ref)).toBeNull();
    }
  });
});

describe("isActivityCategory", () => {
  it("aceita só as categorias do contrato", () => {
    expect(isActivityCategory("study")).toBe(true);
    expect(isActivityCategory("exercise")).toBe(true);
    expect(isActivityCategory("Study")).toBe(false);
    expect(isActivityCategory("")).toBe(false);
  });
});
