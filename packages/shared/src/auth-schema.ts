import { t } from "elysia";
import { SLUG_PATTERN } from "./auth";

/**
 * Body de `POST /api/auth/signup`. O server valida com ESTE schema (`{ body: SignUp }`)
 * e o formulário de cadastro do front também, então o que o front aceita é exatamente
 * o que o server aceita.
 *
 * Regras do server além do schema: e-mail já usado → 409 `EMAIL_TAKEN`; slug já usado
 * → 409 `SLUG_TAKEN`. O cadastro já cria o perfil `private` e a sessão (entra logado).
 */
export const SignUp = t.Object({
  email: t.String({ format: "email", maxLength: 254 }),
  password: t.String({ minLength: 8, maxLength: 128 }),
  slug: t.String({ pattern: SLUG_PATTERN }),
});

export type SignUp = typeof SignUp.static;

/**
 * Body de `POST /api/auth/login`. E-mail inexistente e senha errada respondem o mesmo
 * 401 `INVALID_CREDENTIALS`, para não revelar quais e-mails têm conta.
 */
export const SignIn = t.Object({
  email: t.String({ format: "email", maxLength: 254 }),
  password: t.String({ minLength: 1, maxLength: 128 }),
});

export type SignIn = typeof SignIn.static;
