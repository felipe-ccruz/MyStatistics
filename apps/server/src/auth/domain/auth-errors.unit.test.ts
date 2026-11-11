import { describe, expect, it } from "bun:test";
import { APIError } from "better-auth/api";
import { toAuthHttpError, withAuthErrors } from "./auth-errors";

describe("toAuthHttpError", () => {
  it("traduz e-mail já cadastrado em 409 EMAIL_TAKEN", () => {
    for (const code of ["USER_ALREADY_EXISTS", "USER_ALREADY_EXISTS_USE_ANOTHER_EMAIL"]) {
      const error = new APIError("UNPROCESSABLE_ENTITY", { code, message: "User already exists." });

      expect(toAuthHttpError(error)).toMatchObject({ status: 409, apiCode: "EMAIL_TAKEN" });
    }
  });

  it("traduz e-mail ou senha errados em 401 INVALID_CREDENTIALS", () => {
    const error = new APIError("UNAUTHORIZED", { code: "INVALID_EMAIL_OR_PASSWORD", message: "Invalid" });

    expect(toAuthHttpError(error)).toMatchObject({
      status: 401,
      apiCode: "INVALID_CREDENTIALS",
      message: "Invalid email or password.",
    });
  });

  it("traduz senha fora do tamanho em 422 VALIDATION", () => {
    const error = new APIError("BAD_REQUEST", { code: "PASSWORD_TOO_SHORT", message: "Password too short" });

    expect(toAuthHttpError(error)).toMatchObject({ status: 422, apiCode: "VALIDATION" });
  });

  it("traduz outro 401 da lib em UNAUTHORIZED", () => {
    const error = new APIError("UNAUTHORIZED", { code: "FAILED_TO_GET_SESSION", message: "Failed" });

    expect(toAuthHttpError(error)).toMatchObject({ status: 401, apiCode: "UNAUTHORIZED" });
  });

  it("devolve null para erro desconhecido, que vira 500 INTERNAL", () => {
    const apiError = new APIError("INTERNAL_SERVER_ERROR", { code: "FAILED_TO_GET_SESSION", message: "Failed" });

    expect(toAuthHttpError(apiError)).toBeNull();
    expect(toAuthHttpError(new Error("connection refused"))).toBeNull();
  });
});

describe("withAuthErrors", () => {
  it("devolve o resultado da chamada quando ela dá certo", async () => {
    expect(await withAuthErrors(async () => "ok")).toBe("ok");
  });

  it("relança o erro do Better Auth já traduzido", async () => {
    const call = async () => {
      throw new APIError("UNAUTHORIZED", { code: "INVALID_EMAIL_OR_PASSWORD", message: "Invalid" });
    };

    await expect(withAuthErrors(call)).rejects.toMatchObject({ status: 401, apiCode: "INVALID_CREDENTIALS" });
  });

  it("relança o erro original quando não sabe traduzir", async () => {
    const original = new Error("connection refused");

    await expect(
      withAuthErrors(async () => {
        throw original;
      }),
    ).rejects.toBe(original);
  });
});
