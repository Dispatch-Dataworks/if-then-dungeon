/** Board renderer: a static tile grid plus an animated unit layer driven by GameState snapshots. */
import { eq, type Vec } from "../engine/board";
import { key } from "../engine/content";
import { boardOf, enemyName, isRevealed, trapAt, ventActive, type GameState } from "../engine/state";
import { artUrl } from "./assets";
import { h } from "./dom";
import { DIR_WORD, modifierName, nameOf } from "./text";

const art = (id: string, cls = "tile__art") => {
  const url = artUrl(id);
  return url ? h("img", { class: cls, src: url, alt: "", draggable: "false" }) : null;
};

/** Obstacles drawn as plain stone instead of art, so the walkable shape of the level reads at a glance. */
const PLAIN_WALLS = new Set(["O_STONE_WALL"]);

export class BoardView {
  readonly el: HTMLElement;
  private readonly grid: HTMLElement;
  private readonly dyn: HTMLElement[] = [];
  private readonly units: HTMLElement;
  private readonly fx: HTMLElement;
  private readonly cursorEl: HTMLElement;
  private readonly unitEls = new Map<string, HTMLElement>();
  private readonly width: number;
  private readonly height: number;
  cursor: Vec | null = null;
  private state: GameState;

  constructor(state: GameState, private readonly onSelect: (p: Vec) => void) {
    this.state = state;
    const board = boardOf(state);
    this.width = board.width;
    this.height = board.height;
    this.grid = h("div", { class: "board__grid" });
    for (let y = 0; y < board.height; y++) {
      for (let x = 0; x < board.width; x++) {
        const p = { x, y };
        const tile = this.staticTile(state, p);
        const dyn = h("div", { class: "tile__dyn" });
        tile.appendChild(dyn);
        this.dyn.push(dyn);
        tile.addEventListener("click", () => this.select(p, true));
        this.grid.appendChild(tile);
      }
    }
    this.units = h("div", { class: "board__units", "aria-hidden": "true" });
    this.fx = h("div", { class: "board__fx", "aria-hidden": "true" });
    this.cursorEl = h("div", { class: "board__cursor", hidden: true });
    this.el = h("div", {
      class: "board",
      role: "group",
      tabindex: "0",
      "aria-label": `Dungeon map, ${board.width} by ${board.height} tiles. Use arrow keys to inspect tiles.`,
      style: `--cols:${board.width};--rows:${board.height}`,
      onkeydown: (ev: KeyboardEvent) => this.onKey(ev),
      onfocus: () => { if (!this.cursor) this.select(this.state.hero.pos, true); },
    }, this.grid, this.units, this.fx, this.cursorEl);
    this.render(state, 0);
  }

  private staticTile(state: GameState, p: Vec): HTMLElement {
    const board = boardOf(state);
    const obstacle = board.terrain[p.y]![p.x];
    const trap = trapAt(state, p);
    const mech = board.mechanics.get(key(p));
    const tile = h("div", { class: "tile" });
    if (obstacle) {
      tile.classList.add("tile--obstacle", PLAIN_WALLS.has(obstacle) ? "tile--wall" : "tile--terrain");
      if (!PLAIN_WALLS.has(obstacle)) tile.append(art(obstacle) ?? "");
      tile.title = nameOf(obstacle);
    } else if (trap && trap !== "T_ILLUSION_WALL") {
      tile.classList.add("tile--trap");
      tile.append(art(trap) ?? "", h("span", { class: "tile__tag" }, "!"));
      tile.title = nameOf(trap);
    } else if (mech) {
      tile.classList.add("tile--mech");
      if (mech.id === "M_CONVEYOR" || mech.id === "M_PUSH_PLATES") {
        tile.append(h("span", { class: `tile__arrow dir-${mech.dir ?? "E"}` }, "➜"));
      } else tile.append(art(mech.id) ?? "");
      tile.title = `${nameOf(mech.id)}${mech.dir ? ` (${DIR_WORD[mech.dir]})` : ""}`;
    } else tile.classList.add("tile--floor");
    if (eq(board.exit, p)) {
      tile.classList.add("tile--exit");
      tile.append(h("span", { class: "tile__exit" }, "EXIT"));
      tile.title = "Exit";
    }
    for (const sp of board.spawnPoints.values()) if (eq(sp, p)) tile.classList.add("tile--spawn");
    return tile;
  }

  private onKey(ev: KeyboardEvent) {
    const d: Record<string, Vec> = { ArrowUp: { x: 0, y: -1 }, ArrowDown: { x: 0, y: 1 }, ArrowLeft: { x: -1, y: 0 }, ArrowRight: { x: 1, y: 0 } };
    const delta = d[ev.key];
    if (!delta) return;
    ev.preventDefault();
    const c = this.cursor ?? this.state.hero.pos;
    this.select({ x: Math.min(this.width - 1, Math.max(0, c.x + delta.x)), y: Math.min(this.height - 1, Math.max(0, c.y + delta.y)) }, true);
  }

  select(p: Vec | null, notify = false) {
    this.cursor = p;
    this.cursorEl.hidden = !p;
    if (p) this.cursorEl.style.transform = `translate(${p.x * 100}%, ${p.y * 100}%)`;
    if (p && notify) this.onSelect(p);
  }

  /** Draw a state. `ms` is the animation time for unit movement (0 = jump). */
  render(state: GameState, ms: number) {
    this.state = state;
    this.el.style.setProperty("--move-ms", `${ms}ms`);
    const board = boardOf(state);
    for (let y = 0; y < board.height; y++) {
      for (let x = 0; x < board.width; x++) {
        const p = { x, y };
        const k = key(p);
        const parts: (HTMLElement | null)[] = [];
        const trap = trapAt(state, p);
        if (trap === "T_ILLUSION_WALL") {
          parts.push(isRevealed(state, p)
            ? h("div", { class: "fx-illusion is-revealed", title: "Illusion wall (revealed)" }, art(trap), h("span", { class: "tile__tag" }, "?"))
            : h("div", { class: "fx-illusion", title: "Shimmering floor?" }));
        }
        if (state.bloodTiles.some((b) => eq(b.pos, p))) parts.push(h("div", { class: "fx-blood", title: "Blood tile" }, h("span", null, "≈")));
        const mech = board.mechanics.get(k);
        if (mech?.id === "M_TIMED_VENTS") {
          const on = ventActive(state, p);
          const soon = !on && ventActive(state, p, state.loop + 1);
          parts.push(h("div", { class: `fx-vent ${on ? "is-on" : soon ? "is-soon" : "is-off"}` }, on ? "ON" : soon ? "SOON" : "OFF"));
        }
        if (state.corpses.some((c) => eq(c.pos, p))) parts.push(h("div", { class: "fx-corpse", title: "Corpse" }, "✝"));
        const pickup = state.pickups[k];
        if (pickup) parts.push(h("div", { class: "fx-pickup", title: nameOf(pickup) }, art(pickup, "fx-pickup__art")));
        this.dyn[y * board.width + x]!.replaceChildren(...parts.filter((x): x is HTMLElement => !!x));
      }
    }
    this.renderUnits(state);
  }

  private renderUnits(state: GameState) {
    const seen = new Set<string>();
    const place = (id: string, pos: Vec, build: () => HTMLElement, update: (el: HTMLElement) => void) => {
      seen.add(id);
      let el = this.unitEls.get(id);
      if (!el) {
        el = build();
        el.classList.add("is-new");
        el.style.transform = `translate(${pos.x * 100}%, ${pos.y * 100}%)`;
        this.units.appendChild(el);
        this.unitEls.set(id, el);
        requestAnimationFrame(() => el!.classList.remove("is-new"));
      }
      el.style.transform = `translate(${pos.x * 100}%, ${pos.y * 100}%)`;
      update(el);
    };
    const hero = state.hero;
    place("hero", hero.pos, () => h("div", { class: "unit unit--hero" },
      h("span", { class: "unit__portrait" }, art(state.heroId, "unit__art")),
      h("span", { class: "unit__facing" }, "▲")), (el) => {
      el.dataset.facing = hero.facing;
      el.classList.toggle("is-hurt", hero.hp <= Math.ceil(hero.maxHp / 3));
    });
    for (const e of state.enemies) {
      place(`e${e.uid}`, e.pos, () => h("div", { class: "unit unit--enemy" },
        h("span", { class: "unit__portrait" }, art(e.typeId, "unit__art")),
        h("span", { class: "unit__facing" }, "▲"),
        e.modifier ? h("span", { class: "unit__mod" }, modifierName(e.modifier)) : null,
        h("span", { class: "unit__hp" })), (el) => {
        el.dataset.facing = e.facing;
        el.title = enemyName(e);
        const hp = el.querySelector(".unit__hp")!;
        const pips = Array.from({ length: e.maxHp }, (_, i) => h("i", { class: i < e.hp ? "full" : "" }));
        hp.replaceChildren(...pips);
        el.classList.toggle("is-enraged", !!e.statuses.enraged);
      });
    }
    for (const [id, el] of this.unitEls) {
      if (seen.has(id)) continue;
      this.unitEls.delete(id);
      el.classList.add("is-gone");
      setTimeout(() => el.remove(), 400);
    }
  }

  /** A floating number or word over a tile (damage, heal, blocked). */
  float(p: Vec, text: string, kind: "hurt" | "heal" | "info") {
    const el = h("div", { class: `float float--${kind}`, style: `left:${((p.x + 0.5) / this.width) * 100}%;top:${((p.y + 0.3) / this.height) * 100}%` }, text);
    this.fx.appendChild(el);
    setTimeout(() => el.remove(), 1400);
  }
}
