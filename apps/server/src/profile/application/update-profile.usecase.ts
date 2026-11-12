import type { Profile, UpdateProfile } from "@mystatistics/shared";
import type { SessionUser } from "@/auth/domain/auth.types";
import { ProfileRepository } from "@/auth/infra/profile.repository";
import { UnauthorizedError } from "@/shared/infra/errors/unauthorized-error";
import { toProfile } from "../domain/profile.mapper";

type UpdateProfileInput = SessionUser & UpdateProfile;

/**
 * Torna o perfil do usuário público ou privado. Os itens não mudam: o que estava oculto continua
 * oculto. Sessão de um usuário sem perfil → 401, como no `GET /api/auth/me`.
 */
export async function updateProfileUseCase({ userId, visibility }: UpdateProfileInput): Promise<Profile> {
  const row = await ProfileRepository.updateVisibility(userId, visibility);
  if (!row) throw new UnauthorizedError();
  return toProfile(row);
}
