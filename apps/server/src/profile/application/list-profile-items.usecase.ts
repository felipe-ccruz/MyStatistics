import type { ProfileItem } from "@mystatistics/shared";
import type { SessionUser } from "@/auth/domain/auth.types";
import { MetricRepository } from "@/metrics/infra/metric.repository";
import { profileItemsOf } from "../domain/profile-item-logic";
import { ProfileItemRepository } from "../infra/profile-item.repository";

/**
 * Os itens que o usuário pode mostrar no portfólio, com o `visible` de cada um: progress, as
 * categorias de atividade e as métricas dele por nome. Sem escolha gravada, o item vem oculto.
 */
export async function listProfileItemsUseCase({ userId }: SessionUser): Promise<ProfileItem[]> {
  const [metrics, choices] = await Promise.all([
    MetricRepository.findAll(userId),
    ProfileItemRepository.findAll(userId),
  ]);
  return profileItemsOf(metrics, choices);
}
