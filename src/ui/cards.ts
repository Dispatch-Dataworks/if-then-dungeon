/** Card elements: full cards for the hand and intro panels, compact chips for rule rows. */
import { CARDS } from "../engine/content";
import { threatOf } from "../engine/game";
import { artUrl, realArt } from "./assets";
import { glyph, h, prefersReducedMotion, type Child } from "./dom";
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
  const label = `${c.name}, ${TYPE_LABEL[c.type]}. ${cardText(cardId, opts.heroId)} ${opts.showThreat !== false ? `Threat ${threatOf(cardId)}.` : ""}${opts.hint ? ` ${opts.hint}` : ""}`;
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

/** Final art cropped to the face, sized to fill a square container (see assets/art/faces.json). */
export function faceImg(id: string, cls: string): HTMLImageElement | null {
  const art = realArt(id);
  if (!art) return null;
  const [x, y, size] = art.face;
  const height = 10000 / size;
  const width = height * 1.25;
  const style = `width:${width}%;height:${height}%;left:${50 - (x * width) / 100}%;top:${50 - (y * height) / 100}%`;
  return h("img", { class: cls, src: art.still, alt: "", draggable: "false", style });
}

/** A cropped portrait: the face from final art, else the art window of the placeholder card. */
export function portraitEl(id: string, cls: string): HTMLElement {
  const url = artUrl(id);
  return h("span", { class: `portrait ${cls}`, "aria-hidden": "true" },
    faceImg(id, "portrait__img") ?? (url ? h("img", { class: "portrait__img", src: url, alt: "", draggable: "false" }) : null));
}

/** The full 5:4 card art: the looping clip (still image when motion is reduced), or null without final art. */
export function cardArtEl(id: string, label: string, cls = ""): HTMLElement | null {
  const art = realArt(id);
  if (!art) return null;
  const figure = (media: HTMLElement) => h("figure", { class: `card-art ${cls}`.trim() }, media);
  if (!art.video || prefersReducedMotion()) return figure(h("img", { src: art.still, alt: label }));
  const video = h("video", { src: art.video, poster: art.still, autoplay: true, muted: true, loop: true, playsinline: true, "aria-label": label });
  video.muted = true;
  return figure(video);
}
