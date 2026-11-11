import { FormatRegistry } from "@sinclair/typebox";

/**
 * Formatos de string usados pelos schemas do contrato (`t.String({ format: "email" })`).
 *
 * O TypeBox só valida um `format` registrado no `FormatRegistry`. O Elysia registra os
 * dele no server, mas o navegador não importa o Elysia. Por isso o contrato registra aqui
 * o que usa, com a mesma regra do Elysia, para front e back validarem igual.
 * `Has || Set`: quem registrar primeiro vale, sem conflito.
 */
const EMAIL =
  /^[a-z0-9!#$%&'*+/=?^_`{|}~-]+(?:\.[a-z0-9!#$%&'*+/=?^_`{|}~-]+)*@(?:[a-z0-9](?:[a-z0-9-]*[a-z0-9])?\.)+[a-z0-9](?:[a-z0-9-]*[a-z0-9])?$/i;

if (!FormatRegistry.Has("email")) FormatRegistry.Set("email", (value) => EMAIL.test(value));
