import { HttpError } from "./http-error";

/** 404 com `code: "NOT_FOUND"`. */
export class NotFoundError extends HttpError {
  constructor(message = "Resource not found.") {
    super(404, message, "NOT_FOUND");
  }
}
