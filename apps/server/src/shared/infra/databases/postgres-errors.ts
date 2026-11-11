/**
 * Leitura dos erros do Postgres. Lógica pura — sem banco, sem env.
 *
 * O Drizzle embrulha o erro do driver num `DrizzleQueryError`, com o original em `cause`;
 * por isso o código SQLSTATE é procurado no erro e na causa.
 */

const UNIQUE_VIOLATION = "23505";

function sqlState(error: unknown): string | undefined {
  if (typeof error !== "object" || error === null || !("code" in error)) return undefined;
  return typeof error.code === "string" ? error.code : undefined;
}

/** `true` quando a query falhou por violar um índice único (SQLSTATE 23505). */
export function isUniqueViolation(error: unknown): boolean {
  if (sqlState(error) === UNIQUE_VIOLATION) return true;
  if (error instanceof Error) return sqlState(error.cause) === UNIQUE_VIOLATION;
  return false;
}
