import type { SignIn } from "@mystatistics/shared";
import { HttpError } from "@/shared/infra/errors/http-error";
import type { AuthSession } from "../domain/auth.types";
import { withAuthErrors } from "../domain/auth-errors";
import { toMe } from "../domain/me.mapper";
import { auth } from "../infra/better-auth";
import { ProfileRepository } from "../infra/profile.repository";

/**
 * Login com e-mail e senha: o Better Auth confere a senha e abre a sessão.
 * E-mail inexistente e senha errada respondem o MESMO 401 `INVALID_CREDENTIALS`, com a mesma
 * mensagem, para não revelar quais e-mails têm conta.
 */
export async function signInUseCase(input: SignIn, requestHeaders: Headers = new Headers()): Promise<AuthSession> {
  const { response, headers } = await withAuthErrors(() =>
    auth.api.signInEmail({
      body: { email: input.email, password: input.password },
      headers: requestHeaders,
      returnHeaders: true,
    }),
  );

  const profile = await ProfileRepository.findByUserId(response.user.id);
  // O cadastro garante um perfil por usuário; chegar aqui sem perfil é bug, não erro do cliente.
  if (!profile) throw new HttpError(500, "Account without a profile.", "INTERNAL");

  return { me: toMe(response.user, profile), setCookies: headers.getSetCookie() };
}
