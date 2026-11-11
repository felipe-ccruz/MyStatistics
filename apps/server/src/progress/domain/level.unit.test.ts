import { describe, expect, it } from "bun:test";
import { type Rank, xpToNextLevel } from "@mystatistics/shared";
import { levelOf, rankOf } from "./level";

describe("levelOf", () => {
  it("começa no nível 1 com 0 XP", () => {
    expect(levelOf(0)).toEqual({ level: 1, xpCurrent: 0, xpNeeded: xpToNextLevel(1) });
  });

  it("vira de nível exatamente no XP necessário", () => {
    // Do 1 para o 2 são 300 XP.
    expect(levelOf(299)).toEqual({ level: 1, xpCurrent: 299, xpNeeded: 300 });
    expect(levelOf(300)).toEqual({ level: 2, xpCurrent: 0, xpNeeded: 400 });
    expect(levelOf(301)).toEqual({ level: 2, xpCurrent: 1, xpNeeded: 400 });
  });

  it("sobe vários níveis e guarda o resto dentro do atual", () => {
    // 300 (1→2) + 400 (2→3) + 500 (3→4) = 1200
    expect(levelOf(1200)).toEqual({ level: 4, xpCurrent: 0, xpNeeded: 600 });
    expect(levelOf(1250)).toEqual({ level: 4, xpCurrent: 50, xpNeeded: 600 });
  });
});

describe("rankOf", () => {
  it("segue as faixas E (1–4) · D (5–9) · C (10–14) · B (15–19) · A (20–29) · S (30+)", () => {
    const cases: [number, Rank][] = [
      [1, "E"],
      [4, "E"],
      [5, "D"],
      [9, "D"],
      [10, "C"],
      [14, "C"],
      [15, "B"],
      [19, "B"],
      [20, "A"],
      [29, "A"],
      [30, "S"],
      [99, "S"],
    ];

    for (const [level, rank] of cases) expect(rankOf(level)).toBe(rank);
  });
});
