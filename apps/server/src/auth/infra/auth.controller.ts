import { type Me, SignIn, SignUp } from "@mystatistics/shared";
import { authGuard } from "@/shared/infra/auth.guard";
import { createController } from "@/shared/infra/base.controller";
import { getMeUseCase } from "../application/get-me.usecase";
import { signInUseCase } from "../application/sign-in.usecase";
import { signOutUseCase } from "../application/sign-out.usecase";
import { signUpUseCase } from "../application/sign-up.usecase";

/** Repassa os `Set-Cookie` de sessão que o Better Auth devolveu (podem ser vários). */
function forwardCookies(set: { headers: Record<string, unknown> }, cookies: string[]): void {
  if (cookies.length > 0) set.headers["set-cookie"] = cookies;
}

/**
 * Rotas de conta. O Better Auth faz o trabalho pesado (senha, sessão, cookie) por `auth.api.*`
 * dentro dos use cases; aqui só entra o HTTP: valida o body, chama o use case, repassa o cookie
 * e define o status.
 *
 * Ordem importa: o `authGuard` só vale para as rotas registradas depois dele (só o `/me`).
 */
export const AuthController = createController({ prefix: "/auth", tags: ["Auth"] })
  // POST /api/auth/signup
  .post(
    "/signup",
    async ({ body, request, set }): Promise<Me> => {
      const { me, setCookies } = await signUpUseCase(body, request.headers);
      forwardCookies(set, setCookies);
      set.status = 201;
      return me;
    },
    {
      body: SignUp,
      detail: {
        summary: "Sign up",
        description: "Creates the account and a private profile, and starts the session (sets the cookie).",
      },
    },
  )

  // POST /api/auth/login
  .post(
    "/login",
    async ({ body, request, set }): Promise<Me> => {
      const { me, setCookies } = await signInUseCase(body, request.headers);
      forwardCookies(set, setCookies);
      return me;
    },
    {
      body: SignIn,
      detail: {
        summary: "Log in",
        description: "Unknown email and wrong password answer the same 401 INVALID_CREDENTIALS.",
      },
    },
  )

  // POST /api/auth/logout
  .post(
    "/logout",
    async ({ request, set }) => {
      forwardCookies(set, await signOutUseCase(request.headers));
      set.status = 204;
    },
    {
      detail: {
        summary: "Log out",
        description: "Ends the session and clears the cookie. 204 even without a session.",
      },
    },
  )

  .use(authGuard)

  // GET /api/auth/me
  .get("/me", ({ userId }): Promise<Me> => getMeUseCase({ userId }), {
    detail: { summary: "Get the logged-in user", description: "401 UNAUTHORIZED without a valid session." },
  });
