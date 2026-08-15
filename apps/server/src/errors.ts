import { Elysia } from "elysia";
import type { ApiError } from "@mystatistics/shared";

/** Erro de aplicação com HTTP status e código de negócio. O handler o formata no shape único. */
export class HttpError extends Error {
  constructor(
    public readonly status: number,
    message: string,
    public readonly apiCode: string,
  ) {
    super(message);
  }
}

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
        return body("Dados inválidos. Verifique os campos enviados.", "VALIDATION");
      case "NOT_FOUND":
        set.status = 404;
        return body("Recurso não encontrado.", "NOT_FOUND");
      case "PARSE":
        set.status = 400;
        return body("Corpo da requisição inválido.", "PARSE");
      default:
        set.status = 500;
        return body("Erro interno do servidor.", "INTERNAL");
    }
  },
);
