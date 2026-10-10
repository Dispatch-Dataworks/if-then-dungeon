/** Sensor cards: each engineKey reads the world from the hero's point of view. */
import { add, eq, left, manhattan, right, type Vec } from "../board";
import { CARDS } from "../content";
import { isBloodTile } from "../effects";
import {
  enemyAt, enemyTags, forwardOf, hazardous, inSmoke, isIllusion, isRevealed, obstacleAt, open, trapAt,
  ventActive, visibleEnemies, type GameState,
} from "../state";

type Sensor = (state: GameState, params: Record<string, any>) => boolean;

const withinOf = (state: GameState, d: number) => state.enemies.filter((e) => manhattan(e.pos, state.hero.pos) <= d);
/** Hazard detection range: 1 tile ahead (2 for a Rogue with Trap Sense is an upgrade hook). */
const aheadTiles = (state: GameState): Vec[] =>
  state.upgrades.includes("U_TRAP_SENSE") ? [forwardOf(state), forwardOf(state, 2)] : [forwardOf(state)];

const SENSORS: Record<string, Sensor> = {
  wall_ahead: (s) => obstacleAt(s, forwardOf(s)) !== null || (isIllusion(s, forwardOf(s)) && isRevealed(s, forwardOf(s))),
  blocked_ahead: (s) => {
    const f = forwardOf(s);
    return obstacleAt(s, f) !== null || !!enemyAt(s, f) || (isIllusion(s, f) && isRevealed(s, f));
  },
  enemy_ahead: (s, p) => {
    for (let i = 1; i <= (p.distance ?? 1); i++) if (enemyAt(s, forwardOf(s, i))) return true;
    return false;
  },
  enemy_adjacent: (s) => withinOf(s, 1).length > 0,
  enemy_visible_los: (s) => visibleEnemies(s).length > 0,
  enemy_within: (s, p) => withinOf(s, p.distance ?? 2).length > 0,
  enemy_left: (s) => !!enemyAt(s, add(s.hero.pos, left(s.hero.facing))),
  enemy_right: (s) => !!enemyAt(s, add(s.hero.pos, right(s.hero.facing))),
  enemy_count_at_least: (s, p) => s.enemies.length >= (p.count ?? 3),
  enemy_visible_by_tag: (s, p) => visibleEnemies(s).some((e) => enemyTags(e).includes(p.tag)),
  enemy_visible_by_status: (s, p) => visibleEnemies(s).some((e) => (e.statuses[p.status] ?? 0) > 0),
  ranged_threat_visible: (s) => visibleEnemies(s).some((e) => enemyTags(e).includes("ranged")),
  trap_ahead: (s, p) => aheadTiles(s).some((t) => trapAt(s, t) === p.trapId),
  any_trap_ahead: (s) => aheadTiles(s).some((t) => { const id = trapAt(s, t); return !!id && id !== "T_ILLUSION_WALL"; }),
  on_trap: (s, p) => trapAt(s, s.hero.pos) === p.trapId,
  hazard_ahead: (s, p) => aheadTiles(s).some((t) => trapAt(s, t) === p.hazardId),
  in_hazard: (s, p) => (p.hazardId === "T_SMOKE_VENTS" ? inSmoke(s, s.hero.pos) : trapAt(s, s.hero.pos) === p.hazardId),
  any_hazard_ahead: (s, p) =>
    aheadTiles(s).some((t) => (p.includes as string[]).includes(trapAt(s, t) ?? "") || ventActive(s, t) || ventActive(s, t, s.loop + 1)),
  safe_ahead: (s) => {
    const f = forwardOf(s);
    return open(s, f) && !hazardous(s, f) && !(isIllusion(s, f));
  },
  occupied_or_will_be_occupied_ahead: (s) => {
    const f = forwardOf(s);
    return !!enemyAt(s, f) || s.enemies.some((e) => manhattan(e.pos, f) === 1 && !eq(e.pos, s.hero.pos));
  },
  vent_active_ahead: (s) => ventActive(s, forwardOf(s)),
  vent_active_here: (s) => ventActive(s, s.hero.pos),
  corpse_within: (s, p) => s.corpses.some((c) => manhattan(c.pos, s.hero.pos) <= (p.distance ?? 1)),
  resurrection_pending: (s) => s.pressure > 0 && s.defeatedPool.length > 0 && s.wardTurns === 0,
  hero_hp_at_or_below: (s, p) => s.hero.hp <= (p.hp ?? 3),
  hero_has_status: (s, p) => (s.hero.statuses[p.status] ?? 0) > 0,
  phase_threat_next_loop: (s) => s.enemies.some((e) => enemyTags(e).includes("phase") && manhattan(e.pos, s.hero.pos) <= 2),
  illusion_ahead: (s) => isIllusion(s, forwardOf(s)),
  blood_tile_within: (s, p) => {
    const r = (p.distance ?? 2) + (s.upgrades.includes("U_BLOOD_SENSE") ? 1 : 0);
    for (let dy = -r; dy <= r; dy++) {
      for (let dx = -r; dx <= r; dx++) {
        const t = { x: s.hero.pos.x + dx, y: s.hero.pos.y + dy };
        if (Math.abs(dx) + Math.abs(dy) <= r && isBloodTile(s, t)) return true;
      }
    }
    return false;
  },
};

export function senseCard(state: GameState, cardId: string): boolean {
  const card = CARDS[cardId];
  if (!card || card.type !== "sensor") throw new Error(`${cardId} is not a sensor`);
  const fn = SENSORS[card.engineKey];
  if (!fn) throw new Error(`No sensor implementation for ${card.engineKey}`);
  return fn(state, card.params);
}

export const SENSOR_KEYS = Object.keys(SENSORS);
