/**
 * Conta e perfil: o que o front recebe sobre quem está logado.
 *
 * Arquivo PURO de propósito (sem Elysia/TypeBox), como o ./activity: o schema do
 * Drizzle importa `PROFILE_VISIBILITIES` daqui para o pgEnum sem puxar o framework.
 * Os schemas de body (cadastro, login) moram em ./auth-schema.
 */

/** Fonte única das visibilidades do perfil. Alimenta o pgEnum (banco) e o TypeBox (borda). */
export const PROFILE_VISIBILITIES = ["private", "public"] as const;

export type ProfileVisibility = (typeof PROFILE_VISIBILITIES)[number];

/**
 * Formato do `slug` (o identificador do perfil na URL, `/u/<slug>`): de 3 a 30
 * caracteres, só minúsculas, números e hífen, sem hífen nas pontas.
 */
export const SLUG_PATTERN = "^[a-z0-9][a-z0-9-]{1,28}[a-z0-9]$";

/**
 * Quem está logado, como `POST /api/auth/signup`, `POST /api/auth/login` e
 * `GET /api/auth/me` devolvem. O id do usuário é texto (gerado pelo Better Auth).
 */
export type Me = {
  user: {
    id: string;
    email: string;
  };
  profile: {
    slug: string;
    visibility: ProfileVisibility;
  };
};
