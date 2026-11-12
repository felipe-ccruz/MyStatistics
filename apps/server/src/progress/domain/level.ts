import { type Progress, RANK_MIN_LEVEL, RANKS, type Rank, xpToNextLevel } from "@mystatistics/shared/progress";

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

/** O maior rank cuja faixa começa no nível dado ou antes (`RANK_MIN_LEVEL`, do contrato). */
export function rankOf(level: number): Rank {
  let rank: Rank = "E";
  for (const candidate of RANKS) {
    if (level >= RANK_MIN_LEVEL[candidate]) rank = candidate;
  }
  return rank;
}
