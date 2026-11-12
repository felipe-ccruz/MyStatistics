import { describe, expect, it } from "bun:test";
import { hasControlCharacter } from "./text";

describe("hasControlCharacter", () => {
  it("acha byte nulo, quebra de linha, tab e DEL", () => {
    for (const text of ["a\u0000b", "\u0000", "a\nb", "a\tb", "\u001f", "a\u007f"]) {
      expect(hasControlCharacter(text)).toBe(true);
    }
  });

  it("aceita texto comum, acentos e emoji", () => {
    for (const text of ["", "Calculus", "Álgebra Linear", "kg/m²", "😀", "~"]) {
      expect(hasControlCharacter(text)).toBe(false);
    }
  });
});
