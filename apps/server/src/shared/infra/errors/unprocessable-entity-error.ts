import { HttpError } from "./http-error";

/**
 * 422 para regra de negócio violada depois que o body já passou no schema TypeBox.
 * O `code` diz qual regra (ex.: `INVALID_DURATION`) e entra na tabela de erros do docs/contract.md.
 */
export class UnprocessableEntityError extends HttpError {
  constructor(message: string, code: string) {
    super(422, message, code);
  }
}
