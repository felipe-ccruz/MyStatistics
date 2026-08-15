/**
 * Formato único de erro da API. Toda rota que falha responde neste shape,
 * com o HTTP status adequado — o front trata um formato só (ver ACCEPTANCE.md §6).
 */
export type ApiError = {
  error: {
    message: string;
    code: string;
  };
};
