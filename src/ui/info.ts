/** "What is this?" descriptions for every thing that can sit on a board tile. */
import { eq, type Vec } from "../engine/board";
import { CONTENT, ENEMIES, HEROES, MODIFIERS, key } from "../engine/content";
import {
  boardOf, enemyArmor, enemyDamage, enemyName, heroArmor, isRevealed, trapAt, ventActive,
  type GameState,
} from "../engine/state";
import { sheetParagraph } from "./assets";
import { CARDS } from "../engine/content";
import { cardText, DIR_WORD, modifierName, nameOf, statusLabel, threatLine, TYPE_LABEL } from "./text";

export interface InfoEntry {
  /** Content ID used for art (may be undefined for floor, exit, blood...). */
  artId?: string;
  title: string;
  kind: string;
  lines: string[];
  tip?: string;
}

const tipOf = (id: string, ...sections: string[]) => {
  for (const s of sections) {
    const t = sheetParagraph(id, s, nameOf, s.startsWith("Counterplay"));
    if (t) return t;
  }
  return undefined;
};

const statusList = (st: Record<string, number>) =>
  Object.entries(st).filter(([, n]) => n > 0).map(([s, n]) => statusLabel(s, n));

export function heroEntry(state: GameState): InfoEntry {
  const def = HEROES[state.heroId]!;
  const h = state.hero;
  const statuses = statusList(h.statuses);
  return {
    artId: state.heroId,
    title: `${def.name} (your hero)`,
    kind: "Hero",
    lines: [
      `HP ${h.hp}/${h.maxHp} · Armor ${heroArmor(state)} · Sight ${h.sightRange} · Facing ${DIR_WORD[h.facing]}`,
      `When no row fires: ${def.defaultBehavior.text}`,
      `Hero Attack card: ${cardText("A_HERO_ATTACK", state.heroId)}`,
      statuses.length ? `Status: ${statuses.join(", ")}` : "",
    ].filter(Boolean),
  };
}

export function enemyEntry(state: GameState, uid: number): InfoEntry | undefined {
  const e = state.enemies.find((x) => x.uid === uid);
  if (!e) return undefined;
  const def = ENEMIES[e.typeId]!;
  const statuses = statusList(e.statuses);
  const mod = e.modifier ? MODIFIERS[e.modifier] : undefined;
  return {
    artId: e.typeId,
    title: enemyName(e),
    kind: `Enemy · ${"☠".repeat(def.dangerSkulls)} danger`,
    lines: [
      `HP ${e.hp}/${e.maxHp} · Armor ${enemyArmor(e)} · Damage ${enemyDamage(e)} · Range ${def.attackRange} · Facing ${DIR_WORD[e.facing]}`,
      `How it acts: ${def.behavior.text}`,
      mod ? `${modifierName(e.modifier!)} modifier: ${mod.text}` : "",
      e.risen ? "This one rose from the dead." : "",
      statuses.length ? `Status: ${statuses.join(", ")}` : "",
    ].filter(Boolean),
  };
}

export function trapLines(id: string): string[] {
  const t = CONTENT.traps[id]!;
  const out: string[] = [];
  if (id === "T_ILLUSION_WALL") return [`Looks open, but it's solid. Walking into it deals ${t.damageOnImpact ?? 2} damage and reveals it.`];
  if (t.damage !== undefined) out.push(`Stepping on it deals ${t.damage} damage (armor doesn't help).`);
  if (t.damagePerLoop) out.push(`Deals ${t.damagePerLoop} damage at the end of every loop you stay in it.`);
  if (t.appliesStatus?.length) {
    const st = t.appliesStatus.map((s) => statusLabel(s, t.statusStacks ?? CONTENT.statuses[s]?.durationLoops ?? 1).toLowerCase());
    out.push(`${t.statusChancePercent ? `${t.statusChancePercent}% chance to make you` : "Makes you"} ${st.join(", ")}.`);
  }
  if (t.visibilityPenalty) out.push(`Smoke: your sight is ${t.visibilityPenalty} shorter while inside.`);
  out.push("Enemies avoid stepping on damaging traps.");
  return out;
}

export function obstacleLines(id: string): string[] {
  const o = CONTENT.obstacles[id]!;
  return [
    o.blocksMovement ? "Nobody can walk through it." : "Units can walk through it.",
    o.blocksLoS ? "Blocks line of sight: you can't see past it." : "See-through: you (and archers) can see across it.",
    o.jumpable ? "Jump Forward can leap over it." : "Too tall to jump over.",
  ];
}

/** Everything on one tile, top-most first. */
export function describeTile(state: GameState, p: Vec): InfoEntry[] {
  const board = boardOf(state);
  if (p.x < 0 || p.y < 0 || p.x >= board.width || p.y >= board.height) return [];
  const out: InfoEntry[] = [];
  const k = key(p);
  if (eq(state.hero.pos, p)) out.push(heroEntry(state));
  const enemy = state.enemies.find((e) => eq(e.pos, p));
  if (enemy) out.push(enemyEntry(state, enemy.uid)!);
  const pickup = state.pickups[k];
  if (pickup) {
    out.push({ artId: pickup, title: nameOf(pickup), kind: "Pickup", lines: [(CONTENT.pickups[pickup] as { rule?: string }).rule ?? "", "Picked up automatically when the hero is on it or right next to it (no diagonals)."].filter(Boolean) });
  }
  const corpses = state.corpses.filter((c) => eq(c.pos, p));
  for (const c of corpses) {
    out.push({ artId: c.typeId, title: `Corpse of ${c.modifier ? modifierName(c.modifier) + " " : ""}${ENEMIES[c.typeId]?.name ?? c.typeId}`, kind: "Corpse", lines: [(CONTENT.boardEffects.corpse as { rule?: string }).rule ?? ""] });
  }
  const blood = state.bloodTiles.find((b) => eq(b.pos, p));
  if (blood) out.push({ title: "Blood tile", kind: "Board effect", lines: [(CONTENT.boardEffects.blood_tile as { rule?: string }).rule ?? "", `Fades in ${blood.loops} loop(s).`] });
  if (eq(board.exit, p)) out.push({ title: "Exit", kind: "Goal", lines: ["Reach this tile to win the level."] });
  const obstacle = board.terrain[p.y]![p.x];
  if (obstacle) out.push({ artId: obstacle, title: nameOf(obstacle), kind: "Obstacle", lines: obstacleLines(obstacle), tip: tipOf(obstacle, "Teaching notes") });
  const trap = trapAt(state, p);
  if (trap === "T_ILLUSION_WALL" && !isRevealed(state, p)) {
    out.push({ title: "Shimmering floor?", kind: "Mystery", lines: ["The air ripples here. Is it really open? Illuminate or Probe can tell you."] });
  } else if (trap) {
    out.push({ artId: trap, title: nameOf(trap), kind: "Trap", lines: trapLines(trap), tip: tipOf(trap, "Teaching notes") });
  }
  const mech = board.mechanics.get(k);
  if (mech) {
    const def = CONTENT.mechanics[mech.id]!;
    const lines: string[] = [];
    if (mech.id === "M_TIMED_VENTS") {
      const [off, on] = def.cycle ?? [2, 2];
      lines.push(`Cycles ${off} loops OFF, then ${on} loops ON. While ON, standing here at the end of a loop deals ${def.damage ?? 2} damage.`);
      lines.push(ventActive(state, p) ? "Right now: ON (dangerous)." : ventActive(state, p, state.loop + 1) ? "Right now: OFF, but turning ON next loop!" : "Right now: OFF (safe).");
    } else if (mech.id === "M_CONVEYOR") {
      lines.push(`At the end of each loop, carries the hero 1 tile ${DIR_WORD[mech.dir ?? "E"]} if that tile is open.`);
    } else if (mech.id === "M_PUSH_PLATES") {
      lines.push(`Stepping on it shoves the hero 1 tile ${DIR_WORD[mech.dir ?? "E"]}. Brace to ignore it.`);
    }
    out.push({ artId: mech.id, title: nameOf(mech.id), kind: "Board mechanic", lines, tip: tipOf(mech.id, "Teaching notes") });
  }
  for (const [id, sp] of board.spawnPoints) {
    if (eq(sp, p)) out.push({ title: `Spawn point ${id.replace("SP_", "")}`, kind: "Spawn point", lines: ["Enemies bought with Pressure appear here (never within 2 steps of the hero)."] });
  }
  if (!out.length) out.push({ title: "Floor", kind: "Open ground", lines: ["Nothing here. Safe to walk."] });
  return out;
}

/** Description of any content ID for the "What's new" panel. */
export function entryFor(id: string, heroId: string): InfoEntry {
  const card = CARDS[id];
  if (card) return { artId: id, title: card.name, kind: `${TYPE_LABEL[card.type]} card`, lines: [cardText(id, heroId), threatLine(id)] };
  const enemy = ENEMIES[id];
  if (enemy) {
    return {
      artId: id, title: enemy.name, kind: `Enemy · ${"☠".repeat(enemy.dangerSkulls)} danger`,
      lines: [`HP ${enemy.hp} · Armor ${enemy.armor} · Damage ${enemy.damage} · Range ${enemy.attackRange}`, `How it acts: ${enemy.behavior.text}`],
      tip: tipOf(id, "Counterplay hints (for level tooltips / teach mode)", "What the player learns"),
    };
  }
  const mod = MODIFIERS[id];
  if (mod) return { artId: id, title: `${modifierName(id)} enemies`, kind: "Enemy modifier", lines: [mod.text, "Modified enemies show the word on their tile."] };
  if (CONTENT.traps[id]) return { artId: id, title: nameOf(id), kind: "Trap", lines: trapLines(id), tip: tipOf(id, "Teaching notes") };
  if (CONTENT.obstacles[id]) return { artId: id, title: nameOf(id), kind: "Obstacle", lines: obstacleLines(id), tip: tipOf(id, "Teaching notes") };
  if (CONTENT.pickups[id]) return { artId: id, title: nameOf(id), kind: "Pickup", lines: [(CONTENT.pickups[id] as { rule?: string }).rule ?? ""] };
  if (CONTENT.mechanics[id]) return { artId: id, title: nameOf(id), kind: "Board mechanic", lines: [tipOf(id, "What it does", "Core rule") ?? ""], tip: tipOf(id, "Teaching notes") };
  return { title: nameOf(id), kind: "", lines: [] };
}
