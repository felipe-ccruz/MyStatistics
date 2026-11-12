import { describe, expect, it } from "bun:test";
import { Elysia, t } from "elysia";
import { IdParam } from "./id-param";

const app = new Elysia().get("/items/:id", ({ params }) => ({ id: params.id }), { params: t.Object({ id: IdParam }) });

function get(id: string) {
  return app.handle(new Request(`http://localhost/items/${encodeURIComponent(id)}`));
}

describe("IdParam", () => {
  it("aceita inteiros de 1 até o limite do integer do Postgres, já como número", async () => {
    for (const [text, id] of [
      ["1", 1],
      ["42", 42],
      ["2147483647", 2147483647],
    ] as const) {
      const response = await get(text);

      expect(response.status).toBe(200);
      expect(await response.json()).toEqual({ id });
    }
  });

  it("recusa fração, zero, negativo, fora do limite e texto com 422", async () => {
    for (const text of ["1.5", "0", "-3", "2147483648", "99999999999", "abc"]) {
      expect((await get(text)).status).toBe(422);
    }
  });
});
