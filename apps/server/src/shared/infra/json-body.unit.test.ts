import { describe, expect, it } from "bun:test";
import { assertJsonBody } from "./json-body";

describe("assertJsonBody", () => {
  it("aceita JSON, em qualquer caixa", () => {
    expect(() => assertJsonBody("application/json")).not.toThrow();
    expect(() => assertJsonBody("Application/JSON")).not.toThrow();
  });

  it("aceita requisição sem corpo", () => {
    expect(() => assertJsonBody("")).not.toThrow();
  });

  it("recusa os tipos que um formulário de outro site consegue enviar com 400 PARSE", () => {
    for (const contentType of ["application/x-www-form-urlencoded", "multipart/form-data", "text/plain"]) {
      expect(() => assertJsonBody(contentType)).toThrow(expect.objectContaining({ status: 400, apiCode: "PARSE" }));
    }
  });
});
