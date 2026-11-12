import type { CreateEntry, Entry } from "@mystatistics/shared";
import type { SessionUser } from "@/auth/domain/auth.types";
import { db } from "@/shared/infra/databases/postgres";
import { isForeignKeyViolation } from "@/shared/infra/databases/postgres-errors";
import { NotFoundError } from "@/shared/infra/errors/not-found-error";
import { todayISO } from "@/shared/utils/calendar-day";
import { resolveLoggedDay } from "@/shared/utils/logged-day";
import { assertFiniteValue } from "../domain/entry-logic";
import { toEntry } from "../domain/metric.mapper";
import { METRIC_NOT_FOUND_MESSAGE } from "../domain/metric-logic";
import { EntryRepository } from "../infra/entry.repository";
import { MetricRepository } from "../infra/metric.repository";

type CreateEntryInput = SessionUser & CreateEntry & { metricId: number };

/**
 * Lança um registro na métrica do usuário. `date` omitida = hoje; data futura → 422 `FUTURE_DATE`;
 * valor não finito ou dia inexistente → 422 `VALIDATION`. Métrica inexistente ou de outro usuário
 * → 404 `NOT_FOUND` — também na corrida em que a métrica é apagada entre a checagem e o insert,
 * e a chave estrangeira barra o registro (23503). Em qualquer erro, nada é gravado.
 */
export async function createEntryUseCase({ userId, metricId, value, date }: CreateEntryInput): Promise<Entry> {
  assertFiniteValue(value);
  const day = resolveLoggedDay(date, todayISO());

  try {
    return await db.transaction(async (tx) => {
      const metric = await MetricRepository.findById(userId, metricId, tx);
      if (!metric) throw new NotFoundError(METRIC_NOT_FOUND_MESSAGE);

      return toEntry(await EntryRepository.create({ metricId, userId, value, date: day }, tx));
    });
  } catch (error) {
    if (isForeignKeyViolation(error)) throw new NotFoundError(METRIC_NOT_FOUND_MESSAGE);
    throw error;
  }
}
