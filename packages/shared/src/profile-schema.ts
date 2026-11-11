import { Type as t } from "@sinclair/typebox";
import { PROFILE_VISIBILITIES } from "./auth";
import { PROFILE_ITEM_KINDS } from "./profile";

/** Body de `PATCH /api/profile`: torna o perfil público ou privado. */
export const UpdateProfile = t.Object({
  visibility: t.Union(PROFILE_VISIBILITIES.map((v) => t.Literal(v))),
});

export type UpdateProfile = typeof UpdateProfile.static;

/**
 * Body de `PATCH /api/profile/items`: mostra ou oculta um item do portfólio.
 * Item que não existe para o usuário (categoria inválida, métrica de outro usuário ou
 * apagada, `ref` diferente de `""` em `progress`) → 404 `NOT_FOUND`.
 */
export const UpdateProfileItem = t.Object({
  kind: t.Union(PROFILE_ITEM_KINDS.map((k) => t.Literal(k))),
  ref: t.String({ maxLength: 40 }),
  visible: t.Boolean(),
});

export type UpdateProfileItem = typeof UpdateProfileItem.static;
