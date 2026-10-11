/** Card elements: full cards for the hand and intro panels, compact chips for rule rows. */
import { CARDS } from "../engine/content";
import { threatOf } from "../engine/game";
import { artUrl } from "./assets";
import { glyph, h, type Child } from "./dom";
import { cardText, TYPE_LABEL } from "./text";

export interface CardOpts {
  heroId?: string;
  selected?: boolean;
  disabled?: boolean;
  onClick?: () => void;
  /** Extra text for screen readers, e.g. "selected for exchange". */
  hint?: string;
  showThreat?: boolean;
  /** Card instance ID, exposed as data-instance (handy for tests and debugging). */
  instanceId?: string;
}

export const typeClass = (cardId: string) => `type-${CARDS[cardId]?.type ?? "action"}`;

function threatPips(n: number): HTMLElement {
  return h("span", { class: "threat", title: `Threat ${n}` },
    h("span", { class: "threat__pips", "aria-hidden": "true" }, "◆".repeat(n)),
    h("span", { class: "threat__num" }, `Threat ${n}`));
}

/** A hand card: art, name, type glyph and Threat. A button when clickable. */
export function cardEl(cardId: string, opts: CardOpts = {}): HTMLElement {
  const c = CARDS[cardId]!;
  const url = artUrl(cardId);
  const body: Child[] = [
    h("span", { class: "card__frame" }, url ? h("img", { class: "card__art", src: url, alt: "", draggable: "false" }) : null),
    h("span", { class: "card__name" }, glyph(c.type), h("span", null, c.name)),
    opts.showThreat !== false ? threatPips(threatOf(cardId)) : null,
  ];
  const label = `${c.name}, ${TYPE_LABEL[c.type]}. ${cardText(cardId, opts.heroId)} Threat ${threatOf(cardId)}.${opts.hint ? ` ${opts.hint}` : ""}`;
  const cls = `card ${typeClass(cardId)}${opts.selected ? " is-selected" : ""}`;
  if (!opts.onClick) return h("div", { class: cls, title: cardText(cardId, opts.heroId) }, body);
  return h("button", {
    type: "button",
    class: cls,
    "aria-pressed": opts.selected === undefined ? undefined : String(!!opts.selected),
    "aria-label": label,
    title: cardText(cardId, opts.heroId),
    disabled: opts.disabled,
    "data-card": cardId,
    "data-instance": opts.instanceId,
    onclick: opts.onClick,
  }, body, opts.selected ? h("span", { class: "card__check", "aria-hidden": "true" }, glyph("check")) : null);
}

/** A compact chip used inside rule rows. */
export function chipEl(cardId: string, opts: { onClick?: () => void; heroId?: string; label?: string } = {}): HTMLElement {
  const c = CARDS[cardId]!;
  const content = [glyph(c.type), h("span", null, c.name)];
  if (!opts.onClick) return h("span", { class: `chip ${typeClass(cardId)}`, title: cardText(cardId, opts.heroId) }, content);
  return h("button", {
    type: "button",
    class: `chip ${typeClass(cardId)}`,
    title: `${cardText(cardId, opts.heroId)} (click to take it back)`,
    "aria-label": opts.label ?? `${c.name}. Click to return it to your hand.`,
    onclick: opts.onClick,
  }, content);
}

/** A cropped portrait of a character placeholder (shows the art window, not the whole card). */
export function portraitEl(id: string, cls: string): HTMLElement {
  const url = artUrl(id);
  return h("span", { class: `portrait ${cls}`, "aria-hidden": "true" }, url ? h("img", { src: url, alt: "", draggable: "false" }) : null);
}
