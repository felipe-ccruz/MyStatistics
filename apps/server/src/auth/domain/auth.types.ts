import type { Me } from "@mystatistics/shared";

/**
 * Tipos que só o server usa. Os bodies (`SignUp`, `SignIn`) e o `Me` são contrato e moram em
 * `packages/shared`.
 */

/** Resultado de cadastro e login: o `Me` da resposta e os `Set-Cookie` de sessão do Better Auth. */
export type AuthSession = {
  me: Me;
  setCookies: string[];
};

/** Quem está logado, como o `authGuard` resolve a partir do cookie. */
export type SessionUser = {
  userId: string;
};
