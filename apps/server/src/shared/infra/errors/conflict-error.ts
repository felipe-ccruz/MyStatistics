import { HttpError } from "./http-error";

/**
 * 409 para dado que já existe (ex.: `EMAIL_TAKEN`, `SLUG_TAKEN`). O `code` é obrigatório:
 * é por ele que o front sabe qual campo marcar.
 */
export class ConflictError extends HttpError {
  constructor(message: string, code: string) {
    super(409, message, code);
  }
}
