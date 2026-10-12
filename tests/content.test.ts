import { existsSync, readdirSync, readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import cards from "../cards.json";
import enemies from "../enemies.json";
import heroes from "../heroes.json";
import levels from "../levels.json";
import themes from "../themes.json";
import { validateBoard, validateCatalogs, validateContent } from "../src/engine/validate";

const sheetIds = new Set(
  readdirSync("characters")
    .filter((f) => f.endsWith(".md") && f !== "readme.md")
    .map((f) => f.split("-")[0]!),
);

describe("content", () => {
  it("cards.json and levels.json cross-reference correctly", () => {
    expect(validateContent(cards, levels)).toEqual([]);
  });

  it("heroes.json, enemies.json and themes.json agree with levels.json", () => {
    expect(validateCatalogs(heroes, enemies, themes, levels)).toEqual([]);
  });

  it("every hero, enemy, modifier, trap, mechanic, obstacle and pickup has a character sheet", () => {
    const ids = [
      ...heroes.heroes.map((h) => h.id),
      ...Object.keys(levels.enemies.spawnCostsBase),
      ...Object.keys(levels.enemies.modifierCostAdders).map((m) => `MOD_${m.toUpperCase()}`),
      ...Object.keys(levels.content.traps),
      ...Object.keys(levels.content.mechanics),
      ...Object.keys(levels.content.obstacles),
      ...Object.keys(levels.content.pickups),
    ];
    expect(ids.filter((id) => !sheetIds.has(id))).toEqual([]);
  });

  it("every obstacle is used by at least one level", () => {
    const used = new Set(levels.levels.flatMap((l) => l.obstacles));
    expect(Object.keys(levels.content.obstacles).filter((id) => !used.has(id))).toEqual([]);
  });

  it("every card and character sheet has a placeholder image", () => {
    const missing = [
      ...cards.cards.map((c) => `cards/${c.id}`),
      ...[...sheetIds].map((id) => `characters/${id}`),
    ].filter((p) => !existsSync(`assets/placeholders/${p}.svg`));
    expect(missing).toEqual([]);
  });

  it("modifier sheets declare the JSON key used by levels.json", () => {
    for (const key of Object.keys(levels.enemies.modifierCostAdders)) {
      const file = readdirSync("characters").find((f) => f.startsWith(`MOD_${key.toUpperCase()}-`));
      expect(readFileSync(`characters/${file}`, "utf8")).toContain(`**JSON key:** \`${key}\``);
    }
  });
});

describe("validateBoard", () => {
  const level = levels.levels[0]!;
  const withMap = (map: string[]) => validateBoard({ ...level, board: { ...level.board, map } }, levels);

  it("accepts the real level 1 map", () => {
    expect(withMap(level.board.map)).toEqual([]);
  });

  it("rejects an unreachable exit", () => {
    const map = level.board.map.map((row) => row.replace("#X#", "##X").replace("#B#", "###"));
    expect(withMap(map).join("\n")).toMatch(/exit is not reachable|spawn point SP_B/);
  });

  it("rejects an open border and a ragged row", () => {
    expect(withMap(level.board.map.map((r, i) => (i === 0 ? `.${r.slice(1)}` : r))).join()).toMatch(/border tile/);
    expect(withMap([...level.board.map.slice(0, -1), "##"]).join()).toMatch(/same length/);
  });

  it("rejects traps that the level does not list", () => {
    expect(withMap(level.board.map.map((r) => r.replace("#@..", "#@s.")))).toContainEqual(
      expect.stringMatching(/traps on map \[T_SPIKES\]/),
    );
  });
});

describe("final art", () => {
  const folders = readdirSync("assets/art", { withFileTypes: true }).filter((d) => d.isDirectory()).map((d) => d.name);
  const faces = JSON.parse(readFileSync("assets/art/faces.json", "utf8")) as Record<string, unknown>;
  const cardIds = new Set(cards.cards.map((c) => c.id));

  it("is filed under real content IDs (optionally with a --f look), each with a card still or tile image", () => {
    for (const folder of folders) {
      const [id, look, ...rest] = folder.split("--");
      expect(rest, folder).toEqual([]);
      if (look !== undefined) expect(look, folder).toBe("f");
      expect(sheetIds.has(id!) || cardIds.has(id!), folder).toBe(true);
      const files = readdirSync(`assets/art/${folder}`);
      expect(files.includes("card.webp") || files.includes("tile.webp"), `${folder}: card.webp or tile.webp`).toBe(true);
    }
  });

  it("has face crops only for art that exists", () => {
    for (const id of Object.keys(faces).filter((k) => !k.startsWith("_"))) expect(folders, id).toContain(id);
  });
});
