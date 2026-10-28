import type { Activity, UpdateActivity } from "@mystatistics/shared";
import { db } from "@/shared/infra/databases/postgres";
import { NotFoundError } from "@/shared/infra/errors/not-found-error";
import { UnprocessableEntityError } from "@/shared/infra/errors/unprocessable-entity-error";
import { toDurationMinutes } from "../domain/activity-logic";
import { toActivity } from "../domain/activity.mapper";
import type { ActivityIdParams } from "../domain/activity.types";
import { ActivityRepository, type ActivityChanges } from "../infra/activity.repository";

type UpdateActivityInput = ActivityIdParams & UpdateActivity;

/**
 * Atualização parcial: só muda o que veio no body. `hours` e `minutes` vêm juntos (ou nenhum),
 * porque a duração é recalculada a partir dos dois; body sem nada a mudar responde 422.
 * Lê e escreve na mesma transação, para não atualizar uma linha apagada no meio do caminho.
 */
export async function updateActivityUseCase({ id, ...input }: UpdateActivityInput): Promise<Activity> {
  return db.transaction(async (tx) => {
    const current = await ActivityRepository.findById(id, tx);
    if (!current) throw new NotFoundError("Atividade não encontrada.");

    const changes: ActivityChanges = {};
    if (input.category !== undefined) changes.category = input.category;
    if (input.date !== undefined) changes.date = input.date;

    if (input.hours !== undefined && input.minutes !== undefined) {
      changes.durationMinutes = toDurationMinutes(input.hours, input.minutes);
    } else if (input.hours !== undefined || input.minutes !== undefined) {
      throw new UnprocessableEntityError("Informe horas e minutos juntos para alterar a duração.", "INVALID_DURATION");
    }

    if (Object.keys(changes).length === 0) {
      throw new UnprocessableEntityError("Nada para atualizar.", "EMPTY_UPDATE");
    }

    const row = await ActivityRepository.update(id, changes, tx);
    return toActivity(row);
  });
}
