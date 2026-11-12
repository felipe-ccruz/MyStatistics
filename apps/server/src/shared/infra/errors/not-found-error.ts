import { HttpError } from "./http-error";

/**
 * 404. Sem `code` é o `NOT_FOUND` genérico (recurso inexistente ou de outro usuário); o
 * portfólio usa o mesmo status com outro código (`PROFILE_NOT_FOUND`).
 */
export class NotFoundError extends HttpError {
  constructor(message = "Resource not found.", code = "NOT_FOUND") {
    super(404, message, code);
  }
}
