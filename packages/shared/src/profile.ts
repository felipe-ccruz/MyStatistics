/**
 * Perfil e portfólio público (ACCEPTANCE §5.1.2, decisão D9).
 *
 * O dono escolhe item a item o que o portfólio mostra. **Sem escolha explícita, o item
 * é oculto** — inclusive os criados depois de o perfil virar público. O visitante vê
 * só agregados (resumos), nunca registros nem atividades individuais.
 * Arquivo puro; os schemas de body moram em ./profile-schema.
 */
import type { ActivityCategory } from "./activity";
import type { ActivitySummary } from "./activity-summary";
import type { Me } from "./auth";
import type { MetricSummary } from "./metric-summary";
import type { Progress } from "./progress";

/** O perfil do usuário logado (o mesmo de `Me["profile"]`). */
export type Profile = Me["profile"];

/**
 * Tipos de item que o portfólio pode expor:
 * - `progress`: o card de progresso (nível, XP, rank, classe, streak, status, atributos). `ref` = `""`.
 * - `activity_category`: os resumos de uma categoria de atividade. `ref` = a categoria (`"study"`, `"exercise"`).
 * - `metric`: o resumo de 30 dias de uma métrica. `ref` = o id da métrica, em texto (`"12"`).
 */
export const PROFILE_ITEM_KINDS = ["progress", "activity_category", "metric"] as const;

export type ProfileItemKind = (typeof PROFILE_ITEM_KINDS)[number];

/** Um item que o dono pode mostrar ou ocultar, como `GET /api/profile/items` devolve. */
export type ProfileItem = {
  kind: ProfileItemKind;
  ref: string;
  /** Rótulo pronto para a UI (ex.: "Progress", "Study", o nome da métrica). */
  label: string;
  visible: boolean;
};

/**
 * Portfólio como o visitante recebe em `GET /api/public/profiles/:slug`.
 * Item oculto **não aparece** no JSON: a chave fica ausente ou o item fica fora do array.
 */
export type PublicProfile = {
  slug: string;
  progress?: Progress;
  activities?: {
    category: ActivityCategory;
    /** Resumo só daquela categoria (os minutos das outras vêm 0). */
    summary7d: ActivitySummary;
    summary30d: ActivitySummary;
  }[];
  metrics?: {
    name: string;
    unit: string;
    summary30d: MetricSummary;
  }[];
};
