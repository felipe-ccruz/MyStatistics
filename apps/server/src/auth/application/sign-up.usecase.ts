import type { SignUp } from "@mystatistics/shared";
import { isAPIError } from "better-auth/api";
import { isUniqueViolation } from "@/shared/infra/databases/postgres-errors";
import { ConflictError } from "@/shared/infra/errors/conflict-error";
import type { AuthSession } from "../domain/auth.types";
import { EMAIL_TAKEN_MESSAGE, toAuthHttpError } from "../domain/auth-errors";
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
 * - e-mail já usado → 409 `EMAIL_TAKEN` (vem do Better Auth, ou da corrida no índice único);
 * - se o perfil falhar depois do usuário criado, o usuário é apagado: nunca fica conta sem perfil.
 *   Se foi o slug levado no meio do caminho (23505), responde `SLUG_TAKEN`; senão, relança o erro.
 *
 * Não roda numa transação nossa de propósito: o Better Auth usa o `db` global, e com o pool de
 * 1 conexão fora de produção a chamada travaria. A compensação acima faz o papel do rollback.
 */
export async function signUpUseCase(input: SignUp, requestHeaders: Headers = new Headers()): Promise<AuthSession> {
  if (await ProfileRepository.findBySlug(input.slug)) {
    throw new ConflictError(SLUG_TAKEN_MESSAGE, "SLUG_TAKEN");
  }

  const { response, headers } = await createUser(input, requestHeaders);
  const { user } = response;

  let profile: ProfileRow;
  try {
    profile = await ProfileRepository.create({ userId: user.id, slug: input.slug });
  } catch (error) {
    await undoUser(user.id, error);
    if (isUniqueViolation(error)) throw new ConflictError(SLUG_TAKEN_MESSAGE, "SLUG_TAKEN");
    throw error;
  }

  return { me: toMe(user, profile), setCookies: headers.getSetCookie() };
}

async function createUser(input: SignUp, requestHeaders: Headers) {
  try {
    return await auth.api.signUpEmail({
      // O `name` é obrigatório no Better Auth; guarda o slug até existir nome de exibição.
      body: { name: input.slug, email: input.email, password: input.password },
      headers: requestHeaders,
      returnHeaders: true,
    });
  } catch (error) {
    const translated = toAuthHttpError(error);
    if (translated) throw translated;
    // Corrida: dois cadastros com o mesmo e-mail passam juntos pela checagem da lib e o índice único
    // barra o segundo. O Better Auth 1.7 troca o 23505 por `FAILED_TO_CREATE_USER`, sem a causa; se o
    // e-mail existe agora, foi isso. Se não existe, é outra falha (ex.: banco) e segue como 500.
    if (isAPIError(error) && error.body?.code === "FAILED_TO_CREATE_USER" && (await emailExists(input.email))) {
      throw new ConflictError(EMAIL_TAKEN_MESSAGE, "EMAIL_TAKEN");
    }
    throw error;
  }
}

async function emailExists(email: string): Promise<boolean> {
  try {
    return await UserRepository.existsByEmail(email);
  } catch {
    return false;
  }
}

/**
 * Compensação do cadastro: apaga o usuário recém-criado (sessão e credencial vão em cascade).
 * Se o próprio delete falhar, só registra — quem chamou relança o erro ORIGINAL, que é o que
 * explica a falha; a conta órfã fica no log para limpeza manual.
 */
async function undoUser(userId: string, originalError: unknown): Promise<void> {
  try {
    await UserRepository.delete(userId);
  } catch (deleteError) {
    console.error(`[sign-up] could not undo user ${userId} after the profile failed`, {
      originalError,
      deleteError,
    });
  }
}
