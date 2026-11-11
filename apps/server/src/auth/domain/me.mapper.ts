import type { Me } from "@mystatistics/shared";
import type { UserRow } from "./auth.schema";
import type { ProfileRow } from "./profile.schema";

/** Monta o `Me` do contrato a partir do usuário (Better Auth) e do perfil. Nada além disso sai na API. */
export function toMe(user: Pick<UserRow, "id" | "email">, profile: ProfileRow): Me {
  return {
    user: { id: user.id, email: user.email },
    profile: { slug: profile.slug, visibility: profile.visibility },
  };
}
