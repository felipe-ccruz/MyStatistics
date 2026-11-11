import type { Me } from "@mystatistics/shared";
import { UnauthorizedError } from "@/shared/infra/errors/unauthorized-error";
import type { SessionUser } from "../domain/auth.types";
import { toMe } from "../domain/me.mapper";
import { UserRepository } from "../infra/user.repository";

/** Quem está logado: usuário + perfil do `userId` que o `authGuard` resolveu. */
export async function getMeUseCase({ userId }: SessionUser): Promise<Me> {
  const found = await UserRepository.findWithProfile(userId);
  // Sessão de um usuário que não existe mais (ou sem perfil): para o cliente, não está logado.
  if (!found) throw new UnauthorizedError();
  return toMe(found.user, found.profile);
}
