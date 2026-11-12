import {
  ACTIVITY_CATEGORIES,
  type ActivityCategory,
  type ProfileItem,
  type ProfileItemKind,
} from "@mystatistics/shared";
import { MAX_INTEGER_ID } from "@/shared/infra/id-param";

/** Regras puras dos itens do portfólio — sem banco, sem env. */

/** Item que não existe para o usuário (categoria inválida, métrica de outro usuário ou apagada…). */
export const PROFILE_ITEM_NOT_FOUND_MESSAGE = "Profile item not found.";

/** Slug inexistente ou perfil privado: a mesma mensagem nos dois casos. */
export const PROFILE_NOT_FOUND_MESSAGE = "Profile not found.";

export const PROGRESS_LABEL = "Progress";

/** Rótulo de cada categoria de atividade, pronto para a UI. */
export const CATEGORY_LABELS: Record<ActivityCategory, string> = { study: "Study", exercise: "Exercise" };

/** O que o portfólio precisa saber de uma métrica para listar o item dela. */
export type MetricRef = { id: number; name: string };

/** A escolha gravada de um item (a linha de `profile_items`, sem o dono). */
export type ItemChoice = { kind: ProfileItemKind; ref: string; visible: boolean };

/** Chave de um item, para achar a escolha gravada dele. */
function keyOf(kind: ProfileItemKind, ref: string): string {
  return `${kind}:${ref}`;
}

/** `true` só se há uma escolha gravada com `visible = true`. **Sem linha = oculto.** */
export function isVisible(choices: readonly ItemChoice[], kind: ProfileItemKind, ref: string): boolean {
  return choices.some((choice) => choice.kind === kind && choice.ref === ref && choice.visible);
}

/**
 * Todos os itens que o usuário pode expor, nesta ordem: progress, as categorias na ordem de
 * `ACTIVITY_CATEGORIES` e as métricas na ordem recebida (por nome). O `visible` vem da escolha
 * gravada; escolha de item que não existe mais (ex.: métrica apagada) é ignorada.
 */
export function profileItemsOf(metrics: readonly MetricRef[], choices: readonly ItemChoice[]): ProfileItem[] {
  const visible = new Set(choices.filter((choice) => choice.visible).map((choice) => keyOf(choice.kind, choice.ref)));
  const item = (kind: ProfileItemKind, ref: string, label: string): ProfileItem => ({
    kind,
    ref,
    label,
    visible: visible.has(keyOf(kind, ref)),
  });

  return [
    item("progress", "", PROGRESS_LABEL),
    ...ACTIVITY_CATEGORIES.map((category) => item("activity_category", category, CATEGORY_LABELS[category])),
    ...metrics.map((metric) => item("metric", metricRefOf(metric.id), metric.name)),
  ];
}

/** O `ref` de uma métrica: o id em texto (`12` → `"12"`). */
export function metricRefOf(id: number): string {
  return String(id);
}

/**
 * O id da métrica a partir do `ref`, só na forma canônica (`"12"`, sem zero à esquerda, sinal,
 * fração nem espaço) e dentro do `integer` do Postgres; senão `null` (o item não existe).
 */
export function metricIdOf(ref: string): number | null {
  if (!/^[1-9]\d{0,9}$/.test(ref)) return null;
  const id = Number(ref);
  return id <= MAX_INTEGER_ID ? id : null;
}

/** `true` se o texto é uma categoria de atividade. */
export function isActivityCategory(ref: string): ref is ActivityCategory {
  return (ACTIVITY_CATEGORIES as readonly string[]).includes(ref);
}
