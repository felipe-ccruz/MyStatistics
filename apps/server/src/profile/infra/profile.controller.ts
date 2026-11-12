import { type Profile, type ProfileItem, UpdateProfile, UpdateProfileItem } from "@mystatistics/shared";
import { authGuard } from "@/shared/infra/auth.guard";
import { createController } from "@/shared/infra/base.controller";
import { listProfileItemsUseCase } from "../application/list-profile-items.usecase";
import { updateProfileUseCase } from "../application/update-profile.usecase";
import { updateProfileItemUseCase } from "../application/update-profile-item.usecase";

/**
 * Rotas do dono do perfil: visibilidade do perfil e de cada item do portfólio. O controller só
 * traduz HTTP ↔ use case.
 *
 * Todas exigem sessão (`authGuard`: 401 sem cookie) e só mexem no perfil do usuário logado — o
 * `userId` vem da sessão, nunca do request.
 */
export const ProfileController = createController({ prefix: "/profile", tags: ["Profile"] })
  .use(authGuard)

  // PATCH /api/profile
  .patch("/", ({ body, userId }): Promise<Profile> => updateProfileUseCase({ ...body, userId }), {
    body: UpdateProfile,
    detail: {
      summary: "Make the profile public or private",
      description: "Items keep their own visibility; a private profile answers 404 to visitors.",
    },
  })

  // GET /api/profile/items
  .get("/items", ({ userId }): Promise<ProfileItem[]> => listProfileItemsUseCase({ userId }), {
    detail: {
      summary: "List portfolio items",
      description: "Progress, then the activity categories, then the metrics by name. No choice saved = hidden.",
    },
  })

  // PATCH /api/profile/items
  .patch("/items", ({ body, userId }): Promise<ProfileItem> => updateProfileItemUseCase({ ...body, userId }), {
    body: UpdateProfileItem,
    detail: {
      summary: "Show or hide a portfolio item",
      description: "An item the user doesn't have (bad category, another user's or deleted metric) answers 404.",
    },
  });
