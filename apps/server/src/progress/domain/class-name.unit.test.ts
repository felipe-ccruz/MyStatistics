import { describe, expect, it } from "bun:test";
import { classNameOf } from "./class-name";

describe("classNameOf", () => {
  it("INT dominante → Arcane Student", () => {
    expect(classNameOf({ int: 40, str: 39 })).toBe("Arcane Student");
  });

  it("STR dominante → Iron Warrior", () => {
    expect(classNameOf({ int: 10, str: 11 })).toBe("Iron Warrior");
  });

  it("empate → Adventurer, inclusive no 0 (sem atividade) e no 100", () => {
    expect(classNameOf({ int: 50, str: 50 })).toBe("Adventurer");
    expect(classNameOf({ int: 0, str: 0 })).toBe("Adventurer");
    expect(classNameOf({ int: 100, str: 100 })).toBe("Adventurer");
  });
});
