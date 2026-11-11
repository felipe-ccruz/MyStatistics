import { BadRequestError } from "./errors/bad-request-error";

/**
 * A API só aceita corpo em JSON. Lógica pura — sem banco, sem env.
 *
 * Motivo (segurança): o Elysia também aceita `application/x-www-form-urlencoded`, `multipart/form-data`
 * e `text/plain`, e converte os valores. Esses são os tipos que um `<form>` de outro site consegue
 * enviar sem preflight de CORS — aceitar qualquer um deles abre CSRF (ex.: login forçado numa conta
 * do atacante). `application/json` vindo de outra origem exige preflight, que o server não libera.
 */

const JSON_CONTENT_TYPE = "application/json";

/**
 * Recusa com 400 `PARSE` um corpo cujo `content-type` (já sem parâmetros como `; charset=utf-8`)
 * não seja JSON. String vazia = requisição sem corpo (GET, DELETE, logout): passa.
 */
export function assertJsonBody(contentType: string): void {
  const mediaType = contentType.trim().toLowerCase();
  if (mediaType === "" || mediaType === JSON_CONTENT_TYPE) return;
  throw new BadRequestError("The request body must be JSON (content-type: application/json).", "PARSE");
}
