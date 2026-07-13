/**
 * Contratos de API compartilhados entre apps/web e apps/server.
 * Toda rota nova deve ter seu tipo de request/response declarado aqui.
 */

export type HelloResponse = {
  message: string;
  method: string;
};
