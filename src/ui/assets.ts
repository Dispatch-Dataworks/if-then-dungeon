/**
 * Art and character-sheet lookups by content ID. Placeholder images live in assets/placeholders/ and will be
 * replaced by final art with the same file names, so everything here is keyed by ID only.
 */
const cardFiles = import.meta.glob("../../assets/placeholders/cards/*.svg", { eager: true, query: "?url", import: "default" }) as Record<string, string>;
const charFiles = import.meta.glob("../../assets/placeholders/characters/*.svg", { eager: true, query: "?url", import: "default" }) as Record<string, string>;
const sheetFiles = import.meta.glob("../../characters/*.md", { eager: true, query: "?raw", import: "default" }) as Record<string, string>;

const byId = (files: Record<string, string>) =>
  new Map(Object.entries(files).map(([path, url]) => [path.split("/").pop()!.replace(/\.svg$/, ""), url]));

const CARD_ART = byId(cardFiles);
const CHAR_ART = byId(charFiles);

/** Image URL for a card, hero, enemy, trap, obstacle, pickup, mechanic or modifier (e.g. "iron" -> MOD_IRON). */
export function artUrl(id: string): string | undefined {
  return CARD_ART.get(id) ?? CHAR_ART.get(id) ?? CHAR_ART.get(`MOD_${id.toUpperCase()}`);
}

interface Sheet {
  name: string;
  sections: Map<string, string>;
}

const SHEETS = new Map<string, Sheet>();
for (const [path, text] of Object.entries(sheetFiles)) {
  const id = path.split("/").pop()!.split("-")[0]!;
  const lines = text.split(/\r?\n/);
  const name = (lines[0] ?? "").replace(/^#\s*/, "").replace(/\s*\(Modifier\)\s*$/, "").trim();
  const sections = new Map<string, string>();
  let current = "";
  for (const line of lines.slice(1)) {
    const m = /^##\s+(.*)$/.exec(line);
    if (m) {
      current = m[1]!.trim().toLowerCase();
      sections.set(current, "");
    } else if (current) sections.set(current, sections.get(current)! + line + "\n");
  }
  SHEETS.set(id, { name, sections });
}

/** Display name from the character sheet title (traps, obstacles, mechanics and pickups have no name in JSON). */
export function sheetName(id: string): string | undefined {
  return SHEETS.get(id)?.name;
}

/** First paragraph of a sheet section, with markdown emphasis stripped and card IDs turned into names. */
export function sheetParagraph(id: string, section: string, nameOf: (cardId: string) => string, allowList = false): string | undefined {
  const body = SHEETS.get(id)?.sections.get(section.toLowerCase());
  if (!body) return undefined;
  let para = body.trim().split(/\n\s*\n/)[0];
  if (para && allowList && para.startsWith("-")) para = para.split("\n").map((l) => l.replace(/^\s*-\s*/, "")).join(" ");
  if (!para || para.startsWith("|") || para.startsWith("-")) return undefined;
  return para
    .replace(/\*\*([A-Z][A-Z0-9_]+)\*\*/g, (_, id: string) => nameOf(id))
    .replace(/`([A-Z][A-Z0-9_]+)`/g, (_, id: string) => nameOf(id))
    .replace(/\*\*|__|`/g, "")
    .replace(/\s+/g, " ")
    .trim();
}
