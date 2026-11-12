import { afterEach, beforeAll, describe, expect, it } from "bun:test";
import { MetricRepository } from "@/metrics/infra/metric.repository";
import { IntegrationTestHelper } from "@/shared/utils/test-helpers/integration-test-helper";
import { ProfileController } from "./profile.controller";
import { ProfileItemRepository } from "./profile-item.repository";

function request(method: string, path: string, cookie: string, body?: unknown, contentType = "application/json") {
  return ProfileController.handle(
    new Request(`http://localhost/profile${path}`, {
      method,
      headers: { cookie, "content-type": contentType },
      body: body === undefined ? undefined : typeof body === "string" ? body : JSON.stringify(body),
    }),
  );
}

describe("ProfileController - Integration", () => {
  beforeAll(() => IntegrationTestHelper.setupTestDatabase());
  afterEach(() => IntegrationTestHelper.truncateAll());

  it("as três rotas respondem 401 UNAUTHORIZED sem sessão", async () => {
    const calls = [
      request("PATCH", "", "", { visibility: "public" }),
      request("GET", "/items", ""),
      request("PATCH", "/items", "", { kind: "progress", ref: "", visible: true }),
    ];

    for (const response of await Promise.all(calls)) {
      expect(response.status).toBe(401);
      expect(await response.json()).toMatchObject({ error: { code: "UNAUTHORIZED" } });
    }
  });

  it("PATCH /api/profile (sem barra no fim) troca a visibilidade e devolve só slug e visibility", async () => {
    const user = await IntegrationTestHelper.createTestUser();

    const response = await request("PATCH", "", user.cookie, { visibility: "public" });

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ slug: user.slug, visibility: "public" });
  });

  it("PATCH /api/profile recusa visibilidade fora da lista com 422 VALIDATION", async () => {
    const user = await IntegrationTestHelper.createTestUser();

    for (const body of [{ visibility: "friends" }, {}]) {
      const response = await request("PATCH", "", user.cookie, body);

      expect(response.status).toBe(422);
      expect(await response.json()).toMatchObject({ error: { code: "VALIDATION" } });
    }
  });

  it("PATCH /api/profile/items recusa kind inválido e ref acima de 40 caracteres com 422 VALIDATION", async () => {
    const user = await IntegrationTestHelper.createTestUser();

    for (const body of [
      { kind: "email", ref: "", visible: true },
      { kind: "metric", ref: "1".repeat(41), visible: true },
      { kind: "progress", ref: "", visible: "yes" },
    ]) {
      const response = await request("PATCH", "/items", user.cookie, body);

      expect(response.status).toBe(422);
      expect(await response.json()).toMatchObject({ error: { code: "VALIDATION" } });
    }
  });

  it("PATCH /api/profile/items com a métrica de outro usuário responde 404 NOT_FOUND e não grava nada", async () => {
    const owner = await IntegrationTestHelper.createTestUser();
    const attacker = await IntegrationTestHelper.createTestUser();
    const metric = await MetricRepository.create({ userId: owner.id, name: "Weight", unit: "kg" });

    const response = await request("PATCH", "/items", attacker.cookie, {
      kind: "metric",
      ref: String(metric.id),
      visible: true,
    });

    expect(response.status).toBe(404);
    expect(await response.json()).toMatchObject({ error: { code: "NOT_FOUND" } });
    expect(await ProfileItemRepository.findAll(attacker.id)).toHaveLength(0);
    expect(await ProfileItemRepository.findAll(owner.id)).toHaveLength(0);
  });

  it("PATCH /api/profile/items recusa corpo urlencoded com 400 PARSE", async () => {
    const user = await IntegrationTestHelper.createTestUser();

    const response = await request(
      "PATCH",
      "/items",
      user.cookie,
      "kind=progress&ref=&visible=true",
      "application/x-www-form-urlencoded",
    );

    expect(response.status).toBe(400);
    expect(await response.json()).toMatchObject({ error: { code: "PARSE" } });
  });

  it("GET /api/profile/items não lista as métricas de outro usuário", async () => {
    const owner = await IntegrationTestHelper.createTestUser();
    const other = await IntegrationTestHelper.createTestUser();
    await MetricRepository.create({ userId: other.id, name: "Secret", unit: "" });

    const response = await request("GET", "/items", owner.cookie);

    expect(response.status).toBe(200);
    const items = (await response.json()) as { kind: string; label: string }[];
    expect(items.map((item) => item.kind)).toEqual(["progress", "activity_category", "activity_category"]);
  });
});
