import { ACTIVITY_CATEGORIES, type PublicProfile } from "@mystatistics/shared";
import { getActivitySummaryUseCase } from "@/activities/application/get-activity-summary.usecase";
import { ProfileRepository } from "@/auth/infra/profile.repository";
import { getMetricSummaryUseCase } from "@/metrics/application/get-metric-summary.usecase";
import { MetricRepository } from "@/metrics/infra/metric.repository";
import { getProgressUseCase } from "@/progress/application/get-progress.usecase";
import { NotFoundError } from "@/shared/infra/errors/not-found-error";
import { todayISO } from "@/shared/utils/calendar-day";
import { isVisible, metricRefOf, PROFILE_NOT_FOUND_MESSAGE } from "../domain/profile-item-logic";
import { ProfileItemRepository } from "../infra/profile-item.repository";

type GetPublicProfileInput = {
  slug: string;
  /** Dia usado como "hoje". Padrão: o dia de calendário do server; os testes fixam um dia. */
  today?: string;
};

/**
 * Portfólio público de um perfil, sem login. Slug inexistente **ou** perfil privado → o mesmo 404
 * `PROFILE_NOT_FOUND`, com a mesma mensagem: não dá para descobrir que o perfil existe.
 *
 * Só os itens visíveis entram, e só como agregado (os mesmos use cases das rotas do dono):
 * - `progress`: o mesmo do `GET /api/progress`;
 * - `activities`: por categoria visível, os resumos de 7 e 30 dias só daquela categoria;
 * - `metrics`: por métrica visível, por nome, o resumo de 30 dias.
 * Tipo sem nenhum item visível fica fora do JSON (chave ausente). Quem pede não importa: não há
 * sessão aqui, então o visitante logado (ou o dono) recebe o mesmo que o anônimo.
 */
export async function getPublicProfileUseCase({
  slug,
  today = todayISO(),
}: GetPublicProfileInput): Promise<PublicProfile> {
  const profile = await ProfileRepository.findBySlug(slug);
  // Inexistente (`null`) ou privado: a mesma resposta.
  if (profile?.visibility !== "public") {
    throw new NotFoundError(PROFILE_NOT_FOUND_MESSAGE, "PROFILE_NOT_FOUND");
  }

  const { userId } = profile;
  const choices = await ProfileItemRepository.findAll(userId);
  const result: PublicProfile = { slug: profile.slug };

  if (isVisible(choices, "progress", "")) result.progress = await getProgressUseCase({ userId, today });

  const categories = ACTIVITY_CATEGORIES.filter((category) => isVisible(choices, "activity_category", category));
  if (categories.length > 0) {
    result.activities = await Promise.all(
      categories.map(async (category) => ({
        category,
        summary7d: await getActivitySummaryUseCase({ userId, period: "7d", today, category }),
        summary30d: await getActivitySummaryUseCase({ userId, period: "30d", today, category }),
      })),
    );
  }

  const metrics = (await MetricRepository.findAll(userId)).filter((metric) =>
    isVisible(choices, "metric", metricRefOf(metric.id)),
  );
  if (metrics.length > 0) {
    result.metrics = await Promise.all(
      metrics.map(async (metric) => ({
        name: metric.name,
        unit: metric.unit,
        summary30d: await getMetricSummaryUseCase({ userId, metricId: metric.id, period: "30d", today }),
      })),
    );
  }

  return result;
}
