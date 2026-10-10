import { existsSync, readdirSync, readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import cards from "../cards.json";
import levels from "../levels.json";
import { validateContent } from "../src/engine/validate";

const sheetIds = new Set(
  readdirSync("characters")
    .filter((f) => f.endsWith(".md") && f !== "readme.md")
    .map((f) => f.split("-")[0]!),
);

describe("content", () => {
  it("cards.json and levels.json cross-reference correctly", () => {
    expect(validateContent(cards, levels)).toEqual([]);
  });

  it("every enemy, trap, mechanic and modifier used by levels has a character sheet", () => {
    const ids = [
      ...Object.keys(levels.enemies.spawnCostsBase),
      ...Object.keys(levels.content.traps),
      ...Object.keys(levels.content.mechanics),
      ...levels.campaign.modifierOrder.map((m) => `MOD_${m.toUpperCase()}`),
    ];
    expect(ids.filter((id) => !sheetIds.has(id))).toEqual([]);
  });

  it("every card and character sheet has a placeholder image", () => {
    const missing = [
      ...cards.cards.map((c) => `cards/${c.id}`),
      ...[...sheetIds].map((id) => `characters/${id}`),
    ].filter((p) => !existsSync(`assets/placeholders/${p}.svg`));
    expect(missing).toEqual([]);
  });

  it("modifier sheets declare the JSON key used by levels.json", () => {
    for (const key of levels.campaign.modifierOrder) {
      const file = readdirSync("characters").find((f) => f.startsWith(`MOD_${key.toUpperCase()}-`));
      expect(readFileSync(`characters/${file}`, "utf8")).toContain(`**JSON key:** \`${key}\``);
    }
  });
});
