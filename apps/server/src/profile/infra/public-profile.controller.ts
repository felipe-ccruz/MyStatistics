import type { PublicProfile } from "@mystatistics/shared";
import { t } from "elysia";
import { createController } from "@/shared/infra/base.controller";
import { getPublicProfileUseCase } from "../application/get-public-profile.usecase";

/**
 * Portfólio público, sem login: **sem `authGuard` de propósito**, e o use case não recebe nada da
 * sessão — visitante logado, anônimo e o próprio dono recebem a mesma resposta. Só leitura: não
 * existe rota de escrita sob `/api/public`.
 */
export const PublicProfileController = createController({ prefix: "/public/profiles", tags: ["Public profile"] })
  // GET /api/public/profiles/:slug
  .get("/:slug", ({ params }): Promise<PublicProfile> => getPublicProfileUseCase({ slug: params.slug }), {
    // Sem o `SLUG_PATTERN`: slug fora do formato é só um slug que não existe (404, não 422).
    params: t.Object({ slug: t.String() }),
    detail: {
      summary: "Get a public portfolio",
      description:
        "Only the visible items, as aggregates. An unknown slug and a private profile answer the same " +
        "404 PROFILE_NOT_FOUND.",
    },
  });
