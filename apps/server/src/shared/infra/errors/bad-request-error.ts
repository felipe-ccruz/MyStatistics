import { HttpError } from "./http-error";

/** 400 para requisição malformada antes de qualquer regra (ex.: corpo que não é JSON → `PARSE`). */
export class BadRequestError extends HttpError {
  constructor(message: string, code: string) {
    super(400, message, code);
  }
}
