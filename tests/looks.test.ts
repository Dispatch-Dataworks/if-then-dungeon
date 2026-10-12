import { describe, expect, it } from "vitest";
import { HERO_LIST } from "../src/engine/content";
import { defaultHeroLook, enemyArtKey, heroArtKey, toggleHeroLook } from "../src/ui/looks";

const allArt = () => true;
const noArt = () => false;

describe("character looks", () => {
  it("default to a mixed roster", () => {
    const looks = HERO_LIST.map((h) => defaultHeroLook(h.id));
    expect(looks.filter((l) => l === "f")).toHaveLength(HERO_LIST.length / 2);
    expect(looks.slice(0, 4).filter((l) => l === "f")).toHaveLength(2); // the starter heroes too
  });

  it("fall back to the original art until a look's art exists", () => {
    const girl = HERO_LIST.find((h) => defaultHeroLook(h.id) === "f")!.id;
    expect(heroArtKey(girl, noArt)).toBe(girl);
    expect(heroArtKey(girl, allArt)).toBe(`${girl}--f`);
  });

  it("follow the player's choice", () => {
    const id = HERO_LIST[0]!.id;
    const before = heroArtKey(id, allArt);
    toggleHeroLook(id);
    expect(heroArtKey(id, allArt)).not.toBe(before);
    toggleHeroLook(id);
    expect(heroArtKey(id, allArt)).toBe(before);
  });

  it("give enemies a repeatable mix by spawn uid", () => {
    const keys = Array.from({ length: 40 }, (_, uid) => enemyArtKey("E_GOBLIN_SCOUT", uid, allArt));
    expect(new Set(keys)).toEqual(new Set(["E_GOBLIN_SCOUT", "E_GOBLIN_SCOUT--f"]));
    expect(Array.from({ length: 40 }, (_, uid) => enemyArtKey("E_GOBLIN_SCOUT", uid, allArt))).toEqual(keys);
    expect(enemyArtKey("E_GOBLIN_SCOUT", 3, noArt)).toBe("E_GOBLIN_SCOUT");
  });
});
