import type { SignUp } from "@mystatistics/shared";
import { isUniqueViolation } from "@/shared/infra/databases/postgres-errors";
import { ConflictError } from "@/shared/infra/errors/conflict-error";
import type { AuthSession } from "../domain/auth.types";
import { withAuthErrors } from "../domain/auth-errors";
import { toMe } from "../domain/me.mapper";
import type { ProfileRow } from "../domain/profile.schema";
import { auth } from "../infra/better-auth";
import { ProfileRepository } from "../infra/profile.repository";
import { UserRepository } from "../infra/user.repository";

export const SLUG_TAKEN_MESSAGE = "This profile slug is already taken.";

/**
 * Cadastro: cria o usuário pelo Better Auth (que já abre a sessão) e o perfil `private`.
 *
 * - slug já usado → 409 `SLUG_TAKEN`, antes de criar qualquer coisa;
 * - e-mail já usado → 409 `EMAIL_TAKEN` (vem do Better Auth);
 * - se o perfil falhar depois do usuário criado (ex.: outro cadastro levou o slug no meio do
 *   caminho, 23505), o usuário é apagado: nunca fica conta sem perfil.
 *
 * Não roda numa transação nossa de propósito: o Better Auth usa o `db` global, e com o pool de
 * 1 conexão fora de produção a chamada travaria. A compensação acima faz o papel do rollback.
 */
export async function signUpUseCase(input: SignUp, requestHeaders: Headers = new Headers()): Promise<AuthSession> {
  if (await ProfileRepository.findBySlug(input.slug)) {
    throw new ConflictError(SLUG_TAKEN_MESSAGE, "SLUG_TAKEN");
  }

  const { response, headers } = await withAuthErrors(() =>
    auth.api.signUpEmail({
      // O `name` é obrigatório no Better Auth; guarda o slug até existir nome de exibição.
      body: { name: input.slug, email: input.email, password: input.password },
      headers: requestHeaders,
      returnHeaders: true,
    }),
  );
  const { user } = response;

  let profile: ProfileRow;
  try {
    profile = await ProfileRepository.create({ userId: user.id, slug: input.slug });
  } catch (error) {
    await UserRepository.delete(user.id);
    if (isUniqueViolation(error)) throw new ConflictError(SLUG_TAKEN_MESSAGE, "SLUG_TAKEN");
    throw error;
  }

  return { me: toMe(user, profile), setCookies: headers.getSetCookie() };
}
