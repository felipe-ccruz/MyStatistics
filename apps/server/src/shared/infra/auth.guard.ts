import { Elysia } from "elysia";
import { toAuthHttpError } from "@/auth/domain/auth-errors";
import { auth } from "@/auth/infra/better-auth";
import { UnauthorizedError } from "./errors/unauthorized-error";

/**
 * Guarda de sessão: plugin Elysia que resolve o usuário logado a partir do cookie e expõe
 * `userId` no contexto das rotas registradas DEPOIS do `.use(authGuard)`. Sem sessão válida,
 * responde 401 `UNAUTHORIZED` antes do handler.
 *
 * Se o Better Auth renovou a sessão nesta chamada (ver `updateAge`), o cookie novo é repassado
 * na resposta. Falha de banco não vira 401: sai como 500 `INTERNAL`.
 *
 * Sem `name` de propósito: plugin com nome é deduplicado pelo Elysia, e o `resolve` "scoped"
 * precisa valer em cada controller que o usa.
 */
export const authGuard = new Elysia().resolve({ as: "scoped" }, async ({ request, set }) => {
  let result: Awaited<ReturnType<typeof getSession>>;
  try {
    result = await getSession(request.headers);
  } catch (error) {
    throw toAuthHttpError(error) ?? error;
  }

  const session = result.response;
  if (!session) throw new UnauthorizedError();

  const refreshedCookies = result.headers.getSetCookie();
  if (refreshedCookies.length > 0) set.headers["set-cookie"] = refreshedCookies;

  return { userId: session.user.id };
});

function getSession(headers: Headers) {
  return auth.api.getSession({ headers, returnHeaders: true });
}
