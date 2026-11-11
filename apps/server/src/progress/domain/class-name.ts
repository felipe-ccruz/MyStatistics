import type { ClassName, Progress } from "@mystatistics/shared";

/** Classe do jogador (D5). Lógica pura. */

/**
 * Pelo atributo dominante entre INT e STR, comparando os pontos já arredondados (os mesmos que
 * a tela mostra): INT maior → "Arcane Student"; STR maior → "Iron Warrior"; empate → "Adventurer".
 */
export function classNameOf({ int, str }: Pick<Progress["attributes"], "int" | "str">): ClassName {
  if (int > str) return "Arcane Student";
  if (str > int) return "Iron Warrior";
  return "Adventurer";
}
