import { Elysia, type ElysiaConfig } from "elysia";
import { errorHandler } from "./errors/global-error-handler";
import { assertJsonBody } from "./json-body";

/**
 * Ponto de partida de todo controller: um módulo Elysia com o handler de erro já plugado.
 * O app também registra o handler; como ele tem `name`, o Elysia não o aplica duas vezes.
 * Tê-lo aqui deixa o controller autossuficiente (dá pra montá-lo sozinho, ex.: com `.handle()`).
 *
 * Também recusa, antes do parse, corpo que não seja JSON (400 `PARSE`; ver `json-body.ts`).
 * O hook só decide se recusa: devolvendo `undefined`, o parser JSON padrão do Elysia segue.
 * Não troque isso por `parse: "json"` na rota: aí o Elysia passa a aceitar `text/plain` com JSON.
 */
export const createController = <const BasePath extends string = "">(config: ElysiaConfig<BasePath> = {}) =>
  new Elysia(config).use(errorHandler).onParse(({ contentType }) => {
    assertJsonBody(contentType);
  });
