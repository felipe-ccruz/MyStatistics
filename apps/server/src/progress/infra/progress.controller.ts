import type { Progress } from "@mystatistics/shared";
import { authGuard } from "@/shared/infra/auth.guard";
import { createController } from "@/shared/infra/base.controller";
import { getProgressUseCase } from "../application/get-progress.usecase";

/**
 * Rota HTTP do progresso (nível, XP, streak, status, atributos, daily quest). Exige sessão
 * (`authGuard`: 401 sem cookie) e calcula só a partir das atividades do usuário logado.
 */
export const ProgressController = createController({ prefix: "/progress", tags: ["Progress"] })
  .use(authGuard)

  // GET /api/progress
  .get("/", ({ userId }): Promise<Progress> => getProgressUseCase({ userId }), {
    detail: {
      summary: "Get the player's progress",
      description: "Level, XP, rank, class, streak, today's status, 30-day attributes and today's daily quest.",
    },
  });
