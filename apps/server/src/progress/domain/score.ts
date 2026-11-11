/**
 * Escala comum de status e atributos do progresso: inteiro de 0 a 100. Lógica pura.
 */

/** `value ÷ target` em pontos de 0 a 100: arredondado e limitado a 100 (nunca negativo). */
export function toScore(value: number, target: number): number {
  if (target <= 0 || value <= 0) return 0;
  return Math.min(100, Math.round((value / target) * 100));
}
