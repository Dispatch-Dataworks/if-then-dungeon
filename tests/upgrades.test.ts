import { describe, expect, it } from "vitest";
import { HERO_LIST } from "../src/engine/content";
import { newGame, playTurn, type Game } from "../src/engine/game";
import type { EnemyState } from "../src/engine/state";
import { senseCard } from "../src/engine/rules/sensors";
import { applyHeroStatus, unlockedUpgrades } from "../src/engine/upgrades";

/** Level 1, hero at (3,3)... every scenario places what it needs and runs one loop of one row. */
function setup(heroId: string, upgrades: string[], hero: { x: number; y: number; facing: "N" | "E" | "S" | "W" }) {
  const g = newGame(1, heroId, 1, upgrades);
  g.state.enemies = [];
  g.state.hero.pos = { x: hero.x, y: hero.y };
  g.state.hero.facing = hero.facing;
  g.phase = "build";
  return g;
}

function enemy(g: Game, typeId: string, x: number, y: number, extra: Partial<EnemyState> = {}): EnemyState {
  const e: EnemyState = {
    uid: 100 + g.state.enemies.length, typeId, modifier: null, pos: { x, y }, facing: "W", hp: 6, maxHp: 6,
    statuses: {}, ai: {}, movedThisLoop: false, ...extra,
  };
  g.state.enemies.push(e);
  return e;
}

/** Runs `loops` loops of "IF <sensor> THEN <action>" with cards injected into the hand. */
function playTurnWith(g: Game, sensor: string, action: string, loops: number) {
  g.state.hand.push({ instanceId: "t-s", cardId: sensor }, { instanceId: "t-a", cardId: action });
  return playTurn(g, [{ ifTokens: ["t-s"], thenAction: "t-a" }], { loops: [loops] });
}

/** Runs one loop of "IF <sensor> THEN <action>" with cards injected into the hand. */
function run(g: Game, sensor: string, action: string) {
  g.state.hand.push({ instanceId: "t-s", cardId: sensor }, { instanceId: "t-a", cardId: action });
  return playTurn(g, [{ ifTokens: ["t-s"], thenAction: "t-a" }], { loops: [1] });
}

describe("upgrade unlocking", () => {
  it("unlocks upgrades after 2, 4 and 6 levels cleared with the hero", () => {
    expect(unlockedUpgrades("H_SWORDSMAN", 0)).toEqual([]);
    expect(unlockedUpgrades("H_SWORDSMAN", 2)).toEqual(["U_CLEAVE"]);
    expect(unlockedUpgrades("H_SWORDSMAN", 6)).toEqual(["U_CLEAVE", "U_PARRY", "U_HEAVY_BOOTS"]);
  });

  it("every hero has 3 upgrades and every upgrade id is handled by the engine", async () => {
    const src = ["effects", "hero", "game", "enemy", "upgrades", "state", "rules/sensors"]
      .map((f) => import.meta.glob("../src/engine/**/*.ts", { query: "?raw", import: "default", eager: true })[`../src/engine/${f}.ts`] as string)
      .join("\n");
    for (const h of HERO_LIST) {
      expect(h.upgrades).toHaveLength(3);
      for (const u of h.upgrades) expect(src, `${u.id} is not referenced in the engine`).toContain(`"${u.id}"`);
    }
  });
});

describe("upgrade effects", () => {
  // Level 1 map: row 1 is "#@..#..A#"; (1,1) start, (2,1) and (3,1) open, (4,1) wall.
  it("Cleave hits the enemy behind the target", () => {
    for (const [ups, expected] of [[[], 6], [["U_CLEAVE"], 4]] as const) {
      const g = setup("H_SWORDSMAN", [...ups], { x: 1, y: 1, facing: "E" });
      enemy(g, "E_ORC_BRUTE", 2, 1);
      const behind = enemy(g, "E_ORC_BRUTE", 3, 1);
      run(g, "S_ENEMY_AHEAD", "A_HERO_ATTACK");
      expect(behind.hp).toBe(expected);
    }
  });

  it("Parry reduces the first hit each turn by 1", () => {
    const hits = (ups: string[]) => {
      const g = setup("H_SWORDSMAN", ups, { x: 1, y: 1, facing: "S" });
      enemy(g, "E_ORC_BRUTE", 2, 1);
      const r = run(g, "S_ENEMY_ADJACENT", "A_WAIT");
      // Sum the hits from events (end-of-turn healing would hide a 1-point difference in HP).
      return r.frames.flatMap((f) => f.events).filter((e) => e.kind === "hero_hurt").reduce((n, e) => n + (e.amount ?? 0), 0);
    };
    expect(hits([])).toBeGreaterThan(0);
    expect(hits(["U_PARRY"])).toBe(hits([]) - 1);
  });

  it("Quickdraw extends the Archer's range to 4", () => {
    for (const [ups, hit] of [[[], false], [["U_QUICKDRAW"], true]] as const) {
      const g = setup("H_ARCHER", [...ups], { x: 1, y: 1, facing: "S" });
      const e = enemy(g, "E_ORC_BRUTE", 1, 5); // 4 tiles south down the open column
      run(g, "S_ENEMY_VISIBLE", "A_HERO_ATTACK");
      expect(e.hp < 6).toBe(hit);
    }
  });

  it("Backstab raises the Rogue's bonus against unaware enemies", () => {
    const dealt = (ups: string[]) => {
      const g = setup("H_ROGUE", ups, { x: 1, y: 1, facing: "E" });
      const e = enemy(g, "E_ORC_BRUTE", 2, 1, { facing: "E" }); // facing away: unaware
      run(g, "S_ENEMY_AHEAD", "A_HERO_ATTACK");
      return 6 - e.hp;
    };
    expect(dealt(["U_BACKSTAB"])).toBe(dealt([]) + 2); // +1 base and a +3 (instead of +2) bonus
  });

  it("Antitoxin and Curse Mitigation give immunity; Blood Resistance caps bleed", () => {
    const g = setup("H_SWORDSMAN", ["U_ANTITOXIN", "U_BLOOD_RESISTANCE", "U_CURSE_MITIGATION"], { x: 1, y: 1, facing: "E" });
    expect(applyHeroStatus(g.state, "poison", 3)).toBe(false);
    applyHeroStatus(g.state, "bleed", 3);
    expect(applyHeroStatus(g.state, "cursed")).toBe(false);
    expect(g.state.hero.statuses).toEqual({ bleed: 1 });
  });

  it("Ward blocks fear in the first 2 loops of a turn only", () => {
    const g = setup("H_CLERIC", ["U_WARD"], { x: 1, y: 1, facing: "E" });
    expect(applyHeroStatus(g.state, "fear")).toBe(false);
    g.state.loopInTurn = 2;
    expect(applyHeroStatus(g.state, "fear")).toBe(true);
  });

  it("Trap Sense lets trap sensors see 2 tiles ahead", () => {
    const g = newGame(2, "H_ROGUE", 1, ["U_TRAP_SENSE"]);
    const plain = newGame(2, "H_ROGUE", 1);
    // Level 2 row 1 is "#@.s...A#": spikes are 2 tiles east of the start.
    expect(senseCard(g.state, "S_SPIKES_AHEAD")).toBe(true);
    expect(senseCard(plain.state, "S_SPIKES_AHEAD")).toBe(false);
  });

  it("Bulwark ignores the first trap's damage each turn", () => {
    // 12 HP, spikes deal 2, and +1 HP comes back at the end of the turn.
    for (const [ups, hp] of [[[], 11], [["U_BULWARK"], 12]] as const) {
      const g = newGame(2, "H_SHIELDBEARER", 1, [...ups]);
      g.state.enemies = [];
      g.state.hero.pos = { x: 2, y: 1 };
      g.phase = "build";
      run(g, "S_WALL_AHEAD", "A_MOVE_FWD"); // wall not ahead, so default: forward onto the spikes
      expect(g.state.hero.hp).toBe(hp);
    }
  });

  it("Unstoppable ignores snare once per turn", () => {
    const g = setup("H_BERSERKER", ["U_UNSTOPPABLE"], { x: 1, y: 1, facing: "E" });
    g.state.hero.statuses.snare_root = 2;
    run(g, "S_ENEMY_AHEAD", "A_WAIT"); // false: default moves forward
    expect(g.state.hero.pos).toEqual({ x: 2, y: 1 });
  });

  it("Cleanse removes one harmful status after acting", () => {
    const g = setup("H_CLERIC", ["U_CLEANSE"], { x: 1, y: 1, facing: "E" });
    g.state.hero.statuses.fear = 3;
    run(g, "S_WALL_AHEAD", "A_WAIT");
    expect(g.state.hero.statuses.fear).toBeUndefined();
  });

  it("Rage Meter adds 1 to the next Heavy Strike after taking damage", () => {
    const dealt = (ups: string[]) => {
      const g = setup("H_BERSERKER", ups, { x: 1, y: 1, facing: "E" });
      const e = enemy(g, "E_ORC_BRUTE", 2, 1, { hp: 20, maxHp: 20 });
      g.state.hero.rage = ups.length > 0;
      run(g, "S_ENEMY_AHEAD", "A_HERO_ATTACK");
      return 20 - e.hp;
    };
    expect(dealt(["U_RAGE_METER"])).toBe(dealt([]) + 1);
  });

  it("Illumination extends Arc Bolt from 4 to 5 tiles", () => {
    // Level 17 row 7 is "#C.b......DX#": tiles x=4..9 are open floor in a straight line.
    for (const [ups, hit] of [[[], false], [["U_ILLUMINATION"], true]] as const) {
      const g = newGame(17, "H_BATTLEMAGE", 1, [...ups]);
      g.state.enemies = [];
      g.state.hero.pos = { x: 4, y: 7 };
      g.state.hero.facing = "E";
      g.state.hero.sightRange = 9;
      g.phase = "build";
      const e = enemy(g, "E_ORC_BRUTE", 9, 7);
      run(g, "S_ENEMY_VISIBLE", "A_HERO_ATTACK");
      expect(e.hp < 6).toBe(hit);
    }
  });

  it("Evasion reduces every melee hit, not just the first", () => {
    const g = setup("H_ARCHER", ["U_EVASION"], { x: 1, y: 1, facing: "S" });
    enemy(g, "E_ORC_BRUTE", 2, 1);
    const r = playTurnWith(g, "S_ENEMY_ADJACENT", "A_WAIT", 3);
    const hits = r.frames.flatMap((f) => f.events).filter((e) => e.kind === "hero_hurt").map((e) => e.amount);
    expect(hits.every((n) => n === 1)).toBe(true); // brute deals 2, archer has no armor: 1 each time
  });

  it("stat upgrades raise max HP and armor", () => {
    expect(newGame(5, "H_ALCHEMIST", 1, ["U_ANTITOXIN"]).state.hero.maxHp).toBe(10);
    expect(newGame(20, "H_HUNTER", 1, ["U_BLOOD_SENSE"]).state.hero.maxHp).toBe(11);
    expect(newGame(14, "H_BATTLEMAGE", 1, ["U_CURSE_MITIGATION"]).state.hero.armor).toBe(2);
    expect(newGame(8, "H_MONK", 1, ["U_VENT_MASTERY", "U_PUSH_PLATE_RESIST"]).state.hero).toMatchObject({ maxHp: 11, armor: 2 });
  });

  it("Wardbreaker ignores 1 armor", () => {
    const dealt = (ups: string[]) => {
      const g = setup("H_BATTLEMAGE", ups, { x: 1, y: 1, facing: "S" });
      const e = enemy(g, "E_ORC_WARDEN", 1, 3, { hp: 10, maxHp: 10 });
      run(g, "S_ENEMY_VISIBLE", "A_HERO_ATTACK");
      return 10 - e.hp;
    };
    expect(dealt(["U_WARDBREAKER"])).toBe(dealt([]) + 2); // +1 damage and its 1 armor ignored
  });
});
