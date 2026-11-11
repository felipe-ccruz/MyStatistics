import { withAuthErrors } from "../domain/auth-errors";
import { auth } from "../infra/better-auth";

/**
 * Logout: o Better Auth apaga a sessão do cookie (se houver) e devolve o `Set-Cookie` que o
 * expira no navegador. Sem sessão também funciona — logout é idempotente.
 */
export async function signOutUseCase(requestHeaders: Headers = new Headers()): Promise<string[]> {
  const { headers } = await withAuthErrors(() => auth.api.signOut({ headers: requestHeaders, returnHeaders: true }));
  return headers.getSetCookie();
}
