import type { ActivityCategory } from "@mystatistics/shared";
import { UnprocessableEntityError } from "@/shared/infra/errors/unprocessable-entity-error";

/**
 * Lógica pura das atividades — sem banco, sem env. Fica isolada aqui para ser
 * testável com `bun test` sem subir Postgres nem carregar variáveis de ambiente.
 */

/** Minutos totais a partir de horas + minutos. Exige resultado > 0. */
export function toDurationMinutes(hours: number, minutes: number): number {
  const total = hours * 60 + minutes;
  if (total <= 0) {
    throw new UnprocessableEntityError("Duration must be greater than zero.", "INVALID_DURATION");
  }
  return total;
}

/** Matéria sem espaços nas pontas. Só espaços → 422 `VALIDATION` (o schema só exige 1 caractere). */
export function normalizeSubject(subject: string): string {
  const trimmed = subject.trim();
  if (trimmed === "") throw new UnprocessableEntityError("Subject can't be blank.", "VALIDATION");
  return trimmed;
}

/** Matéria só vale em `study`: com outra categoria → 422 `SUBJECT_NOT_ALLOWED`. Sem matéria, qualquer categoria. */
export function assertSubjectAllowed(category: ActivityCategory, subject: string | null): void {
  if (subject !== null && category !== "study") {
    throw new UnprocessableEntityError("Only study activities can have a subject.", "SUBJECT_NOT_ALLOWED");
  }
}

/**
 * Matéria da atividade depois de um PATCH: `undefined` mantém a atual, `null` remove, texto troca
 * (normalizado). A categoria final é a enviada ou a atual; matéria final fora de `study` → 422
 * `SUBJECT_NOT_ALLOWED` — inclusive ao mudar para `exercise` sem mandar `subject: null` junto.
 */
export function updatedSubjectOf(
  current: { category: ActivityCategory; subject: string | null },
  input: { category?: ActivityCategory; subject?: string | null },
): string | null {
  const subject =
    input.subject === undefined ? current.subject : input.subject === null ? null : normalizeSubject(input.subject);
  assertSubjectAllowed(input.category ?? current.category, subject);
  return subject;
}
