/** Game state, its constructor, and world queries shared by hero, enemy and tick logic. */
import { add, eq, lineBetween, manhattan, type Dir, type Vec } from "./board";
import {
  CARDS, CONTENT, ENEMIES, HEROES, MODIFIERS, getLevel, key, parseBoard, resolveDeck,
  type LevelDef, type StaticBoard,
} from "./content";
import type { CardInstance, DeckState } from "./deck";
import { createRng, seedFrom, shuffle } from "./rng";

/** Status name -> stacks (poison, bleed) or loops remaining (everything else). */
export type Statuses = Record<string, number>;

export interface HeroState {
  heroId: string;
  pos: Vec;
  facing: Dir;
  hp: number;
  maxHp: number;
  armor: number;
  speedTiles: number;
  sightRange: number;
  statuses: Statuses;
  /** Armor gained from shards this level, and speed gained from runes this turn. */
  shardArmor: number;
  runeSpeed: number;
  movedThisLoop: boolean;
}

export interface EnemyState {
  uid: number;
  typeId: string;
  modifier: string | null;
  pos: Vec;
  facing: Dir;
  hp: number;
  maxHp: number;
  statuses: Statuses;
  /** Per-enemy deterministic memory: cadence offsets, chosen modes, cooldowns. */
  ai: Record<string, number | string>;
  movedThisLoop: boolean;
  risen?: boolean;
}

export interface Corpse {
  pos: Vec;
  typeId: string;
  modifier: string | null;
}

export interface GameEvent {
  kind: string;
  text: string;
  pos?: Vec;
  /** Damage or healing amount, for floating numbers. */
  amount?: number;
  /** Who it happened to: the hero, or an enemy uid. */
  target?: "hero" | number;
  /** For "eval" events: whether the row's IF was true. */
  truth?: boolean;
}

export interface GameState {
  levelId: number;
  heroId: string;
  seed: number;
  turnIndex: number;
  /** Loops executed since the level started (drives vent cycles and enemy cadence). */
  loop: number;
  lives: number;
  hero: HeroState;
  enemies: EnemyState[];
  nextUid: number;
  pressure: number;
  defeatedPool: string[];
  corpses: Corpse[];
  bloodTiles: { pos: Vec; loops: number }[];
  pickups: Record<string, string>;
  revealed: string[];
  wardTurns: number;
  deck: DeckState;
  hand: CardInstance[];
  status: "playing" | "won" | "lost";
  /** Set when the hero dies; the controller rewinds to the turn-start snapshot. */
  diedThisTurn: boolean;
  log: GameEvent[];
}

const boardCache = new Map<number, StaticBoard>();
export function boardOf(state: { levelId: number }): StaticBoard {
  let b = boardCache.get(state.levelId);
  if (!b) {
    b = parseBoard(getLevel(state.levelId));
    boardCache.set(state.levelId, b);
  }
  return b;
}
export const levelOf = (state: { levelId: number }): LevelDef => getLevel(state.levelId);

export function createState(levelId: number, heroId: string, seed: number): GameState {
  const level = getLevel(levelId);
  const board = parseBoard(level);
  const hero = HEROES[heroId];
  if (!hero) throw new Error(`Unknown hero ${heroId}`);
  const cards: CardInstance[] = [];
  for (const [cardId, count] of resolveDeck(levelId)) {
    for (let i = 0; i < count; i++) cards.push({ instanceId: `${cardId}#${i}`, cardId });
  }
  const s = hero.baseStats;
  return {
    levelId,
    heroId,
    seed,
    turnIndex: 0,
    loop: 0,
    lives: 3,
    hero: {
      heroId, pos: board.heroStart, facing: board.heroFacing, hp: s.hp, maxHp: s.hp, armor: s.armor,
      speedTiles: s.speedTiles, sightRange: s.sightRange, statuses: {}, shardArmor: 0, runeSpeed: 0, movedThisLoop: false,
    },
    enemies: [],
    nextUid: 1,
    pressure: level.startingPressure ?? 0,
    defeatedPool: [],
    corpses: [],
    bloodTiles: [],
    pickups: Object.fromEntries(board.pickups),
    revealed: [],
    wardTurns: 0,
    deck: { drawPile: shuffle(createRng(seedFrom(seed, "deck")), cards), discardPile: [] },
    hand: [],
    status: "playing",
    diedThisTurn: false,
    log: [],
  };
}

export const emit = (state: GameState, kind: string, text: string, pos?: Vec, extra: Partial<GameEvent> = {}) =>
  state.log.push({ kind, text, pos, ...extra });

// ---------- world queries ----------

export const inBounds = (state: GameState, p: Vec) => {
  const b = boardOf(state);
  return p.x >= 0 && p.y >= 0 && p.x < b.width && p.y < b.height;
};
export const obstacleAt = (state: GameState, p: Vec): string | null =>
  inBounds(state, p) ? boardOf(state).terrain[p.y]![p.x]! : "O_STONE_WALL";
export const trapAt = (state: GameState, p: Vec) => boardOf(state).traps.get(key(p));
export const mechanicAt = (state: GameState, p: Vec) => boardOf(state).mechanics.get(key(p));
export const enemyAt = (state: GameState, p: Vec) => state.enemies.find((e) => eq(e.pos, p));
export const isIllusion = (state: GameState, p: Vec) => trapAt(state, p) === "T_ILLUSION_WALL";
export const isRevealed = (state: GameState, p: Vec) => state.revealed.includes(key(p));

/** Terrain that stops walking: obstacles and illusion walls (solid even when they look open). */
export const solid = (state: GameState, p: Vec) => obstacleAt(state, p) !== null || isIllusion(state, p);
export const occupied = (state: GameState, p: Vec) => eq(state.hero.pos, p) || !!enemyAt(state, p);
export const open = (state: GameState, p: Vec) => !solid(state, p) && !occupied(state, p);

export function blocksLoS(state: GameState, p: Vec): boolean {
  const o = obstacleAt(state, p);
  if (o) return CONTENT.obstacles[o]!.blocksLoS;
  return isIllusion(state, p) && !isRevealed(state, p);
}

/** Line of sight: obstacles that block sight, unrevealed illusions, and smoke clouds *between* the two tiles block it. */
export function hasLoS(state: GameState, a: Vec, b: Vec): boolean {
  return lineBetween(a, b).every((p) => !blocksLoS(state, p) && trapAt(state, p) !== "T_SMOKE_VENTS");
}

export function ventActive(state: GameState, p: Vec, loop = state.loop): boolean {
  if (mechanicAt(state, p)?.id !== "M_TIMED_VENTS") return false;
  const [off, on] = CONTENT.mechanics.M_TIMED_VENTS!.cycle as [number, number];
  return loop % (off + on) >= off;
}

export function inSmoke(state: GameState, p: Vec) {
  return trapAt(state, p) === "T_SMOKE_VENTS";
}

export function heroSight(state: GameState): number {
  const smoke = inSmoke(state, state.hero.pos) ? CONTENT.traps.T_SMOKE_VENTS!.visibilityPenalty ?? 1 : 0;
  const ashen = state.enemies.some((e) => e.modifier === "ashen" && manhattan(e.pos, state.hero.pos) <= 1) ? 1 : 0;
  return Math.max(1, state.hero.sightRange - smoke - ashen);
}

/** Enemies the hero can currently see (range + line of sight, any direction). */
export function visibleEnemies(state: GameState): EnemyState[] {
  const range = heroSight(state);
  return state.enemies.filter((e) => {
    const d = manhattan(e.pos, state.hero.pos);
    if (d > range) return false;
    const limit = e.modifier ? MODIFIERS[e.modifier]?.visibleOnlyWithin : undefined;
    if (limit !== undefined && d > limit) return false;
    return (e.statuses.mark ?? 0) > 0 || hasLoS(state, state.hero.pos, e.pos);
  });
}

export function enemyTags(e: EnemyState): string[] {
  return [...ENEMIES[e.typeId]!.tags, ...(e.modifier ? MODIFIERS[e.modifier]?.tagsAdd ?? [] : [])];
}

export function enemyArmor(e: EnemyState): number {
  return ENEMIES[e.typeId]!.armor + (e.modifier ? MODIFIERS[e.modifier]?.armorAdd ?? 0 : 0);
}

export function enemyDamage(e: EnemyState): number {
  const base = ENEMIES[e.typeId]!.damage;
  if (base === 0) return 0;
  return base + (e.modifier ? MODIFIERS[e.modifier]?.damageAdd ?? 0 : 0) + (e.statuses.enraged ? 1 : 0);
}

export const enemyName = (e: EnemyState) =>
  `${e.modifier ? e.modifier[0]!.toUpperCase() + e.modifier.slice(1) + " " : ""}${ENEMIES[e.typeId]!.name}`;

export const heroArmor = (state: GameState) => state.hero.armor + state.hero.shardArmor;

/** Hazard tiles a careful unit avoids: damaging traps and vents that are on (or about to be). */
export function hazardous(state: GameState, p: Vec, loop = state.loop): boolean {
  const t = trapAt(state, p);
  if (t && t !== "T_ILLUSION_WALL") return true;
  return ventActive(state, p, loop) || ventActive(state, p, loop + 1) || state.bloodTiles.some((b) => eq(b.pos, p));
}

export const cardName = (cardId: string) => CARDS[cardId]?.name ?? cardId;
export const forwardOf = (state: GameState, n = 1) => add(state.hero.pos, state.hero.facing, n);
