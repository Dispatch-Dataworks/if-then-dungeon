/**
 * Art and character-sheet lookups by content ID. Placeholder images live in assets/placeholders/; final art lives in
 * assets/art/<ID>/ (card.webp still and optional card.mp4 loop for characters; tile.webp, plus tile-<state>.webp, for
 * board tiles) and is used wherever it exists. Everything is keyed by ID.
 */
import facesJson from "../../assets/art/faces.json";

const cardFiles = import.meta.glob("../../assets/placeholders/cards/*.svg", { eager: true, query: "?url", import: "default" }) as Record<string, string>;
const charFiles = import.meta.glob("../../assets/placeholders/characters/*.svg", { eager: true, query: "?url", import: "default" }) as Record<string, string>;
const stillFiles = import.meta.glob("../../assets/art/*/card.webp", { eager: true, query: "?url", import: "default" }) as Record<string, string>;
const videoFiles = import.meta.glob("../../assets/art/*/card.mp4", { eager: true, query: "?url", import: "default" }) as Record<string, string>;
const tileFiles = import.meta.glob("../../assets/art/*/tile*.webp", { eager: true, query: "?url", import: "default" }) as Record<string, string>;
const themeFiles = import.meta.glob("../../assets/themes/*.webp", { eager: true, query: "?url", import: "default" }) as Record<string, string>;
const sheetFiles = import.meta.glob("../../characters/*.md", { eager: true, query: "?raw", import: "default" }) as Record<string, string>;

const byId = (files: Record<string, string>) =>
  new Map(Object.entries(files).map(([path, url]) => [path.split("/").pop()!.replace(/\.svg$/, ""), url]));

const CARD_ART = byId(cardFiles);
const CHAR_ART = byId(charFiles);

const byFolder = (files: Record<string, string>) =>
  new Map(Object.entries(files).map(([path, url]) => [path.split("/").at(-2)!, url]));
const STILLS = byFolder(stillFiles);
const VIDEOS = byFolder(videoFiles);
const FACES = facesJson as unknown as Record<string, [number, number, number] | undefined>;

/** Final art: a 5:4 still, an optional looping clip, and where the face sits for round portraits. */
export interface RealArt {
  still: string;
  video?: string;
  face: [x: number, y: number, size: number];
}

const TILES = new Map(Object.entries(tileFiles).map(([path, url]) => {
  const parts = path.split("/");
  const state = parts.at(-1)!.replace(/^tile-?|\.webp$/g, "");
  return [`${parts.at(-2)}${state ? `:${state}` : ""}`, url] as [string, string];
}));

const THEME_ART = new Map(Object.entries(themeFiles).map(([path, url]) => [path.split("/").pop()!.replace(/\.webp$/, ""), url]));

/** CSS custom property carrying a theme's scene image (assets/themes/<theme id>.webp), or "" when it has none. */
export const themeArtStyle = (themeId: string) => {
  const url = THEME_ART.get(themeId);
  return url ? `--theme-art:url("${url}");` : "";
};

/** Board-tile art for a trap, obstacle or mechanic (assets/art/<ID>/tile.webp; `state` picks tile-<state>.webp). */
export function tileUrl(id: string, state?: string): string | undefined {
  return (state && TILES.get(`${id}:${state}`)) || TILES.get(id);
}

/** Final art for an ID (or look key such as "H_ARCHER--f") from assets/art/<key>/, or undefined while it still uses a placeholder. */
export function realArt(id: string): RealArt | undefined {
  const still = STILLS.get(id);
  if (!still) return undefined;
  return { still, video: VIDEOS.get(id), face: FACES[id] ?? [50, 35, 50] };
}

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
