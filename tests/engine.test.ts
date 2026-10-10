import { describe, expect, it } from "vitest";
import { buildDeck, draw } from "../src/engine/deck";
import { parsePredicate } from "../src/engine/rules/parse";
import { createRng, roll, shuffle } from "../src/engine/rng";

describe("rng", () => {
  it("is deterministic for the same seed", () => {
    const a = createRng(42), b = createRng(42);
    expect([1, 2, 3, 4].map(() => roll(a, 6))).toEqual([1, 2, 3, 4].map(() => roll(b, 6)));
  });
  it("shuffles identically for the same seed", () => {
    const items = [1, 2, 3, 4, 5, 6, 7, 8];
    expect(shuffle(createRng(7), items)).toEqual(shuffle(createRng(7), items));
  });
});

describe("deck", () => {
  it("draws and reshuffles discards when empty", () => {
    const cards = Array.from({ length: 3 }, (_, i) => ({ instanceId: `i${i}`, cardId: "A_WAIT" }));
    const rng = createRng(1);
    const deck = buildDeck(rng, cards);
    const hand = draw(rng, deck, 3);
    deck.discardPile.push(...hand);
    expect(draw(rng, deck, 3)).toHaveLength(3);
  });
});

describe("parsePredicate", () => {
  const s = (id: string) => ({ kind: "sensor", id }) as const;
  const op = (o: "NOT" | "AND" | "OR") => ({ kind: "op", op: o }) as const;

  it("binds AND tighter than OR", () => {
    const p = parsePredicate([s("A"), op("OR"), s("B"), op("AND"), s("C")]);
    expect(p).toEqual({
      kind: "or",
      left: { kind: "sensor", id: "A" },
      right: { kind: "and", left: { kind: "sensor", id: "B" }, right: { kind: "sensor", id: "C" } },
    });
  });
  it("binds NOT tighter than AND", () => {
    const p = parsePredicate([op("NOT"), s("A"), op("AND"), s("B")]);
    expect(p.kind).toBe("and");
  });
  it("rejects dangling operators", () => {
    expect(() => parsePredicate([s("A"), op("AND")])).toThrow();
  });
});
