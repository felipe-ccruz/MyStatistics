import type { Activity, UpdateActivity } from "@mystatistics/shared";
import type { SessionUser } from "@/auth/domain/auth.types";
import { db } from "@/shared/infra/databases/postgres";
import { NotFoundError } from "@/shared/infra/errors/not-found-error";
import { UnprocessableEntityError } from "@/shared/infra/errors/unprocessable-entity-error";
import { todayISO } from "@/shared/utils/calendar-day";
import { resolveLoggedDay } from "@/shared/utils/logged-day";
import { toActivity } from "../domain/activity.mapper";
import type { ActivityIdParams } from "../domain/activity.types";
import { toDurationMinutes, updatedSubjectOf } from "../domain/activity-logic";
import { type ActivityChanges, ActivityRepository } from "../infra/activity.repository";

type UpdateActivityInput = SessionUser & ActivityIdParams & UpdateActivity;

/**
 * Atualização parcial da atividade do usuário: só muda o que veio no body. `hours` e `minutes`
 * vêm juntos (ou nenhum), porque a duração é recalculada a partir dos dois; body sem nada a mudar
 * responde 422. Atividade inexistente ou de outro usuário responde 404 `NOT_FOUND`.
 * `subject: null` remove a matéria; matéria final fora de `study` → 422 `SUBJECT_NOT_ALLOWED`
 * (ex.: mudar para `exercise` uma atividade com matéria sem mandar `subject: null` junto).
 * `date` que não existe → 422 `VALIDATION`; depois de hoje → 422 `FUTURE_DATE`.
 * Lê com a linha travada (`for update`) e escreve na mesma transação: dois PATCH ao mesmo tempo
 * viram um depois do outro, e a regra da matéria é conferida contra a versão que vai ser escrita
 * (sem isso, sobrava um `exercise` com matéria). Também não atualiza uma linha apagada no meio.
 */
export async function updateActivityUseCase({ userId, id, ...input }: UpdateActivityInput): Promise<Activity> {
  return db.transaction(async (tx) => {
    const current = await ActivityRepository.findByIdForUpdate(userId, id, tx);
    if (!current) throw new NotFoundError("Activity not found.");

    const changes: ActivityChanges = {};
    if (input.category !== undefined) changes.category = input.category;
    if (input.date !== undefined) changes.date = resolveLoggedDay(input.date, todayISO());

    if (input.hours !== undefined && input.minutes !== undefined) {
      changes.durationMinutes = toDurationMinutes(input.hours, input.minutes);
    } else if (input.hours !== undefined || input.minutes !== undefined) {
      throw new UnprocessableEntityError("Send hours and minutes together to change the duration.", "INVALID_DURATION");
    }

    const subject = updatedSubjectOf(current, input);
    if (input.subject !== undefined) changes.subject = subject;

    if (Object.keys(changes).length === 0) {
      throw new UnprocessableEntityError("Nothing to update.", "EMPTY_UPDATE");
    }

    const row = await ActivityRepository.update(userId, id, changes, tx);
    return toActivity(row);
  });
}
