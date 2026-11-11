import { type Progress, RANKS, type Rank, xpToNextLevel } from "@mystatistics/shared";

/** Nível e rank (D5). Lógica pura. */

export type LevelProgress = Pick<Progress, "level" | "xpCurrent" | "xpNeeded">;

/**
 * Nível a partir do XP total: começa no 1 e sobe enquanto o XP restante ≥ `xpToNextLevel(nível)`.
 * O que sobra é o XP dentro do nível atual.
 */
export function levelOf(xpTotal: number): LevelProgress {
  let level = 1;
  let rest = Math.max(0, xpTotal);
  while (rest >= xpToNextLevel(level)) {
    rest -= xpToNextLevel(level);
    level += 1;
  }
  return { level, xpCurrent: rest, xpNeeded: xpToNextLevel(level) };
}

/**
 * Primeiro nível de cada rank: E (1–4) · D (5–9) · C (10–14) · B (15–19) · A (20–29) · S (30+),
 * como no comentário de `RANKS` (o contrato só traz a ordem dos ranks, não as faixas).
 */
const RANK_MIN_LEVEL: Record<Rank, number> = { E: 1, D: 5, C: 10, B: 15, A: 20, S: 30 };

/** O maior rank cuja faixa começa no nível dado ou antes. */
export function rankOf(level: number): Rank {
  let rank: Rank = "E";
  for (const candidate of RANKS) {
    if (level >= RANK_MIN_LEVEL[candidate]) rank = candidate;
  }
  return rank;
}
