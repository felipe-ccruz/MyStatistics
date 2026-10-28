/**
 * Erro de aplicação com HTTP status e código de negócio. O handler global o formata no
 * shape único `ApiError`. Use as subclasses (`NotFoundError`, `UnprocessableEntityError`);
 * crie uma nova aqui quando aparecer outro status.
 */
export class HttpError extends Error {
  constructor(
    public readonly status: number,
    message: string,
    public readonly apiCode: string,
  ) {
    super(message);
  }
}
