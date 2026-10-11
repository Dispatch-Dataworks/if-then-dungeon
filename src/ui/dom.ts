/** Tiny DOM helpers: build elements declaratively without a framework. */
export type Child = Node | string | number | null | undefined | false | Child[];
type Handler = (ev: any) => void;
export type Props = Record<string, string | number | boolean | Handler | null | undefined>;

export function h<K extends keyof HTMLElementTagNameMap>(tag: K, props?: Props | null, ...children: Child[]): HTMLElementTagNameMap[K] {
  const el = document.createElement(tag);
  for (const [k, v] of Object.entries(props ?? {})) {
    if (v === undefined || v === null || v === false) continue;
    if (k.startsWith("on") && typeof v === "function") el.addEventListener(k.slice(2), v);
    else if (k === "class") el.className = String(v);
    else el.setAttribute(k, v === true ? "" : String(v));
  }
  append(el, children);
  return el;
}

export function append(el: Node, children: Child[]) {
  for (const c of children) {
    if (c === null || c === undefined || c === false) continue;
    if (Array.isArray(c)) append(el, c);
    else el.appendChild(typeof c === "string" || typeof c === "number" ? document.createTextNode(String(c)) : c);
  }
}

export function replace(el: Element, ...children: Child[]) {
  el.replaceChildren();
  append(el, children);
}

const SVG_NS = "http://www.w3.org/2000/svg";

/** Single-colour glyphs (Style-guide §7): eye = sensor, arrow = action, diamond = operator, star = hero action. */
const GLYPHS: Record<string, string> = {
  sensor: "M2 12s4-7 10-7 10 7 10 7-4 7-10 7S2 12 2 12Zm10-3.5a3.5 3.5 0 1 0 0 7 3.5 3.5 0 0 0 0-7Z",
  action: "M3 10h11V5l8 7-8 7v-5H3z",
  operator: "M12 2l10 10-10 10L2 12z",
  hero_action: "M12 2l3 7h7l-5.5 4.5 2 7.5-6.5-4.5L5.5 21l2-7.5L2 9h7z",
  check: "M4 12.5l5 5L20 6.5l-2-2-9 9-3-3z",
  cross: "M6 4l6 6 6-6 2 2-6 6 6 6-2 2-6-6-6 6-2-2 6-6-6-6z",
  heart: "M12 21s-8-5.5-8-11a4.5 4.5 0 0 1 8-2.8A4.5 4.5 0 0 1 20 10c0 5.5-8 11-8 11z",
  shield: "M12 2l8 3v6c0 5-3.5 9-8 11-4.5-2-8-6-8-11V5z",
  flame: "M12 2c1 4 6 6 6 12a6 6 0 0 1-12 0c0-3 2-5 3-6 0 2 1 3 2 3 0-3-1-6 1-9z",
  play: "M7 4l13 8-13 8z",
  pause: "M6 4h4v16H6zm8 0h4v16h-4z",
  step: "M5 4l10 8-10 8zm11 0h3v16h-3z",
  skip: "M3 4l8 8-8 8zm9 0l8 8-8 8z",
  up: "M12 5l8 9H4z",
  down: "M12 19l8-9H4z",
  close: "M6 4l6 6 6-6 2 2-6 6 6 6-2 2-6-6-6 6-2-2 6-6-6-6z",
  info: "M11 10h2v8h-2zm0-4h2v2h-2z M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20zm0 2a8 8 0 1 1 0 16 8 8 0 0 1 0-16z",
};

export function glyph(name: keyof typeof GLYPHS | string, cls = "glyph"): SVGSVGElement {
  const svg = document.createElementNS(SVG_NS, "svg");
  svg.setAttribute("viewBox", "0 0 24 24");
  svg.setAttribute("class", cls);
  svg.setAttribute("aria-hidden", "true");
  const path = document.createElementNS(SVG_NS, "path");
  path.setAttribute("d", GLYPHS[name] ?? GLYPHS.info!);
  path.setAttribute("fill", "currentColor");
  path.setAttribute("fill-rule", "evenodd");
  svg.appendChild(path);
  return svg;
}

export const prefersReducedMotion = () =>
  typeof matchMedia === "function" && matchMedia("(prefers-reduced-motion: reduce)").matches;
