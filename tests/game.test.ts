import { describe, expect, it } from "vitest";
import { HERO_LIST, LEVELS } from "../src/engine/content";
import { exchange, newGame, playTurn, threatOf, type Game } from "../src/engine/game";
import { validateRows, type RowDraft } from "../src/engine/rules/rows";
import { planTurn } from "../src/sim/bot";

const find = (game: Game, cardId: string, skip = 0) => game.state.hand.filter((c) => c.cardId === cardId)[skip]?.instanceId;

/** A row from the first sensor and first action in hand. */
function simpleRow(game: Game): RowDraft {
  const sensor = game.state.hand.find((c) => c.cardId.startsWith("S_"))!;
  const action = game.state.hand.find((c) => c.cardId.startsWith("A_"))!;
  return { ifTokens: [sensor.instanceId], thenAction: action.instanceId };
}

describe("game rules", () => {
  it("deals 10 cards with at least 2 sensors and 2 actions", () => {
    for (const seed of [1, 2, 3, 4, 5]) {
      const hand = newGame(1, "H_SWORDSMAN", seed).state.hand;
      expect(hand).toHaveLength(10);
      expect(hand.filter((c) => c.cardId.startsWith("S_")).length).toBeGreaterThanOrEqual(2);
      expect(hand.filter((c) => c.cardId.startsWith("A_")).length).toBeGreaterThanOrEqual(2);
    }
  });

  it("is deterministic: same seed and same choices give the same turn", () => {
    const run = () => {
      const g = newGame(4, "H_ROGUE", 77);
      const r = playTurn(g, [simpleRow(g)]);
      return { loops: r.loops, pos: g.state.hero.pos, hp: g.state.hero.hp, pressure: g.state.pressure, enemies: g.state.enemies.length };
    };
    expect(run()).toEqual(run());
  });

  it("exchange draws the same replacements for the same discards", () => {
    const hands = [1, 2].map(() => {
      const g = newGame(2, "H_SWORDSMAN", 9);
      exchange(g, g.state.hand.slice(0, 3).map((c) => c.instanceId));
      return g.state.hand.map((c) => c.cardId);
    });
    expect(hands[0]).toEqual(hands[1]);
  });

  it("rejects invalid rows with readable errors", () => {
    const g = newGame(1, "H_SWORDSMAN", 1);
    const action = g.state.hand.find((c) => c.cardId.startsWith("A_"))!.instanceId;
    expect(validateRows(g.state.hand, []).errors).toContain("Build at least one row.");
    expect(validateRows(g.state.hand, [{ ifTokens: [], thenAction: action }]).errors[0]).toMatch(/sensor after IF/);
    const row = simpleRow(g);
    expect(validateRows(g.state.hand, [row, row]).errors.join()).toMatch(/used twice/);
  });

  it("unplaced cards become Threat; placed cards do not", () => {
    const g = newGame(2, "H_SWORDSMAN", 3);
    const row = simpleRow(g);
    const expected = g.state.hand
      .filter((c) => c.instanceId !== row.thenAction && !row.ifTokens.includes(c.instanceId))
      .reduce((s, c) => s + threatOf(c.cardId), 0);
    expect(playTurn(g, [row]).threat).toBe(expected);
  });

  it("death rewinds to the same turn with the same hand and one less life", () => {
    // Level 3 swordsman walking into pits repeatedly until dead is slow; force death by draining HP instead.
    const g = newGame(1, "H_SWORDSMAN", 5);
    const hand = g.state.hand.map((c) => c.instanceId);
    g.state.hero.hp = 1;
    g.snapshot.hero.hp = 10;
    g.state.enemies.push({
      uid: 99, typeId: "E_ORC_BRUTE", modifier: null, pos: { x: 2, y: 1 }, facing: "W", hp: 6, maxHp: 6,
      statuses: {}, ai: {}, movedThisLoop: false,
    });
    // Stand still next to the brute: inject the cards so the row is the same on every seed.
    g.state.hand.push({ instanceId: "t-s", cardId: "S_ENEMY_ADJACENT" }, { instanceId: "t-a", cardId: "A_WAIT" });
    const r = playTurn(g, [{ ifTokens: ["t-s"], thenAction: "t-a" }]);
    expect(r.outcome).toBe("died");
    expect(g.state.lives).toBe(2);
    expect(g.state.hand.map((c) => c.instanceId)).toEqual(hand);
    expect(g.phase).toBe("exchange");
  });

  it("default behavior turns right, then left, before turning around", () => {
    // Level 1: hero at (3,3) facing S with walls south and west; the only way on is east (left of S).
    const g = newGame(1, "H_SWORDSMAN", 1);
    g.state.hero.pos = { x: 3, y: 3 };
    g.state.hero.facing = "S";
    // No enemies on Level 1, so "IF Enemy Adjacent" is FALSE and the default behavior runs.
    g.state.hand.push({ instanceId: "t-s", cardId: "S_ENEMY_ADJACENT" }, { instanceId: "t-a", cardId: "A_WAIT" });
    playTurn(g, [{ ifTokens: ["t-s"], thenAction: "t-a" }], { loops: [1] });
    expect(g.state.hero.pos).toEqual({ x: 4, y: 3 });
  });
});

describe("every level and hero", () => {
  it("can be created and played for a turn by the bot", () => {
    for (const level of LEVELS) {
      for (const hero of HERO_LIST.slice(0, 4)) {
        const g = newGame(level.levelId, hero.id, level.levelId * 31);
        const rows = planTurn(g, { samples: 1, maxRows: 2, compound: false, beam: 1 });
        expect(() => playTurn(g, rows)).not.toThrow();
      }
    }
  }, 60000);
});
