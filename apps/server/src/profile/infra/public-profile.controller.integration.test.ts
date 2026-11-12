import { afterEach, beforeAll, describe, expect, it } from "bun:test";
import { ActivityRepository } from "@/activities/infra/activity.repository";
import { todayISO } from "@/shared/utils/calendar-day";
import { IntegrationTestHelper } from "@/shared/utils/test-helpers/integration-test-helper";
import { updateProfileUseCase } from "../application/update-profile.usecase";
import { updateProfileItemUseCase } from "../application/update-profile-item.usecase";
import { PublicProfileController } from "./public-profile.controller";

function get(slug: string, cookie?: string, method = "GET") {
  const headers = cookie ? { cookie } : undefined;
  return PublicProfileController.handle(
    new Request(`http://localhost/public/profiles/${encodeURIComponent(slug)}`, { method, headers }),
  );
}

describe("PublicProfileController - Integration", () => {
  beforeAll(() => IntegrationTestHelper.setupTestDatabase());
  afterEach(() => IntegrationTestHelper.truncateAll());

  it("slug inexistente e perfil privado: o mesmo 404 PROFILE_NOT_FOUND, com o mesmo corpo", async () => {
    const owner = await IntegrationTestHelper.createTestUser();

    const privateResponse = await get(owner.slug);
    const missingResponse = await get("no-such-slug");
    const badFormatResponse = await get("NOT A SLUG");

    expect([privateResponse.status, missingResponse.status, badFormatResponse.status]).toEqual([404, 404, 404]);
    const bodies = await Promise.all([privateResponse.json(), missingResponse.json(), badFormatResponse.json()]);
    expect(bodies[0]).toEqual({ error: { message: "Profile not found.", code: "PROFILE_NOT_FOUND" } });
    expect(bodies[1]).toEqual(bodies[0]);
    expect(bodies[2]).toEqual(bodies[0]);
  });

  it("visitante logado (outro usuário) e o dono recebem exatamente o mesmo que um anônimo", async () => {
    const owner = await IntegrationTestHelper.createTestUser();
    const visitor = await IntegrationTestHelper.createTestUser();
    await ActivityRepository.create({ userId: owner.id, category: "study", durationMinutes: 50, date: todayISO() });
    await updateProfileUseCase({ userId: owner.id, visibility: "public" });
    await updateProfileItemUseCase({ userId: owner.id, kind: "activity_category", ref: "study", visible: true });

    const anonymous = await get(owner.slug);
    const loggedIn = await get(owner.slug, visitor.cookie);
    const asOwner = await get(owner.slug, owner.cookie);

    expect([anonymous.status, loggedIn.status, asOwner.status]).toEqual([200, 200, 200]);
    const [anonymousBody, loggedInBody, ownerBody] = await Promise.all([
      anonymous.text(),
      loggedIn.text(),
      asOwner.text(),
    ]);
    expect(loggedInBody).toBe(anonymousBody);
    expect(ownerBody).toBe(anonymousBody);
    expect(JSON.parse(anonymousBody)).toMatchObject({ slug: owner.slug, activities: [{ category: "study" }] });
    expect(JSON.parse(anonymousBody)).not.toHaveProperty("progress");
  });

  // Slug fora do formato que chega ao banco: o Postgres recusa texto com byte nulo
  // (22021) e, sem checar o formato antes da query, a resposta vira 500 em vez do 404.
  it("slug com byte nulo ou gigante responde o mesmo 404 PROFILE_NOT_FOUND (não 500)", async () => {
    for (const slug of ["user\u0000x", "\u0000", "a".repeat(5000)]) {
      const response = await get(slug);

      expect({ slug: slug.slice(0, 10), status: response.status }).toEqual({ slug: slug.slice(0, 10), status: 404 });
      expect(await response.json()).toEqual({ error: { message: "Profile not found.", code: "PROFILE_NOT_FOUND" } });
    }
  });

  // Montado junto com os outros controllers (o ProfileController, com authGuard, vem
  // antes no app.routes): o guard "scoped" não pode vazar para a rota pública.
  it("dentro do appRoutes, abre sem sessão", async () => {
    const { appRoutes } = await import("@/app.routes");
    const owner = await IntegrationTestHelper.createTestUser();
    await updateProfileUseCase({ userId: owner.id, visibility: "public" });

    const response = await appRoutes.handle(new Request(`http://localhost/public/profiles/${owner.slug}`));

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ slug: owner.slug });
  });

  // O JSON público não pode carregar id nem e-mail do dono.
  it("o portfólio público não expõe id nem e-mail do dono", async () => {
    const owner = await IntegrationTestHelper.createTestUser();
    await updateProfileUseCase({ userId: owner.id, visibility: "public" });
    for (const [kind, ref] of [
      ["progress", ""],
      ["activity_category", "study"],
      ["activity_category", "exercise"],
    ] as const) {
      await updateProfileItemUseCase({ userId: owner.id, kind, ref, visible: true });
    }

    const body = await (await get(owner.slug)).text();

    expect(body).not.toContain(owner.id);
    expect(body).not.toContain(owner.email);
    expect(body).not.toContain("userId");
  });

  it("não aceita escrita", async () => {
    const owner = await IntegrationTestHelper.createTestUser();

    for (const method of ["POST", "PUT", "PATCH", "DELETE"]) {
      expect((await get(owner.slug, owner.cookie, method)).status).toBe(404);
    }
  });
});
