import type { ApiError } from "@mystatistics/shared";
import { Elysia } from "elysia";
import { HttpError } from "./http-error";

function body(message: string, code: string): ApiError {
  return { error: { message, code } };
}

/**
 * Normaliza TODA falha para `{ error: { message, code } }` (ver ACCEPTANCE.md §6).
 * `as: "global"` faz o hook valer para o app inteiro, inclusive rotas montadas com `.use()`.
 */
export const errorHandler = new Elysia({ name: "error-handler" }).onError(
  { as: "global" },
  ({ code, error, set }): ApiError => {
    if (error instanceof HttpError) {
      set.status = error.status;
      return body(error.message, error.apiCode);
    }

    switch (code) {
      case "VALIDATION":
        set.status = 422;
        return body("Invalid data. Check the fields sent.", "VALIDATION");
      case "NOT_FOUND":
        set.status = 404;
        return body("Resource not found.", "NOT_FOUND");
      case "PARSE":
        set.status = 400;
        return body("Invalid request body.", "PARSE");
      default:
        set.status = 500;
        return body("Internal server error.", "INTERNAL");
    }
  },
);
