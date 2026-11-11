import { describe, expect, it } from "bun:test";
import { isUniqueViolation } from "./postgres-errors";

describe("isUniqueViolation", () => {
  it("reconhece o erro do driver com SQLSTATE 23505", () => {
    expect(isUniqueViolation(Object.assign(new Error("duplicate key"), { code: "23505" }))).toBe(true);
  });

  it("reconhece o 23505 dentro do erro embrulhado pelo Drizzle (cause)", () => {
    const driverError = Object.assign(new Error("duplicate key"), { code: "23505" });

    expect(isUniqueViolation(new Error("Failed query", { cause: driverError }))).toBe(true);
  });

  it("ignora outros erros", () => {
    expect(isUniqueViolation(Object.assign(new Error("fk"), { code: "23503" }))).toBe(false);
    expect(isUniqueViolation(new Error("connection refused"))).toBe(false);
    expect(isUniqueViolation("23505")).toBe(false);
    expect(isUniqueViolation(null)).toBe(false);
  });
});
