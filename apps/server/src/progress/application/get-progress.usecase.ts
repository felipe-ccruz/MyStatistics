import type { Progress } from "@mystatistics/shared";
import { minutesOn, toDayMinutes } from "@/activities/domain/day-minutes";
import { ActivityRepository } from "@/activities/infra/activity.repository";
import type { SessionUser } from "@/auth/domain/auth.types";
import { todayISO } from "@/shared/utils/calendar-day";
import { attributesOf, attributeWindowOf } from "../domain/attributes";
import { classNameOf } from "../domain/class-name";
import { dailyQuestOf } from "../domain/daily-quest";
import { levelOf, rankOf } from "../domain/level";
import { statusOf } from "../domain/status";
import { streakOf } from "../domain/streak";
import { totalXpOf } from "../domain/xp";

type GetProgressInput = SessionUser & {
  /** Dia usado como "hoje". Padrão: o dia de calendário do server; os testes fixam um dia. */
  today?: string;
};

/**
 * Progresso do usuário logado (D5/D6), calculado a partir das atividades dele: o módulo não tem
 * tabela própria — o `ActivityRepository` devolve os minutos agregados e as funções puras de
 * `progress/domain` aplicam as regras.
 * O XP conta toda a história (inclusive dia lançado depois de hoje).
 */
export async function getProgressUseCase({ userId, today = todayISO() }: GetProgressInput): Promise<Progress> {
  const window = attributeWindowOf(today);
  const [rows, studySessions] = await Promise.all([
    ActivityRepository.minutesPerDayAndCategory(userId),
    ActivityRepository.studySessionsBetween(userId, window.from, window.to),
  ]);
  const byDay = toDayMinutes(rows);

  const xpTotal = totalXpOf(byDay);
  const { level, xpCurrent, xpNeeded } = levelOf(xpTotal);
  const attributes = attributesOf(byDay, studySessions, today);

  return {
    today,
    level,
    xpCurrent,
    xpNeeded,
    xpTotal,
    rank: rankOf(level),
    className: classNameOf(attributes),
    streak: streakOf(byDay, today),
    status: statusOf(byDay, today),
    attributes,
    dailyQuest: dailyQuestOf(minutesOn(byDay, today)),
  };
}
