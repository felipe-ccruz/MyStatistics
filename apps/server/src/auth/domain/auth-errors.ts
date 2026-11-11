import { isAPIError } from "better-auth/api";
import { ConflictError } from "@/shared/infra/errors/conflict-error";
import type { HttpError } from "@/shared/infra/errors/http-error";
import { UnauthorizedError } from "@/shared/infra/errors/unauthorized-error";
import { UnprocessableEntityError } from "@/shared/infra/errors/unprocessable-entity-error";

/**
 * Tradução dos erros do Better Auth (`APIError`, com `body.code` da lib) para as nossas classes,
 * que saem no shape único `ApiError`. Lógica pura — sem banco, sem env.
 */

export const EMAIL_TAKEN_MESSAGE = "An account with this email already exists.";
export const INVALID_CREDENTIALS_MESSAGE = "Invalid email or password.";

/** Códigos do Better Auth para dado que o nosso schema TypeBox já deveria ter barrado. */
const VALIDATION_CODES = new Set(["INVALID_EMAIL", "INVALID_PASSWORD", "PASSWORD_TOO_SHORT", "PASSWORD_TOO_LONG"]);

/**
 * Devolve o nosso erro equivalente, ou `null` quando não é um erro conhecido do Better Auth
 * (aí quem chamou relança o original e ele vira 500 `INTERNAL`, como qualquer falha inesperada).
 */
export function toAuthHttpError(error: unknown): HttpError | null {
  if (!isAPIError(error)) return null;

  const code = error.body?.code;
  if (code === "USER_ALREADY_EXISTS" || code === "USER_ALREADY_EXISTS_USE_ANOTHER_EMAIL") {
    return new ConflictError(EMAIL_TAKEN_MESSAGE, "EMAIL_TAKEN");
  }
  if (code === "INVALID_EMAIL_OR_PASSWORD") {
    return new UnauthorizedError(INVALID_CREDENTIALS_MESSAGE, "INVALID_CREDENTIALS");
  }
  if (code !== undefined && VALIDATION_CODES.has(code)) {
    return new UnprocessableEntityError("Invalid data. Check the fields sent.", "VALIDATION");
  }
  // Ex.: sessão que sumiu no meio da renovação. Para quem chamou, é "não está logado".
  if (error.statusCode === 401) return new UnauthorizedError();

  return null;
}
