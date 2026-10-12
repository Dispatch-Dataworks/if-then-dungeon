/** Level screen: HUD, board, exchange -> build -> execution playback -> outcome, and teaching panels. */
import { eq, type Vec } from "../engine/board";
import { CARDS, HEROES, LEVELS, getLevel } from "../engine/content";
import {
  EXCHANGE_MAX, exchange, newGame, playTurn, restartLevel,
  type Frame, type Game, type TurnResult,
} from "../engine/game";
import type { RowDraft } from "../engine/rules/rows";
import { heroArmor, levelOf, type GameEvent, type GameState } from "../engine/state";
import { artUrl, tileUrl } from "./assets";
import { BoardView, type GhostPlan } from "./board";
import { groupedPredicate, otherwiseEl, RowBuilder } from "./builder";
import { cardArtEl, cardEl, chipEl, portraitEl } from "./cards";
import { heroArtKey } from "./looks";
import { glyph, h, prefersReducedMotion, replace, type Child } from "./dom";
import { describeTile, entryFor, type InfoEntry } from "./info";
import { openModal } from "./modal";
import { heroUpgrades, heroesUnlockedBy, markCleared, progress, update } from "./progress";
import { upgradeName } from "../engine/upgrades";
import { DIR_WORD, eventText, levelTitle, nameOf, pressureOn, statusLabel, themeOf } from "./text";

export interface Nav {
  toTitle(): void;
  toLevel(levelId: number): void;
}

type Mode = "exchange" | "build" | "play";

interface Playback {
  result: TurnResult;
  before: GameState;
  index: number;
  playing: boolean;
  timer: number | undefined;
  done: boolean;
  /** For each frame: whether the row's predicate was TRUE. */
  truth: (boolean | undefined)[];
}

const SPEEDS: { value: number; label: string }[] = [
  { value: 1, label: "1×" },
  { value: 2, label: "2×" },
  { value: 4, label: "4×" },
  { value: 0, label: "Instant" },
];

/** Default "what if" roll for a test run: the middle of the die (d4 → 2, d6 → 3). */
const middleRoll = (sides: number) => Math.max(1, Math.floor((sides + 1) / 2));

/** A stable seed per level so a level always starts with the same deal (fair, repeatable puzzles). */
const levelSeed = (levelId: number) => 1000 + levelId * 7919;

const LOG_ICON: Record<string, string> = {
  action: "▶", attack: "⚔", enemy_attack: "⚔", hero_hurt: "♥", enemy_hurt: "✶", enemy_dead: "☠", hero_dead: "☠",
  heal: "✚", pickup: "★", drop: "★", spawn: "☗", pressure: "◆", fail: "✗", win: "⚑", status: "◎", push: "➜",
  move: "➜", jump: "⤴", turn: "↻", wait: "…", default: "↻", reveal: "◌", block: "⛨", cleanse: "✚", info: "·", enemy_buff: "▲",
};

export class LevelScreen {
  private game: Game;
  private mode: Mode = "exchange";
  private board!: BoardView;
  private readonly builder: RowBuilder;
  private exchangeSel = new Set<string>();
  private pb: Playback | null = null;
  private shown: GameState;
  private selected: Vec | null = null;
  private lastTurn: { threat: number; spawned: string[]; pressure: number; turn: number } | null = null;
  private retryNote = "";
  private keepRows = false;
  private readonly pressure: boolean;
  private previewWasOn = false;

  private readonly el: HTMLElement;
  private readonly hudEl = h("div", { class: "hud", role: "group", "aria-label": "Hero status" });
  private readonly boardHost = h("div", { class: "board-host" });
  private readonly sideEl = h("div", { class: "area-side" });
  private readonly previewEl = h("section", { class: "panel preview", "aria-labelledby": "preview-title", hidden: true });
  private readonly infoEl = h("section", { class: "panel info", "aria-live": "polite", "aria-label": "Tile details" });
  private readonly logList = h("ol", { class: "log__list" });
  private readonly logEl = h("section", { class: "panel log", "aria-labelledby": "log-title" },
    h("h2", { id: "log-title" }, "What happened"), this.logList);

  constructor(private readonly root: HTMLElement, private readonly levelId: number, private readonly heroId: string, private readonly nav: Nav) {
    this.game = newGame(levelId, heroId, levelSeed(levelId), heroUpgrades(heroId));
    this.shown = this.game.state;
    this.pressure = pressureOn(levelId);
    this.builder = new RowBuilder(() => this.game.state.hand, heroId, (d) => this.roll(d), {
      pressure: this.pressure,
      onRender: () => this.refreshPreview(),
    });
    const theme = themeOf(levelId);
    const level = getLevel(levelId);
    this.el = h("div", {
      class: "screen level-screen",
      style: `--theme-accent:${theme.palette.accent};--theme-floor:${theme.palette.floor};--theme-glow:${theme.palette.glow}`,
    },
      h("header", { class: "topbar" },
        h("button", { type: "button", class: "btn btn--ghost", onclick: () => this.leave() }, "← Levels"),
        h("h1", { class: "topbar__title" }, levelTitle(levelId)),
        h("span", { class: "topbar__actions" },
          level.introduces.length ? h("button", { type: "button", class: "btn btn--ghost", onclick: () => this.showIntro() }, "What's new") : null,
          h("button", { type: "button", class: "btn btn--ghost", onclick: () => this.showHelp() }, "How to play"))),
      this.hudEl,
      h("main", { class: "level-main" },
        h("div", { class: "area-board" }, this.boardHost, this.previewEl),
        this.sideEl,
        this.infoEl,
        this.logEl),
    );
    replace(root, this.el);
    this.mountBoard();
    this.renderAll();
    if (level.introduces.length && !progress().seenIntro.includes(levelId)) {
      update((p) => p.seenIntro.push(levelId));
      this.showIntro();
    }
  }

  private mountBoard() {
    this.board = new BoardView(this.game.state, (p) => this.selectTile(p));
    replace(this.boardHost, this.board.el);
  }

  private leave() {
    this.stopTimer();
    this.nav.toTitle();
  }

  // ---------- rendering ----------

  private renderAll() {
    this.renderHud(this.shown);
    this.renderInfo();
    this.renderSide();
  }

  private renderHud(s: GameState) {
    const hero = HEROES[s.heroId]!;
    const statuses = Object.entries(s.hero.statuses).filter(([, n]) => n > 0).map(([st, n]) => statusLabel(st, n));
    const level = levelOf(s);
    const hpPct = Math.round((s.hero.hp / s.hero.maxHp) * 100);
    const stat = (label: string, value: Child, cls = "", icon?: string) =>
      h("div", { class: `stat ${cls}` }, icon ? glyph(icon) : null, h("span", { class: "stat__label" }, label), h("span", { class: "stat__value" }, value));
    replace(this.hudEl,
      h("div", { class: "stat stat--hero" },
        portraitEl(heroArtKey(s.heroId), "stat__portrait"),
        h("span", { class: "stat__value" }, hero.name)),
      h("div", { class: `stat stat--hp${s.hero.hp <= 3 ? " is-low" : ""}` },
        glyph("heart"), h("span", { class: "stat__label" }, "HP"),
        h("span", { class: "stat__value" }, `${s.hero.hp}/${s.hero.maxHp}`),
        h("span", { class: "hpbar", role: "meter", "aria-label": "Hit points", "aria-valuemin": "0", "aria-valuemax": String(s.hero.maxHp), "aria-valuenow": String(s.hero.hp) },
          h("span", { style: `width:${hpPct}%` }))),
      stat("Armor", String(heroArmor(s)), "", "shield"),
      stat("Lives", h("span", { class: "lives" }, Array.from({ length: 3 }, (_, i) => h("span", { class: i < s.lives ? "life" : "life is-lost" }, i < s.lives ? "♥" : "♡")), ` ${s.lives}/3`)),
      this.pressure ? stat("Pressure", String(s.pressure), s.pressure > 0 ? "has-pressure" : "", "flame") : null,
      stat("Turn", String(s.turnIndex + 1)),
      stat("Dice", `d${level.diceSides}`),
      h("div", { class: "stat stat--status" }, h("span", { class: "stat__label" }, "Status"),
        h("span", { class: "stat__value" }, statuses.length ? statuses.join(", ") : "OK")),
    );
  }

  private selectTile(p: Vec) {
    this.selected = p;
    this.renderInfo();
  }

  private renderInfo() {
    const entries = this.selected ? describeTile(this.shown, this.selected) : [];
    if (!entries.length) {
      replace(this.infoEl, h("h2", null, "What's on this tile?"), h("p", { class: "muted" }, "Tap any tile on the map (or focus the map and use the arrow keys) to learn about it."));
      return;
    }
    replace(this.infoEl, h("h2", null, "What's on this tile?"), entries.map((e) => infoCard(e)));
  }

  private renderSide() {
    if (this.mode === "exchange") replace(this.sideEl, this.exchangePanel());
    else if (this.mode === "build") replace(this.sideEl, this.builder.render());
    else replace(this.sideEl, this.playPanel());
    if (this.mode !== "build") this.refreshPreview();
  }

  // ---------- test run (preview) ----------

  /** Re-run the test run on a throwaway copy of the game, or clear it when it is off. Never touches the real game. */
  private refreshPreview() {
    const on = this.mode === "build" && this.builder.testRun;
    const turnedOn = on && !this.previewWasOn;
    this.previewWasOn = on;
    if (!on) {
      this.previewEl.hidden = true;
      this.previewEl.replaceChildren();
      this.board.showGhost(null);
      return;
    }
    this.previewEl.hidden = false;
    const sides = getLevel(this.levelId).diceSides;
    const rows = this.builder.rows;
    for (const r of rows) r.whatIf = Math.min(sides, Math.max(1, r.whatIf ?? middleRoll(sides)));
    const loops = rows.map((r) => r.whatIf!);
    const v = this.builder.validation();
    let result: TurnResult | null = null;
    let problem = "";
    if (!v.ok) problem = v.errors[0] ?? "Finish your rows first.";
    else {
      try {
        result = playTurn(structuredClone(this.game), this.builder.drafts(), { loops });
      } catch (err) {
        problem = err instanceof Error ? err.message : String(err);
      }
    }
    const focused = document.activeElement instanceof HTMLElement && this.previewEl.contains(document.activeElement)
      ? document.activeElement.dataset.focusKey : undefined;

    const stepper = (i: number) => {
      const r = rows[i]!;
      const set = (n: number) => { r.whatIf = n; this.refreshPreview(); };
      return h("div", { class: "whatif__row", role: "group", "aria-label": `Row ${i + 1} test roll` },
        h("span", { class: "whatif__label" }, `Row ${i + 1}`),
        h("button", { type: "button", class: "icon-btn", "data-focus-key": `dn${i}`, "aria-label": `Row ${i + 1}: roll one less`, disabled: r.whatIf! <= 1, onclick: () => set(r.whatIf! - 1) }, "−"),
        h("span", { class: "die", role: "status", "aria-label": `Row ${i + 1} rolls ${r.whatIf} on a d${sides}` }, h("b", null, String(r.whatIf)), h("small", null, `d${sides}`)),
        h("button", { type: "button", class: "icon-btn", "data-focus-key": `up${i}`, "aria-label": `Row ${i + 1}: roll one more`, disabled: r.whatIf! >= sides, onclick: () => set(r.whatIf! + 1) }, "+"));
    };

    replace(this.previewEl,
      h("div", { class: "preview__head" },
        h("h2", { id: "preview-title" }, glyph("sensor"), " Test run"),
        h("button", { type: "button", class: "btn btn--ghost", "data-focus-key": "hide", onclick: () => this.builder.setTestRun(false, () => this.sideEl.querySelector<HTMLElement>(".test-run")?.focus()) }, "Hide")),
      h("p", { class: "help" }, "A prediction, not the real thing: pick what each row's die might roll. Nothing is used up until you Roll & Lock."),
      h("div", { class: "whatif" }, rows.map((_, i) => stepper(i))),
      result ? this.previewSummary(result, loops) : h("p", { class: "preview__problem", role: "status" }, glyph("cross"), ` Can't test yet: ${problem}`));

    if (focused) {
      // A stepper at its limit is disabled: keep focus on the same row's other button.
      const twin = focused.replace(/^(up|dn)/, (m) => (m === "up" ? "dn" : "up"));
      const target = [focused, twin].map((k) => this.previewEl.querySelector<HTMLButtonElement>(`[data-focus-key="${k}"]`)).find((b) => b && !b.disabled);
      target?.focus();
    }
    this.board.showGhost(result ? this.ghostPlan(result) : null);
    if (turnedOn) {
      const r = this.boardHost.getBoundingClientRect();
      if (r.top < 0 || r.bottom > window.innerHeight) this.boardHost.scrollIntoView({ block: "start", behavior: prefersReducedMotion() ? "auto" : "smooth" });
    }
  }

  /** Loop frames only (the turn-end frame, rowIndex -1, is not part of the hero's run). */
  private static rowFrames(result: TurnResult) {
    return result.frames.filter((f) => f.rowIndex >= 0);
  }

  private ghostPlan(result: TurnResult): GhostPlan {
    const start = this.game.state;
    const frames = LevelScreen.rowFrames(result);
    const last = frames[frames.length - 1]?.state ?? start;
    const moved = (uid: number, p: Vec) => { const was = start.enemies.find((e) => e.uid === uid); return !was || !eq(was.pos, p); };
    return {
      start: start.hero.pos,
      steps: frames.map((f, i) => ({
        n: i + 1,
        pos: f.state.hero.pos,
        facing: f.state.hero.facing,
        fail: f.events.some((e) => e.kind === "fail"),
        hurt: f.events.filter((e) => e.kind === "hero_hurt").reduce((sum, e) => sum + (e.amount ?? 0), 0),
      })),
      end: { pos: last.hero.pos, facing: last.hero.facing, fell: LevelScreen.heroFell(result), won: result.outcome === "won" },
      enemies: last.enemies.filter((e) => moved(e.uid, e.pos)).map((e) => ({ typeId: e.typeId, uid: e.uid, pos: e.pos })),
    };
  }

  /** A fall means the hero died; running out of turns ("lost" without a death) is not a fall. */
  private static heroFell(result: TurnResult): boolean {
    return result.frames.some((f) => f.events.some((e) => e.kind === "hero_dead"));
  }

  private previewSummary(result: TurnResult, loops: number[]): HTMLElement {
    const start = this.game.state;
    const frames = LevelScreen.rowFrames(result);
    const last = frames[frames.length - 1]?.state ?? start;
    const name = (id: string | undefined) => (id ? CARDS[id]?.name ?? id : "?");
    const fell = LevelScreen.heroFell(result);
    const won = result.outcome === "won";

    const rowLines = result.rows.map((row, i) => {
      const fs = frames.filter((f) => f.rowIndex === i);
      const labels = fs.map((f) => f.fired === "then" ? `TRUE → ${name(row.thenCardId)}` : f.fired === "else" ? `FALSE → ${name(row.elseCardId)}` : "FALSE → default");
      const runs: { label: string; n: number }[] = [];
      for (const l of labels) {
        const prev = runs[runs.length - 1];
        if (prev?.label === l) prev.n++;
        else runs.push({ label: l, n: 1 });
      }
      const head = `Row ${i + 1} (${loops[i]} loop${loops[i] === 1 ? "" : "s"}): `;
      if (!fs.length) return h("li", { class: "is-skipped" }, head, won ? "not needed (exit reached)." : "never runs (the hero fell first).");
      return h("li", null, head, runs.map((r, j) => [j ? ", " : "", h("span", { class: r.label.startsWith("TRUE") ? "pv-true" : "pv-false" }, r.label), r.n > 1 ? ` ×${r.n}` : ""]),
        fs.length < loops[i]! ? (won ? " then the hero is out!" : " then stops.") : ".");
    });

    const hp0 = start.hero.hp;
    const hp1 = Math.max(0, last.hero.hp);
    let firstLoop = 0;
    let firstProblem: GameEvent | undefined;
    for (const [i, f] of frames.entries()) {
      firstProblem = f.events.find((e) => e.kind === "fail" || e.kind === "hero_hurt" || e.kind === "hero_dead");
      if (firstProblem) { firstLoop = i + 1; break; }
    }
    const where = won ? "Reaches the EXIT!"
      : fell ? `The hero would fall on loop ${frames.length}.`
      : `Ends at the END mark, facing ${DIR_WORD[last.hero.facing]}. Exit not reached this turn.`;
    return h("div", { class: "preview__summary", role: "status", "aria-live": "polite" },
      h("h3", null, `If the dice roll ${loops.join(" / ")}, your hero would…`),
      h("ol", { class: "preview__rows" }, rowLines),
      h("ul", { class: "preview__facts" },
        h("li", { class: won ? "is-good" : fell ? "is-bad" : "" }, glyph(won ? "check" : fell ? "cross" : "step"), " ", where),
        h("li", { class: hp1 < hp0 ? "is-bad" : "" }, glyph("heart"), ` HP ${hp0} → ${hp1}`, hp1 < hp0 ? ` (−${hp0 - hp1})` : hp1 > hp0 ? ` (+${hp1 - hp0})` : " (no damage)"),
        h("li", { class: firstProblem ? "is-bad" : "is-good" }, glyph(firstProblem ? "cross" : "check"),
          firstProblem ? [` First problem, loop ${firstLoop}: `, eventText(firstProblem.text)] : " No failed actions or damage.")),
      h("p", { class: "muted preview__note" }, "Enemies move too, and other rolls can play out differently. Try a few numbers!"));
  }

  // ---------- exchange ----------

  private exchangePanel(): HTMLElement {
    const s = this.game.state;
    const n = this.exchangeSel.size;
    const full = n >= EXCHANGE_MAX;
    const summary = this.lastTurn;
    return h("section", { class: "panel exchange", "aria-labelledby": "ex-title" },
      h("h2", { id: "ex-title" }, `Turn ${s.turnIndex + 1}: swap cards?`),
      this.retryNote ? h("p", { class: "note note--retry" }, this.retryNote) : null,
      summary ? h("div", { class: "note" },
        h("b", null, `End of turn ${summary.turn}: `),
        this.pressure ? (summary.threat ? `unplaced cards added ${summary.threat} Pressure. ` : "no new Pressure. ") : "",
        summary.spawned.length ? `Spawned: ${summary.spawned.map(nameOf).join(", ")}. ` : "No enemies spawned. ",
        this.pressure ? `Pressure now ${summary.pressure}.` : "") : null,
      h("p", { class: "help" }, `You drew ${s.hand.length} cards. Pick up to ${EXCHANGE_MAX} you don't want and swap them for new ones, or keep your hand.${this.pressure ? " Swapped cards never add Pressure." : ""}`),
      this.pressure ? null : h("p", { class: "note note--calm" }, "No Pressure on this level: unused cards are safe."),
      h("div", { class: "hand", role: "group", "aria-label": "Your hand" },
        s.hand.map((c) => {
          const sel = this.exchangeSel.has(c.instanceId);
          return cardEl(c.cardId, {
            heroId: this.heroId,
            instanceId: c.instanceId,
            selected: sel,
            showThreat: this.pressure,
            disabled: !sel && full,
            hint: sel ? "Selected to swap." : "",
            onClick: () => {
              if (sel) this.exchangeSel.delete(c.instanceId);
              else if (!full) this.exchangeSel.add(c.instanceId);
              const idx = s.hand.indexOf(c);
              this.renderSide();
              this.sideEl.querySelectorAll<HTMLElement>(".hand .card")[idx]?.focus();
            },
          });
        })),
      h("p", { class: "muted", role: "status" }, `${n} of ${EXCHANGE_MAX} selected to swap.`),
      h("div", { class: "actions" },
        h("button", { type: "button", class: "btn btn--primary", disabled: n === 0, onclick: () => this.doExchange([...this.exchangeSel]) }, n ? `Swap ${n} card${n === 1 ? "" : "s"}` : "Swap cards"),
        h("button", { type: "button", class: `btn${n === 0 ? " btn--primary" : ""}`, onclick: () => this.doExchange([]) }, "Keep my hand")),
    );
  }

  private doExchange(ids: string[]) {
    exchange(this.game, ids);
    this.exchangeSel.clear();
    if (this.keepRows) this.builder.keepOnly(this.game.state.hand);
    else this.builder.reset();
    this.keepRows = false;
    this.mode = "build";
    this.renderSide();
    this.sideEl.querySelector<HTMLElement>(".hand .card")?.focus();
  }

  // ---------- execution ----------

  private roll(drafts: RowDraft[]) {
    const before = structuredClone(this.game.state);
    let result: TurnResult;
    try {
      result = playTurn(this.game, drafts);
    } catch (err) {
      this.builder.message = err instanceof Error ? err.message : String(err);
      this.renderSide();
      return;
    }
    const speed = progress().speed;
    const truth = result.frames.map((f) => f.truth);
    this.pb = { result, before, index: -1, playing: speed !== 0, timer: undefined, done: false, truth };
    this.mode = "play";
    this.builder.testRun = false;
    this.retryNote = "";
    this.addLogHeading(`Turn ${before.turnIndex + 1}: rolled ${result.loops.map((l, i) => `row ${i + 1} → ${l}`).join(", ")}`);
    this.renderSide();
    const r = this.boardHost.getBoundingClientRect();
    if (r.top < 0 || r.bottom > window.innerHeight) this.boardHost.scrollIntoView({ block: "start", behavior: prefersReducedMotion() ? "auto" : "smooth" });
    if (speed === 0) this.runToEnd();
    else this.schedule(prefersReducedMotion() ? 200 : 900);
  }

  private frameMs() {
    const speed = progress().speed || 4;
    return Math.round(1000 / speed);
  }

  private schedule(ms = this.frameMs()) {
    this.stopTimer();
    if (!this.pb || !this.pb.playing || this.pb.done) return;
    this.pb.timer = window.setTimeout(() => {
      this.advance();
      this.schedule();
    }, ms);
  }

  private stopTimer() {
    if (this.pb?.timer !== undefined) clearTimeout(this.pb.timer);
    if (this.pb) this.pb.timer = undefined;
  }

  private advance(animate = true) {
    const pb = this.pb;
    if (!pb || pb.done) return;
    pb.index++;
    const frame = pb.result.frames[pb.index]!;
    const moveMs = animate && !prefersReducedMotion() ? Math.min(320, Math.round(this.frameMs() * 0.5)) : 0;
    this.showFrame(frame, moveMs, animate);
    if (pb.index >= pb.result.frames.length - 1) this.finish();
    else if (animate) this.updatePlayPanel();
  }

  private showFrame(frame: Frame, moveMs: number, floats: boolean) {
    this.shown = frame.state;
    this.board.render(frame.state, moveMs);
    if (floats) {
      for (const e of frame.events) {
        if (!e.pos) continue;
        if (e.kind === "hero_hurt" || e.kind === "enemy_hurt") this.board.float(e.pos, `−${e.amount ?? "?"}`, "hurt");
        else if (e.kind === "heal") this.board.float(e.pos, `+${e.amount ?? ""}`, "heal");
        else if (e.kind === "block") this.board.float(e.pos, "Blocked", "info");
        else if (e.kind === "fail") this.board.float(e.pos, "✗ Fail", "info");
      }
    }
    this.addLogFrame(frame);
    this.renderHud(frame.state);
    this.renderInfo();
  }

  private runToEnd() {
    const pb = this.pb;
    if (!pb) return;
    this.stopTimer();
    while (!pb.done) this.advance(false);
  }

  private finish() {
    const pb = this.pb!;
    pb.done = true;
    pb.playing = false;
    this.stopTimer();
    const r = pb.result;
    const g = this.game;
    this.updatePlayPanel();
    if (r.outcome === "continue") {
      this.lastTurn = { threat: r.threat, spawned: r.spawned, pressure: g.state.pressure, turn: pb.before.turnIndex + 1 };
    } else if (r.outcome === "died") {
      this.deathRecap();
    } else if (r.outcome === "lost") {
      this.lostDialog();
    } else if (r.outcome === "won") {
      this.wonDialog();
    }
  }

  private nextTurn() {
    this.pb = null;
    this.mode = "exchange";
    this.shown = this.game.state;
    this.board.render(this.game.state, 0);
    this.addLogHeading(`Turn ${this.game.state.turnIndex + 1} begins`);
    this.renderAll();
    this.sideEl.querySelector<HTMLElement>("h2")?.setAttribute("tabindex", "-1");
    this.sideEl.querySelector<HTMLElement>("h2")?.focus();
  }

  private playPanel(): HTMLElement {
    const pb = this.pb!;
    const sides = levelOf(pb.before).diceSides;
    const frame = pb.index >= 0 ? pb.result.frames[pb.index] : undefined;
    const rowsEl = h("ol", { class: "rows rows--locked" }, pb.result.rows.map((row, i) => {
      const isActive = frame?.rowIndex === i;
      const doneLoops = pb.result.frames.slice(0, pb.index + 1).filter((f) => f.rowIndex === i).length;
      const truth = isActive ? pb.truth[pb.index] : undefined;
      const fired = isActive ? frame!.fired : undefined;
      const chips = (ids: string[]) => ids.map((id) => chipEl(this.cardOf(pb, id)));
      return h("li", { class: `row is-locked${isActive ? " is-running" : ""}${doneLoops >= pb.result.loops[i]! ? " is-done" : ""}` },
        h("div", { class: "row__head" },
          h("span", { class: "row__num" }, `Row ${i + 1}`),
          h("span", { class: `die${pb.index < 0 ? " is-rolling" : ""}`, "aria-label": `Rolled ${pb.result.loops[i]} on a d${sides}` },
            h("b", null, String(pb.result.loops[i])), h("small", null, `d${sides}`)),
          h("span", { class: "row__loops" }, `loop ${Math.min(doneLoops, pb.result.loops[i]!)} of ${pb.result.loops[i]}`)),
        h("div", { class: "sentence" },
          h("span", { class: `kw kw--if${truth === true ? " is-true" : truth === false ? " is-false" : ""}` }, "IF"),
          h("span", { class: "slot" }, chips(row.draft.ifTokens)),
          truth !== undefined ? h("span", { class: `verdict ${truth ? "is-true" : "is-false"}` }, glyph(truth ? "check" : "cross"), truth ? "TRUE" : "FALSE") : null,
          h("span", { class: `kw kw--then${fired === "then" ? " is-fired" : ""}` }, "THEN"),
          h("span", { class: `slot${fired === "then" ? " is-fired" : ""}` }, chips([row.draft.thenAction])),
          row.draft.elseCard ? [
            h("span", { class: `kw kw--else${fired === "else" ? " is-fired" : ""}` }, "ELSE"),
            h("span", { class: `slot${fired === "else" ? " is-fired" : ""}` }, chips([row.draft.elseAction!])),
          ] : null,
          fired === "default" ? h("span", { class: "kw kw--default is-fired" }, "↻ default behavior") : null),
        otherwiseEl(this.heroId, row.elseCardId, fired === "default" || fired === "else"),
        row.predicate.kind === "sensor" ? null : h("p", { class: "row__status ok" }, h("span", null, "Reads as: ", h("span", { class: "grouped" }, groupedPredicate(row.predicate)))));
    }));
    const caption = frame
      ? frame.rowIndex < 0
        ? this.pressure ? "End of turn: Pressure and spawns." : "End of turn."
        : `Row ${frame.rowIndex + 1}, loop ${frame.loopInRow + 1}: ${pb.truth[pb.index] ? "TRUE → THEN" : frame.fired === "else" ? "FALSE → ELSE" : "FALSE → default behavior"}`
      : "Rolling the dice…";
    const speed = progress().speed;
    const controls = pb.done
      ? this.doneControls(pb)
      : h("div", { class: "controls", role: "group", "aria-label": "Playback controls" },
          h("button", { type: "button", class: "btn btn--primary", onclick: () => this.togglePlay() }, glyph(pb.playing ? "pause" : "play"), pb.playing ? " Pause" : " Play"),
          h("button", { type: "button", class: "btn", onclick: () => { pb.playing = false; this.stopTimer(); this.advance(); }, disabled: pb.done }, glyph("step"), " Step"),
          h("button", { type: "button", class: "btn", onclick: () => this.runToEnd() }, glyph("skip"), " Skip to end"),
          h("div", { class: "speed", role: "radiogroup", "aria-label": "Speed" }, SPEEDS.map((sp) =>
            h("button", { type: "button", role: "radio", class: `btn btn--seg${speed === sp.value ? " is-on" : ""}`, "aria-checked": String(speed === sp.value), onclick: () => this.setSpeed(sp.value) }, sp.label))));
    return h("section", { class: "panel play", "aria-labelledby": "play-title" },
      h("h2", { id: "play-title" }, "Running your rules"),
      h("p", { class: "caption", role: "status" }, caption),
      controls,
      rowsEl);
  }

  private doneControls(pb: Playback): HTMLElement {
    const r = pb.result;
    if (r.outcome === "continue") {
      return h("div", { class: "turn-summary" },
        h("p", null, h("b", null, "Turn complete. "),
          !this.pressure ? "" : r.threat ? `Unplaced cards added ${r.threat} Pressure. ` : "Every card was placed: no new Pressure. ",
          r.spawned.length ? `Spawned: ${r.spawned.map(nameOf).join(", ")}.` : "Nothing spawned."),
        h("div", { class: "actions" }, h("button", { type: "button", class: "btn btn--primary", onclick: () => this.nextTurn() }, "Next turn →")));
    }
    const label = r.outcome === "won" ? "Level complete!" : r.outcome === "died" ? "The hero fell." : "Out of lives.";
    return h("div", { class: "turn-summary" }, h("p", null, h("b", null, label)),
      h("div", { class: "actions" }, h("button", { type: "button", class: "btn btn--primary", onclick: () => this.finishDialogAgain() }, "Continue")));
  }

  private finishDialogAgain() {
    const r = this.pb?.result;
    if (!r) return;
    if (r.outcome === "died") this.deathRecap();
    else if (r.outcome === "lost") this.lostDialog();
    else if (r.outcome === "won") this.wonDialog();
  }

  private cardOf(pb: Playback, instanceId: string): string {
    return pb.before.hand.find((c) => c.instanceId === instanceId)?.cardId ?? "A_WAIT";
  }

  private updatePlayPanel() {
    if (this.mode === "play") this.renderSide();
  }

  private togglePlay() {
    const pb = this.pb;
    if (!pb) return;
    pb.playing = !pb.playing;
    if (pb.playing) {
      if (progress().speed === 0) this.runToEnd();
      else this.schedule(50);
    } else this.stopTimer();
    this.renderSide();
    this.sideEl.querySelector<HTMLElement>(".controls .btn--primary")?.focus();
  }

  private setSpeed(v: number) {
    update((p) => { p.speed = v; });
    const pb = this.pb;
    if (pb && !pb.done) {
      if (v === 0) {
        this.runToEnd();
        return;
      }
      if (pb.playing) this.schedule();
    }
    this.renderSide();
    this.sideEl.querySelector<HTMLElement>(".speed .is-on")?.focus();
  }

  // ---------- log ----------

  private addLogHeading(text: string) {
    this.logList.append(h("li", { class: "log__turn" }, text));
    this.trimLog();
  }

  private addLogFrame(frame: Frame) {
    const head = frame.rowIndex < 0 ? "End of turn" : `Row ${frame.rowIndex + 1} · loop ${frame.loopInRow + 1}`;
    const items = frame.events.filter((e) => e.kind !== "turn").map((e) => logItem(e));
    this.logList.append(h("li", { class: "log__frame" }, h("span", { class: "log__head" }, head), h("ul", null, items)));
    this.trimLog();
    const scroller = this.logList;
    scroller.scrollTop = scroller.scrollHeight;
  }

  private trimLog() {
    while (this.logList.children.length > 250) this.logList.firstElementChild?.remove();
  }

  // ---------- outcomes ----------

  private lastEvents(n: number): GameEvent[] {
    const frames = this.pb?.result.frames ?? [];
    const evs = frames.flatMap((f) => f.events).filter((e) => e.kind !== "eval" && e.kind !== "turn" && e.kind !== "default");
    return evs.slice(-n);
  }

  private deathRecap() {
    const events = this.lastEvents(8);
    const hurt = [...events].reverse().find((e) => e.kind === "hero_hurt");
    const cause = hurt ? eventText(hurt.text).replace(/\s*\(HP 0\)\.?$/, ".") : "The hero ran out of HP.";
    const g = this.game;
    openModal({
      title: "The hero fell!",
      className: "modal--death",
      dismissible: false,
      body: [
        h("p", null, h("b", null, "Cause: "), cause),
        h("p", null, h("b", null, "Last moments:")),
        h("ol", { class: "recap" }, events.map((e) => h("li", null, eventText(e.text)))),
        h("p", { class: "hint" }, h("b", null, "Try this: "), deathHint(events)),
        h("p", null, `You have ${g.state.lives} ${g.state.lives === 1 ? "life" : "lives"} left. The turn rewinds: same cards, same dice for the same rows. Change your rules to change what happens.`),
      ],
      actions: [
        { label: "Try again (same cards)", primary: true, onClick: () => this.retryTurn() },
        { label: "Restart level", onClick: () => this.restart() },
      ],
    });
  }

  private retryTurn() {
    this.keepRows = true;
    this.retryNote = "Turn rewound. Your rows are kept (where you still hold the cards) so you can fix them.";
    this.lastTurn = null;
    this.pb = null;
    this.mode = "exchange";
    this.shown = this.game.state;
    this.board.render(this.game.state, 0);
    this.addLogHeading(`Retrying turn ${this.game.state.turnIndex + 1} (${this.game.state.lives} lives left)`);
    this.renderAll();
  }

  private restart() {
    this.game = restartLevel(this.game);
    this.pb = null;
    this.mode = "exchange";
    this.lastTurn = null;
    this.retryNote = "";
    this.keepRows = false;
    this.builder.reset();
    this.shown = this.game.state;
    this.mountBoard();
    this.logList.replaceChildren();
    this.addLogHeading("Level restarted");
    this.renderAll();
  }

  private lostDialog() {
    const tooLong = this.game.state.lives > 0 && !this.game.state.diedThisTurn;
    openModal({
      title: tooLong ? "Out of time" : "Out of lives",
      dismissible: false,
      body: [
        h("p", null, tooLong
          ? this.pressure
            ? "The level took too many turns. Pressure keeps growing when cards go unused, so try to place more cards and head for the exit."
            : "The level took too many turns. Try a Test run before you roll, and head for the exit."
          : "All 3 lives are gone. The level starts over with the same first hand, so you can use what you learned."),
        tooLong ? null : h("ol", { class: "recap" }, this.lastEvents(5).map((e) => h("li", null, eventText(e.text)))),
      ],
      actions: [
        { label: "Restart level", primary: true, onClick: () => this.restart() },
        { label: "Back to levels", onClick: () => this.leave() },
      ],
    });
  }

  private wonDialog() {
    const s = this.game.state;
    const firstClear = !progress().cleared.includes(this.levelId);
    const upgradesBefore = heroUpgrades(this.heroId);
    markCleared(this.levelId, this.heroId);
    const newUpgrades = heroUpgrades(this.heroId).filter((u) => !upgradesBefore.includes(u));
    const unlockedHeroes = firstClear ? heroesUnlockedBy(this.levelId) : [];
    const idx = LEVELS.findIndex((l) => l.levelId === this.levelId);
    const next = LEVELS[idx + 1];
    openModal({
      title: "Level complete!",
      className: "modal--won",
      dismissible: false,
      body: [
        h("ul", { class: "summary" },
          h("li", null, `Turns: ${s.turnIndex + 1}`),
          h("li", null, `HP left: ${s.hero.hp}/${s.hero.maxHp}`),
          h("li", null, `Falls: ${this.game.deaths}${this.game.levelRestarts ? ` · Restarts: ${this.game.levelRestarts}` : ""}`),
          this.pressure ? h("li", null, `Pressure left: ${s.pressure}`) : null),
        next && firstClear ? h("p", { class: "unlock" }, glyph("check"), ` Unlocked: Level ${next.levelId} (${themeOf(next.levelId).name})`) : null,
        unlockedHeroes.map((hero) => h("p", { class: "unlock" }, glyph("hero_action"), ` New hero: ${hero.name}! Pick them on the level screen.`)),
        newUpgrades.map((id) => h("p", { class: "unlock" }, glyph("check"), ` Upgrade earned: ${upgradeName(id)}. ${HEROES[this.heroId]!.upgrades.find((u) => u.id === id)!.effect}`)),
      ],
      actions: [
        ...(next ? [{ label: `Next: Level ${next.levelId}`, primary: true, onClick: () => this.nav.toLevel(next.levelId) }] : []),
        { label: "Play again", onClick: () => this.nav.toLevel(this.levelId) },
        { label: "Back to levels", primary: !next, onClick: () => this.leave() },
      ],
    });
  }

  // ---------- teaching ----------

  showIntro() {
    const level = getLevel(this.levelId);
    openModal({
      title: `What's new in Level ${this.levelId}`,
      className: "modal--intro",
      body: [
        h("p", { class: "help" }, themeOf(this.levelId).summary),
        h("div", { class: "intro-grid" }, level.introduces.map((id) => infoCard(entryFor(id, this.heroId, pressureOn(this.levelId)), CARDS[id] ? "card" : "char"))),
      ],
      actions: [{ label: "Let's go!", primary: true, onClick: () => {} }],
    });
  }

  private showHelp() {
    const hero = HEROES[this.heroId]!;
    openModal({
      title: "How to play",
      className: "modal--help",
      body: [
        h("ol", { class: "steps" },
          h("li", null, h("b", null, "Swap: "), "you get 10 cards. Swap up to 5 you don't want."),
          h("li", null, h("b", null, "Build rules: "), "make rows like ", h("code", null, "IF Wall Ahead THEN Turn Right"), ". Sensors check the world (TRUE or FALSE); actions are what the hero does."),
          h("li", null, h("b", null, "Roll & Lock: "), "each row rolls a die. That's how many loops the row runs. Rows run in order, top to bottom."),
          h("li", null, h("b", null, "Each loop: "), "if the IF is TRUE the hero does THEN. If FALSE it does ELSE, or its default behavior if there is no ELSE."),
          h("li", null, h("b", null, "Test run: "), "press Test run to see what your rows would do for the rolls you pick, before you lock them in."),
          this.pressure
            ? h("li", null, h("b", null, "Pressure: "), "cards you leave unplaced add Pressure, and Pressure spawns enemies. Place as many cards as you can!")
            : h("li", null, h("b", null, "No Pressure here: "), "on this level unused cards are safe, so only place the cards that help."),
          h("li", null, h("b", null, "Goal: "), "reach the EXIT. If the hero falls, the turn rewinds with the same cards (3 lives).")),
        h("p", null, h("b", null, `Your ${hero.name}'s default behavior: `), hero.defaultBehavior.text),
        h("p", null, h("b", null, "Logic tip: "), "NOT is checked first, then AND, then OR. So ", h("code", null, "A OR B AND NOT C"), " means ", h("code", null, "A OR (B AND (NOT C))"), "."),
      ],
      actions: [{ label: "Got it", primary: true, onClick: () => {} }],
    });
  }
}

function infoCard(e: InfoEntry, artKind: "card" | "char" = "char"): HTMLElement {
  const url = e.artId ? tileUrl(e.artId) ?? artUrl(e.artId) : undefined;
  const fitted = !!(e.artId && tileUrl(e.artId));
  const enemy = e.kind?.startsWith("Enemy") ?? false;
  const real = e.artId && artKind === "char" ? cardArtEl(e.artId, "", `info-card__art${enemy ? " card-art--enemy" : ""}`) : null;
  return h("article", { class: "info-card" },
    real ?? (url ? h("img", { class: `info-card__art info-card__art--${fitted ? "tile" : artKind}`, src: url, alt: "" }) : h("div", { class: "info-card__art info-card__art--none", "aria-hidden": "true" }, e.title.charAt(0))),
    h("div", { class: "info-card__body" },
      h("h3", null, e.title),
      e.kind ? h("p", { class: "info-card__kind" }, e.kind) : null,
      e.lines.map((l) => h("p", null, l)),
      e.tip ? h("p", { class: "info-card__tip" }, h("b", null, "Tip: "), e.tip) : null));
}

function logItem(e: GameEvent): HTMLElement {
  if (e.kind === "eval") {
    const truth = e.truth ?? /TRUE$/.test(e.text);
    const text = e.text.replace(/\s*→\s*(TRUE|FALSE)$/, "");
    return h("li", { class: `ev ev--eval ${truth ? "is-true" : "is-false"}` },
      h("span", { class: "ev__text" }, text, " "),
      h("span", { class: `verdict ${truth ? "is-true" : "is-false"}` }, glyph(truth ? "check" : "cross"), truth ? "TRUE" : "FALSE"));
  }
  return h("li", { class: `ev ev--${e.kind}` }, h("span", { class: "ev__icon", "aria-hidden": "true" }, LOG_ICON[e.kind] ?? "·"), h("span", { class: "ev__text" }, eventText(e.text)));
}

function deathHint(events: GameEvent[]): string {
  const text = events.map((e) => e.text).join(" ").toLowerCase();
  if (/spike/.test(text)) return "Put a Spikes Ahead (or Hazard Ahead) row before your moving row, so the hero turns or jumps before stepping on spikes.";
  if (/pit/.test(text)) return "Use IF Pit Ahead THEN Jump Forward as an early row.";
  if (/fog|poison/.test(text)) return "Check Fog Ahead and turn away, or cure poison with Shake It Off.";
  if (/vent|steam/.test(text)) return "IF Vent Active Ahead THEN Wait lets the vent cool down before you walk over it.";
  if (/illusion/.test(text)) return "Probe or Illuminate before walking into a strange-looking tile.";
  if (/curse|sigil/.test(text)) return "Watch for Curse Sigil Ahead and step around it.";
  if (/bleed|vine|blood/.test(text)) return "Bleeding hurts when you move: try Wait or Cauterize while bleeding.";
  if (events.some((e) => e.kind === "enemy_attack")) return "Fight back first: a row like IF Enemy Adjacent THEN Hero Attack near the top lets the hero strike before it moves on.";
  return "Rows run top to bottom. Try changing their order, or add an ELSE so the hero does something useful when the IF is FALSE.";
}

