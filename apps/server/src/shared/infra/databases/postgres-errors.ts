/**
 * Leitura dos erros do Postgres. Lógica pura — sem banco, sem env.
 *
 * O Drizzle embrulha o erro do driver num `DrizzleQueryError`, com o original em `cause`;
 * por isso o erro do driver é procurado no próprio erro e na causa.
 */

const UNIQUE_VIOLATION = "23505";

type DriverError = { code: string; constraint_name?: unknown };

function asDriverError(error: unknown): DriverError | null {
  if (typeof error !== "object" || error === null || !("code" in error)) return null;
  return typeof error.code === "string" ? (error as DriverError) : null;
}

/**
 * O erro do driver (postgres.js), esteja ele direto ou embrulhado — pelo Drizzle, ou por uma lib
 * que embrulhe o erro do Drizzle. Segue a cadeia de `cause` (com limite, contra ciclo).
 */
function driverErrorOf(error: unknown): DriverError | null {
  let current: unknown = error;
  for (let depth = 0; depth < 5 && current !== undefined && current !== null; depth++) {
    const driverError = asDriverError(current);
    if (driverError) return driverError;
    current = current instanceof Error ? current.cause : undefined;
  }
  return null;
}

/** `true` quando a query falhou por violar um índice único (SQLSTATE 23505). */
export function isUniqueViolation(error: unknown): boolean {
  return driverErrorOf(error)?.code === UNIQUE_VIOLATION;
}

/** Nome da constraint única violada (ex.: `users_email_unique`), ou `null` se não for 23505. */
export function uniqueViolationConstraint(error: unknown): string | null {
  const driverError = driverErrorOf(error);
  if (driverError?.code !== UNIQUE_VIOLATION) return null;
  return typeof driverError.constraint_name === "string" ? driverError.constraint_name : null;
}
