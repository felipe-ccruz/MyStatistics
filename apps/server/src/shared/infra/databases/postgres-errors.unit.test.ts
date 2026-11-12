import { describe, expect, it } from "bun:test";
import { isForeignKeyViolation, isUniqueViolation, uniqueViolationConstraint } from "./postgres-errors";

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

describe("isForeignKeyViolation", () => {
  it("reconhece o 23503, direto ou dentro da cause", () => {
    const driverError = Object.assign(new Error("violates foreign key"), { code: "23503" });

    expect(isForeignKeyViolation(driverError)).toBe(true);
    expect(isForeignKeyViolation(new Error("Failed query", { cause: driverError }))).toBe(true);
  });

  it("ignora outros erros", () => {
    expect(isForeignKeyViolation(Object.assign(new Error("duplicate key"), { code: "23505" }))).toBe(false);
    expect(isForeignKeyViolation(new Error("connection refused"))).toBe(false);
    expect(isForeignKeyViolation(undefined)).toBe(false);
  });
});

describe("uniqueViolationConstraint", () => {
  it("devolve o nome da constraint violada, direto ou dentro da cause", () => {
    const driverError = Object.assign(new Error("duplicate key"), {
      code: "23505",
      constraint_name: "users_email_unique",
    });

    expect(uniqueViolationConstraint(driverError)).toBe("users_email_unique");
    expect(uniqueViolationConstraint(new Error("Failed query", { cause: driverError }))).toBe("users_email_unique");
  });

  it("devolve null para outros erros", () => {
    expect(
      uniqueViolationConstraint(Object.assign(new Error("fk"), { code: "23503", constraint_name: "x" })),
    ).toBeNull();
    expect(uniqueViolationConstraint(new Error("connection refused"))).toBeNull();
  });
});
