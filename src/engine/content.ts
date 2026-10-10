/** Typed access to the JSON content files plus derived lookups (resolved decks, parsed boards). */
import cardsJson from "../../cards.json";
import enemiesJson from "../../enemies.json";
import heroesJson from "../../heroes.json";
import levelsJson from "../../levels.json";
import rulesJson from "../../rules.json";
import type { Dir, Vec } from "./board";

export type CardType = "sensor" | "action" | "operator" | "hero_action";

export interface CardDef {
  id: string;
  type: CardType;
  rarity: string;
  name: string;
  engineKey: string;
  params: Record<string, any>;
}

export interface HeroDef {
  id: string;
  name: string;
  tier: string;
  unlockAfterLevel: number;
  baseStats: { hp: number; armor: number; speedTiles: number; sightRange: number };
  defaultBehavior: { key: string; text: string };
  upgrades: { id: string; name: string; unlockAfterLevelsClearedWithHero: number; effect: string }[];
  heroAttack: {
    name: string;
    key: string;
    damage: number;
    range: number;
    pushTiles?: number;
    statusOnHit?: { status: string; stacks?: number; chancePercent?: number };
    bonus?: { vsTag?: string; vsStatus?: string[]; vsUnaware?: boolean; vsHpAtOrBelowHalf?: boolean; ignoresLoS?: boolean; damageAdd?: number };
  };
}

export interface EnemyDef {
  id: string;
  name: string;
  dangerSkulls: number;
  hp: number;
  armor: number;
  damage: number;
  attackRange: number;
  speedTiles: number;
  sightRange: number;
  tags: string[];
  behavior: { key: string; text: string };
  variability: Record<string, any>;
  statusOnHit?: { status: string; chancePercent?: number; stacks?: number; altStatus?: string };
  immuneTo?: string[];
  grantsAllyStatus?: string;
  pushOnHitTiles?: number;
  ignoresObstacles?: boolean;
}

export interface ModifierDef {
  text: string;
  optional?: boolean;
  statusOnHit?: { status: string; stacks?: number };
  armorAdd?: number;
  hpAdd?: number;
  damageAdd?: number;
  immuneTo?: string[];
  tagsAdd?: string[];
  leavesBoardEffect?: string;
  enragedAtOrBelowHalfHp?: boolean;
  riseFromCorpse?: boolean;
  visibleOnlyWithin?: number;
}

export interface LevelDef {
  levelId: number;
  themeId: string;
  diceSides: number;
  introduces: string[];
  deck: { baseDeckId?: string; fromPrevLevel?: number; adjustments: { id: string; add?: number; remove?: number }[] };
  pressureSpendCap: { formula: string };
  pressureSpendCapOverride: number | null;
  startingPressure?: number;
  maxSpawnsPerTurn: number;
  enemyPool: string[];
  nuisancePool: string[];
  modifiersAllowed: string[];
  traps: string[];
  mechanics: string[];
  obstacles: string[];
  spawnPoints: string[];
  board: { heroFacing: string; map: string[]; pushPlateDirections?: string[] };
}

export const CARDS: Record<string, CardDef> = Object.fromEntries(
  (cardsJson.cards as CardDef[]).map((c) => [c.id, c]),
);
export const HEROES: Record<string, HeroDef> = Object.fromEntries(
  (heroesJson.heroes as HeroDef[]).map((h) => [h.id, h]),
);
export const HERO_LIST = heroesJson.heroes as HeroDef[];
export const ENEMIES: Record<string, EnemyDef> = Object.fromEntries(
  (enemiesJson.enemies as EnemyDef[]).map((e) => [e.id, e]),
);
export const MODIFIERS = enemiesJson.modifiers as Record<string, ModifierDef>;
export const DROPS = enemiesJson.combat.drops;
export const LEVELS = levelsJson.levels as unknown as LevelDef[];
export const CONTENT = levelsJson.content as unknown as {
  traps: Record<string, { damage?: number; damagePerLoop?: number; damageOnImpact?: number; appliesStatus?: string[]; statusStacks?: number; statusChancePercent?: number; visibilityPenalty?: number }>;
  mechanics: Record<string, { cycle?: number[]; damage?: number; forcedMove?: number; pushTiles?: number }>;
  obstacles: Record<string, { blocksMovement: boolean; blocksLoS: boolean; jumpable: boolean }>;
  pickups: Record<string, { healHp?: number; armorAdd?: number; maxStack?: number; speedTilesAdd?: number }>;
  statuses: Record<string, { durationLoops?: number; maxStacks?: number; damageAdd?: number; damageTakenAdd?: number; speedTilesAdd?: number }>;
  boardEffects: Record<string, { durationLoops?: number }>;
  mapLegend: Record<string, string>;
};
export const COSTS = levelsJson.enemies.spawnCostsBase as Record<string, number>;
export const MODIFIER_COSTS = levelsJson.enemies.modifierCostAdders as Record<string, number>;
export const RULES = rulesJson;

export function getLevel(levelId: number): LevelDef {
  const level = LEVELS.find((l) => l.levelId === levelId);
  if (!level) throw new Error(`Unknown level ${levelId}`);
  return level;
}

/** Card counts for a level after following its deck inheritance chain. */
export function resolveDeck(levelId: number): Map<string, number> {
  const level = getLevel(levelId);
  const deck = level.deck.baseDeckId
    ? new Map(
        (levelsJson.decks as Record<string, { cards: { id: string; count: number }[] }>)[level.deck.baseDeckId]!.cards.map(
          (c) => [c.id, c.count] as [string, number],
        ),
      )
    : resolveDeck(level.deck.fromPrevLevel!);
  for (const a of level.deck.adjustments) deck.set(a.id, (deck.get(a.id) ?? 0) + (a.add ?? 0) - (a.remove ?? 0));
  for (const [id, n] of deck) if (n <= 0) deck.delete(id);
  return deck;
}

export function pressureSpendCap(level: LevelDef): number {
  return level.pressureSpendCapOverride ?? 6 + level.levelId;
}

export interface StaticBoard {
  width: number;
  height: number;
  /** Obstacle id per tile, or null for open ground. Indexed [y][x]. */
  terrain: (string | null)[][];
  traps: Map<string, string>;
  mechanics: Map<string, { id: string; dir?: Dir }>;
  pickups: Map<string, string>;
  spawnPoints: Map<string, Vec>;
  heroStart: Vec;
  heroFacing: Dir;
  exit: Vec;
}

export const key = (p: Vec) => `${p.x},${p.y}`;

export function parseBoard(level: LevelDef): StaticBoard {
  const legend = CONTENT.mapLegend;
  const rows = level.board.map;
  const plates = [...(level.board.pushPlateDirections ?? [])] as Dir[];
  const board: StaticBoard = {
    width: rows[0]!.length,
    height: rows.length,
    terrain: [],
    traps: new Map(),
    mechanics: new Map(),
    pickups: new Map(),
    spawnPoints: new Map(),
    heroStart: { x: 0, y: 0 },
    heroFacing: level.board.heroFacing as Dir,
    exit: { x: 0, y: 0 },
  };
  rows.forEach((row, y) => {
    board.terrain.push([]);
    [...row].forEach((ch, x) => {
      const p = { x, y };
      const [id, dir] = (legend[ch] ?? "floor").split(":") as [string, Dir | undefined];
      board.terrain[y]!.push(id.startsWith("O_") ? id : null);
      if (ch === "@") board.heroStart = p;
      else if (ch === "X") board.exit = p;
      else if (id.startsWith("SP_")) board.spawnPoints.set(id, p);
      else if (id.startsWith("T_")) board.traps.set(key(p), id);
      else if (id.startsWith("P_")) board.pickups.set(key(p), id);
      else if (id === "M_PUSH_PLATES") board.mechanics.set(key(p), { id, dir: plates.shift() });
      else if (id.startsWith("M_")) board.mechanics.set(key(p), { id, dir });
    });
  });
  return board;
}
