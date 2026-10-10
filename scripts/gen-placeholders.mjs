// Generates placeholder SVGs for every card (cards.json) and character sheet (characters/*.md).
// Run: npm run placeholders. Replace each SVG with final art when it exists; keep the same file name.
import { mkdirSync, readFileSync, readdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";

const root = new URL("..", import.meta.url).pathname;
const out = join(root, "assets", "placeholders");

// Colors from Style-guide.md. Each type also gets a distinct glyph so it never relies on color alone.
const CARD_TYPES = {
  sensor: { color: "#00F0FF", label: "SENSOR", glyph: "eye" },
  action: { color: "#FFD700", label: "ACTION", glyph: "arrow" },
  operator: { color: "#C77DFF", label: "OPERATOR", glyph: "diamond" },
  hero_action: { color: "#FF8C00", label: "HERO ACTION", glyph: "star" },
};
const CATEGORIES = {
  Hero: { color: "#00F0FF", glyph: "shield" },
  Enemy: { color: "#FF6600", glyph: "fang" },
  "Enemy Modifier": { color: "#C77DFF", glyph: "diamond" },
  Trap: { color: "#FF3300", glyph: "spike" },
  "Board Mechanic": { color: "#FFD700", glyph: "gear" },
  "Obstruction / Terrain": { color: "#CDB38B", glyph: "block" },
  Pickup: { color: "#00FF66", glyph: "flask" },
};
const RARITY_PIPS = { common: 1, uncommon: 2, rare: 3, epic: 4, legendary: 5 };

const esc = (s) => s.replace(/[<>&"]/g, (c) => ({ "<": "&lt;", ">": "&gt;", "&": "&amp;", '"': "&quot;" })[c]);

function glyph(kind, cx, cy, c) {
  const s = `fill="none" stroke="${c}" stroke-width="6" stroke-linejoin="round"`;
  switch (kind) {
    case "eye":
      return `<path d="M${cx - 60},${cy} Q${cx},${cy - 50} ${cx + 60},${cy} Q${cx},${cy + 50} ${cx - 60},${cy}Z" ${s}/><circle cx="${cx}" cy="${cy}" r="16" fill="${c}"/>`;
    case "arrow":
      return `<path d="M${cx - 50},${cy - 20} H${cx + 10} V${cy - 45} L${cx + 60},${cy} L${cx + 10},${cy + 45} V${cy + 20} H${cx - 50}Z" ${s}/>`;
    case "diamond":
      return `<path d="M${cx},${cy - 55} L${cx + 55},${cy} L${cx},${cy + 55} L${cx - 55},${cy}Z" ${s}/>`;
    case "star": {
      const pts = Array.from({ length: 10 }, (_, i) => {
        const r = i % 2 ? 24 : 58, a = (Math.PI / 5) * i - Math.PI / 2;
        return `${(cx + r * Math.cos(a)).toFixed(1)},${(cy + r * Math.sin(a)).toFixed(1)}`;
      });
      return `<polygon points="${pts.join(" ")}" ${s}/>`;
    }
    case "shield":
      return `<path d="M${cx - 50},${cy - 50} H${cx + 50} V${cy} Q${cx + 50},${cy + 40} ${cx},${cy + 60} Q${cx - 50},${cy + 40} ${cx - 50},${cy}Z" ${s}/>`;
    case "fang":
      return `<path d="M${cx - 55},${cy - 40} H${cx + 55} L${cx + 25},${cy + 55} L${cx},${cy - 5} L${cx - 25},${cy + 55}Z" ${s}/>`;
    case "spike":
      return `<path d="M${cx - 60},${cy + 45} L${cx - 30},${cy - 45} L${cx},${cy + 45} L${cx + 30},${cy - 45} L${cx + 60},${cy + 45}Z" ${s}/>`;
    case "gear":
      return `<circle cx="${cx}" cy="${cy}" r="40" ${s} stroke-dasharray="18 10"/><circle cx="${cx}" cy="${cy}" r="16" ${s}/>`;
    case "flask":
      return `<path d="M${cx - 14},${cy - 55} H${cx + 14} V${cy - 20} L${cx + 45},${cy + 45} H${cx - 45} L${cx - 14},${cy - 20}Z" ${s}/>`;
    default:
      return `<rect x="${cx - 50}" y="${cy - 40}" width="100" height="80" ${s}/><path d="M${cx - 50},${cy} H${cx + 50} M${cx},${cy - 40} V${cy}" ${s}/>`;
  }
}

function svg({ title, id, label, color, glyphKind, pips = 0 }) {
  const W = 300, H = 420;
  const pipMarks = Array.from({ length: pips }, (_, i) =>
    `<circle cx="${W / 2 - (pips - 1) * 9 + i * 18}" cy="372" r="5" fill="${color}"/>`).join("");
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}" role="img" aria-label="${esc(`${label}: ${title} (placeholder)`)}">
  <rect width="${W}" height="${H}" rx="18" fill="#0A0A14"/>
  <rect x="8" y="8" width="${W - 16}" height="${H - 16}" rx="14" fill="#1A1A2E" stroke="${color}" stroke-width="4"/>
  <rect x="24" y="56" width="${W - 48}" height="200" rx="8" fill="#2C3146"/>
  <text x="${W / 2}" y="40" text-anchor="middle" font-family="Montserrat, Arial, sans-serif" font-size="15" font-weight="700" letter-spacing="2" fill="${color}">${esc(label)}</text>
  ${glyph(glyphKind, W / 2, 156, color)}
  <text x="${W / 2}" y="300" text-anchor="middle" font-family="Cinzel, Georgia, serif" font-size="${title.length > 18 ? 20 : 24}" font-weight="700" fill="#F2E6CF">${esc(title)}</text>
  <text x="${W / 2}" y="330" text-anchor="middle" font-family="monospace" font-size="12" fill="#CDB38B">${esc(id)}</text>
  ${pipMarks}
  <text x="${W / 2}" y="402" text-anchor="middle" font-family="Montserrat, Arial, sans-serif" font-size="10" letter-spacing="3" fill="#CDB38B">PLACEHOLDER</text>
</svg>
`;
}

const cards = JSON.parse(readFileSync(join(root, "cards.json"), "utf8")).cards;
mkdirSync(join(out, "cards"), { recursive: true });
for (const card of cards) {
  const t = CARD_TYPES[card.type];
  if (!t) throw new Error(`Unknown card type ${card.type} on ${card.id}`);
  writeFileSync(join(out, "cards", `${card.id}.svg`),
    svg({ title: card.name, id: card.id, label: t.label, color: t.color, glyphKind: t.glyph, pips: RARITY_PIPS[card.rarity] ?? 0 }));
}

mkdirSync(join(out, "characters"), { recursive: true });
let count = 0;
for (const file of readdirSync(join(root, "characters")).filter((f) => /^[A-Z]+_.*\.md$/.test(f))) {
  const md = readFileSync(join(root, "characters", file), "utf8");
  const title = md.match(/^# (.+)$/m)?.[1].replace(/ \(Modifier\)$/, "") ?? file;
  const id = md.match(/\*\*ID:\*\* `([A-Z_]+)`/)?.[1];
  const category = md.match(/\*\*Category:\*\* ([^\n]+?)\s*$/m)?.[1];
  const c = CATEGORIES[category];
  if (!id || !c) throw new Error(`Cannot read ID/category from characters/${file}`);
  writeFileSync(join(out, "characters", `${id}.svg`),
    svg({ title, id, label: category.toUpperCase(), color: c.color, glyphKind: c.glyph }));
  count++;
}
console.log(`Wrote ${cards.length} card and ${count} character placeholders to assets/placeholders/`);
