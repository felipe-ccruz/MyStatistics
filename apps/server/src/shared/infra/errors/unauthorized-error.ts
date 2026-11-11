import { HttpError } from "./http-error";

/**
 * 401. Sem argumentos é o "precisa estar logado" (`UNAUTHORIZED`); o login com e-mail ou
 * senha errados usa o mesmo status com outro código (`INVALID_CREDENTIALS`).
 */
export class UnauthorizedError extends HttpError {
  constructor(message = "You need to be logged in.", code = "UNAUTHORIZED") {
    super(401, message, code);
  }
}
