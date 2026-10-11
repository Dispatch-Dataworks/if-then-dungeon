/** Rule-row builder: click hand cards into IF / THEN / ELSE slots, reorder rows, validate live. */
import { CARDS } from "../engine/content";
import type { CardInstance } from "../engine/deck";
import { threatOf } from "../engine/game";
import type { Predicate } from "../engine/rules/parse";
import { parseRow, validateRows, type RowDraft } from "../engine/rules/rows";
import { cardEl, chipEl } from "./cards";
import { glyph, h, type Child } from "./dom";

export interface UiRow {
  ifTokens: string[];
  then?: string;
  elseCard?: string;
  elseAction?: string;
}

const emptyRow = (): UiRow => ({ ifTokens: [] });
const toDraft = (r: UiRow): RowDraft => ({
  ifTokens: [...r.ifTokens],
  thenAction: r.then ?? "",
  ...(r.elseCard || r.elseAction ? { elseCard: r.elseCard, elseAction: r.elseAction } : {}),
});
const idsOf = (r: UiRow) => [...r.ifTokens, r.then, r.elseCard, r.elseAction].filter((x): x is string => !!x);

/** Shows how the predicate is grouped: NOT > AND > OR. `A OR B AND NOT C` reads `A OR (B AND (NOT C))`. */
export function groupedPredicate(p: Predicate, nested = false): HTMLElement {
  const name = (id: string) => CARDS[id]?.name ?? id;
  switch (p.kind) {
    case "sensor": return h("span", { class: "g-sensor" }, name(p.id));
    case "not": {
      const inner = groupedPredicate(p.operand, true);
      return h("span", { class: "g-not" }, nested ? "(" : "", h("b", null, "NOT "), inner, nested ? ")" : "");
    }
    case "and":
      return h("span", { class: "g-and" }, nested ? "(" : "", groupedPredicate(p.left, true), h("b", null, " AND "), groupedPredicate(p.right, true), nested ? ")" : "");
    case "or":
      return h("span", { class: "g-or" }, nested ? "(" : "", groupedPredicate(p.left, p.left.kind !== "or"), h("b", null, " OR "), groupedPredicate(p.right, true), nested ? ")" : "");
  }
}

export class RowBuilder {
  rows: UiRow[] = [emptyRow()];
  active = 0;
  message = "";
  private focusAfter: (() => void) | null = null;
  readonly el = h("section", { class: "panel builder", "aria-labelledby": "build-title" });

  constructor(
    private readonly hand: () => CardInstance[],
    private readonly heroId: string,
    private readonly onRoll: (drafts: RowDraft[]) => void,
  ) {}

  reset() {
    this.rows = [emptyRow()];
    this.active = 0;
    this.message = "";
  }

  /** After a retry the hand may differ (exchanges): drop cards that are no longer held, keep the rest. */
  keepOnly(hand: CardInstance[]) {
    const held = new Set(hand.map((c) => c.instanceId));
    this.rows = this.rows.map((r) => ({
      ifTokens: r.ifTokens.filter((id) => held.has(id)),
      then: r.then && held.has(r.then) ? r.then : undefined,
      elseCard: r.elseCard && held.has(r.elseCard) ? r.elseCard : undefined,
      elseAction: r.elseAction && held.has(r.elseAction) ? r.elseAction : undefined,
    })).filter((r) => idsOf(r).length > 0);
    if (!this.rows.length) this.rows = [emptyRow()];
    this.active = Math.min(this.active, this.rows.length - 1);
  }

  drafts = () => this.rows.map(toDraft);
  placed = () => new Set(this.rows.flatMap(idsOf));
  unplaced = () => this.hand().filter((c) => !this.placed().has(c.instanceId));
  unplacedThreat = () => this.unplaced().reduce((s, c) => s + threatOf(c.cardId), 0);

  validation() {
    const hand = this.hand();
    const perRow = this.rows.map((r) => {
      const res = parseRow(hand, toDraft(r));
      return "error" in res ? { error: res.error } : { predicate: res.predicate };
    });
    const all = validateRows(hand, this.drafts());
    return { perRow, errors: all.errors, ok: all.errors.length === 0 };
  }

  private cardOf(instanceId: string) {
    return this.hand().find((c) => c.instanceId === instanceId)?.cardId ?? "";
  }

  place(instanceId: string) {
    const cardId = this.cardOf(instanceId);
    const card = CARDS[cardId];
    if (!card) return;
    let row = this.rows[this.active];
    if (!row) {
      this.rows.push(emptyRow());
      this.active = this.rows.length - 1;
      row = this.rows[this.active]!;
    }
    this.message = "";
    if (card.type === "sensor" || cardId === "OP_NOT" || cardId === "OP_AND" || cardId === "OP_OR") {
      row.ifTokens.push(instanceId);
    } else if (cardId === "OP_ELSE") {
      if (row.elseCard) this.message = `Row ${this.active + 1} already has an ELSE.`;
      else row.elseCard = instanceId;
    } else if (!row.then) {
      row.then = instanceId;
    } else if (row.elseCard && !row.elseAction) {
      row.elseAction = instanceId;
    } else {
      this.message = row.elseCard
        ? `Row ${this.active + 1} is full. Tap a card in the row to take it back, or add a new row.`
        : `Row ${this.active + 1} already has a THEN action. Add an ELSE card first, or start a new row.`;
    }
  }

  private unplace(rowIndex: number, instanceId: string) {
    const r = this.rows[rowIndex]!;
    r.ifTokens = r.ifTokens.filter((id) => id !== instanceId);
    if (r.then === instanceId) r.then = undefined;
    if (r.elseAction === instanceId) r.elseAction = undefined;
    if (r.elseCard === instanceId) {
      r.elseCard = undefined;
      r.elseAction = undefined;
    }
    this.active = rowIndex;
    this.message = "";
  }

  private change(focus?: () => void) {
    this.focusAfter = focus ?? null;
    this.render();
  }

  render(): HTMLElement {
    const v = this.validation();
    const hand = this.unplaced();
    const threat = this.unplacedThreat();
    const rowsEl = h("ol", { class: "rows" }, this.rows.map((r, i) => this.rowEl(r, i, v.perRow[i]!)));
    const handEl = h("div", { class: "hand", role: "group", "aria-label": "Cards in your hand" },
      hand.length
        ? hand.map((c, idx) => cardEl(c.cardId, {
            heroId: this.heroId,
            instanceId: c.instanceId,
            hint: `Places it into row ${this.active + 1}.`,
            onClick: () => {
              this.place(c.instanceId);
              this.change(() => (this.el.querySelectorAll<HTMLElement>(".hand .card")[idx] ?? this.el.querySelectorAll<HTMLElement>(".hand .card")[idx - 1] ?? this.el.querySelector<HTMLElement>(".row.is-active"))?.focus());
            },
          }))
        : h("p", { class: "muted" }, "Every card is placed. No Pressure this turn!"));

    const blocker = v.ok ? "" : v.errors[0] ?? "";
    this.el.replaceChildren(
      h("h2", { id: "build-title" }, "Build your rules"),
      h("p", { class: "help" }, "Tap a card to put it into the ", h("b", null, "editing"), " row. Sensors and NOT / AND / OR go after IF; actions go after THEN; an ELSE card opens an ELSE slot. Tap a placed card to take it back."),
      rowsEl,
      h("button", { type: "button", class: "btn btn--ghost add-row", onclick: () => {
        this.rows.push(emptyRow());
        this.active = this.rows.length - 1;
        this.change(() => this.el.querySelector<HTMLElement>(".row.is-active")?.focus());
      } }, "+ Add row"),
      h("p", { class: "message", role: "status", "aria-live": "polite" }, this.message),
      h("h3", null, `Your hand (${hand.length} unplaced)`),
      handEl,
      h("div", { class: "roll-bar" },
        h("p", { class: `threat-note${threat ? " has-threat" : ""}` }, glyph("flame"),
          threat ? ` Unplaced cards will add ${threat} Pressure at the end of the turn.` : " All cards placed: no new Pressure."),
        h("button", {
          type: "button",
          class: "btn btn--primary roll",
          disabled: !v.ok,
          "aria-describedby": "roll-why",
          onclick: () => v.ok && this.onRoll(this.drafts()),
        }, "Roll & Lock"),
        h("p", { id: "roll-why", class: "roll-why" }, v.ok ? "All rows are valid. Ready to roll!" : `Can't roll yet: ${blocker}`)),
    );
    const f = this.focusAfter;
    this.focusAfter = null;
    if (f) f();
    return this.el;
  }

  private rowEl(r: UiRow, i: number, check: { error?: string; predicate?: Predicate }): HTMLElement {
    const active = i === this.active;
    const chip = (id: string) => chipEl(this.cardOf(id), {
      heroId: this.heroId,
      onClick: () => {
        this.unplace(i, id);
        this.change(() => this.el.querySelectorAll<HTMLElement>(".row")[i]?.focus());
      },
    });
    const slot = (filled: Child, placeholder: string) =>
      filled ? h("span", { class: "slot" }, filled) : h("span", { class: "slot slot--empty" }, placeholder);
    const errorText = check.error ?? (this.dupIn(r) ? "A card is used twice." : "");
    const ok = !errorText;
    const ctl = (label: string, icon: string, disabled: boolean, fn: () => void) =>
      h("button", { type: "button", class: "icon-btn", "aria-label": `${label} row ${i + 1}`, title: label, disabled, onclick: (ev: Event) => { ev.stopPropagation(); fn(); } }, glyph(icon));
    return h("li", {
      class: `row${active ? " is-active" : ""} ${ok ? "is-valid" : "is-invalid"}`,
      tabindex: "0",
      "aria-label": `Row ${i + 1}${active ? ", editing" : ""}. ${ok ? "Valid." : errorText}`,
      onclick: () => { if (this.active !== i) { this.active = i; this.change(); } },
      onkeydown: (ev: KeyboardEvent) => { if ((ev.key === "Enter" || ev.key === " ") && ev.target === ev.currentTarget) { ev.preventDefault(); this.active = i; this.change(() => this.el.querySelectorAll<HTMLElement>(".row")[i]?.focus()); } },
    },
      h("div", { class: "row__head" },
        h("span", { class: "row__num" }, `Row ${i + 1}`),
        active ? h("span", { class: "row__editing" }, "✎ editing") : h("span", { class: "row__hint" }, "tap to edit")),
      h("span", { class: "row__ctl" },
          ctl("Move up", "up", i === 0, () => { this.swap(i, i - 1); this.change(() => this.el.querySelectorAll<HTMLElement>(".row")[i - 1]?.focus()); }),
          ctl("Move down", "down", i === this.rows.length - 1, () => { this.swap(i, i + 1); this.change(() => this.el.querySelectorAll<HTMLElement>(".row")[i + 1]?.focus()); }),
          ctl("Remove", "close", false, () => {
            this.rows.splice(i, 1);
            if (!this.rows.length) this.rows.push(emptyRow());
            this.active = Math.min(this.active, this.rows.length - 1);
            this.change(() => this.el.querySelector<HTMLElement>(".row.is-active")?.focus());
          })),
      h("div", { class: "sentence" },
        h("span", { class: "kw kw--if" }, "IF"),
        slot(r.ifTokens.length ? r.ifTokens.map(chip) : null, "sensor…"),
        h("span", { class: "kw kw--then" }, "THEN"),
        slot(r.then ? chip(r.then) : null, "action…"),
        r.elseCard ? [chip(r.elseCard), slot(r.elseAction ? chip(r.elseAction) : null, "action…")] : null),
      h("p", { class: `row__status ${ok ? "ok" : "bad"}` },
        glyph(ok ? "check" : "cross"),
        ok ? h("span", null, "Valid.", check.predicate && check.predicate.kind !== "sensor" ? [" Reads as: ", h("span", { class: "grouped" }, groupedPredicate(check.predicate))] : null) : h("span", null, errorText)),
    );
  }

  private dupIn(r: UiRow) {
    const ids = idsOf(r);
    return new Set(ids).size !== ids.length;
  }

  private swap(a: number, b: number) {
    const rows = this.rows;
    [rows[a], rows[b]] = [rows[b]!, rows[a]!];
    if (this.active === a) this.active = b;
    else if (this.active === b) this.active = a;
  }
}
