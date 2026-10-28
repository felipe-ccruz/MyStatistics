import { Elysia, type ElysiaConfig } from "elysia";
import { errorHandler } from "./errors/global-error-handler";

/**
 * Ponto de partida de todo controller: um módulo Elysia com o handler de erro já plugado.
 * O app também registra o handler; como ele tem `name`, o Elysia não o aplica duas vezes.
 * Tê-lo aqui deixa o controller autossuficiente (dá pra montá-lo sozinho, ex.: com `.handle()`).
 */
export const createController = <const BasePath extends string = "">(config: ElysiaConfig<BasePath> = {}) =>
  new Elysia(config).use(errorHandler);
