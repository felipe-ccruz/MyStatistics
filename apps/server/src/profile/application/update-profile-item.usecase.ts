import type { ProfileItem, UpdateProfileItem } from "@mystatistics/shared";
import type { SessionUser } from "@/auth/domain/auth.types";
import { MetricRepository } from "@/metrics/infra/metric.repository";
import { db, type Transaction } from "@/shared/infra/databases/postgres";
import { NotFoundError } from "@/shared/infra/errors/not-found-error";
import {
  CATEGORY_LABELS,
  isActivityCategory,
  metricIdOf,
  PROFILE_ITEM_NOT_FOUND_MESSAGE,
  PROGRESS_LABEL,
} from "../domain/profile-item-logic";
import { ProfileItemRepository } from "../infra/profile-item.repository";

type UpdateProfileItemInput = SessionUser & UpdateProfileItem;

/**
 * Mostra ou oculta um item do portfólio do usuário (upsert da escolha). Item que não existe para
 * ele → 404 `NOT_FOUND`: `ref` diferente de `""` em progress, categoria inválida, ou métrica
 * inexistente, apagada ou de outro usuário. Confere e grava na mesma transação.
 */
export async function updateProfileItemUseCase({
  userId,
  kind,
  ref,
  visible,
}: UpdateProfileItemInput): Promise<ProfileItem> {
  return db.transaction(async (tx) => {
    const label = await labelOf(userId, kind, ref, tx);
    if (label === null) throw new NotFoundError(PROFILE_ITEM_NOT_FOUND_MESSAGE);

    const row = await ProfileItemRepository.upsert({ userId, kind, ref, visible }, tx);
    return { kind: row.kind, ref: row.ref, label, visible: row.visible };
  });
}

/** O rótulo do item, ou `null` se ele não existe para o usuário. */
async function labelOf(
  userId: string,
  kind: UpdateProfileItem["kind"],
  ref: string,
  tx: Transaction,
): Promise<string | null> {
  switch (kind) {
    case "progress":
      return ref === "" ? PROGRESS_LABEL : null;
    case "activity_category":
      return isActivityCategory(ref) ? CATEGORY_LABELS[ref] : null;
    case "metric": {
      const metricId = metricIdOf(ref);
      if (metricId === null) return null;
      const metric = await MetricRepository.findById(userId, metricId, tx);
      return metric?.name ?? null;
    }
  }
}
