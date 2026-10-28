import { HttpError } from "./http-error";

/** 404 com `code: "NOT_FOUND"`. */
export class NotFoundError extends HttpError {
  constructor(message = "Recurso não encontrado.") {
    super(404, message, "NOT_FOUND");
  }
}
