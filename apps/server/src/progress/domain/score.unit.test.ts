import { describe, expect, it } from "bun:test";
import { toScore } from "./score";

describe("toScore", () => {
  it("converte a razão em pontos de 0 a 100, arredondados", () => {
    expect(toScore(45, 90)).toBe(50);
    expect(toScore(1, 3)).toBe(33);
    expect(toScore(2, 3)).toBe(67);
  });

  it("vale exatamente 100 no alvo e não passa de 100 acima dele", () => {
    expect(toScore(90, 90)).toBe(100);
    expect(toScore(500, 90)).toBe(100);
  });

  it("dá 0 sem valor, e não divide por zero", () => {
    expect(toScore(0, 90)).toBe(0);
    expect(toScore(10, 0)).toBe(0);
  });
});
