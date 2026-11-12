import type { Profile } from "@mystatistics/shared";
import type { ProfileRow } from "@/auth/domain/profile.schema";

/** Converte a linha do perfil no DTO do contrato (sem o `userId`, que não sai na API). */
export function toProfile(row: ProfileRow): Profile {
  return { slug: row.slug, visibility: row.visibility };
}
