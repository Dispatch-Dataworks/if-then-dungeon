/** Rule rows: IF <predicate> THEN <action> [ELSE <action>], built from card instances in the hand. */
import { CARDS } from "../content";
import type { CardInstance } from "../deck";
import type { GameState } from "../state";
import { parsePredicate, type Predicate, type Token } from "./parse";
import { senseCard } from "./sensors";

export interface RowDraft {
  /** Sensor and NOT/AND/OR cards, in order. */
  ifTokens: string[];
  thenAction: string;
  /** Both set for an ELSE branch: the OP_ELSE card and the action it runs. */
  elseCard?: string;
  elseAction?: string;
}

export interface ParsedRow {
  draft: RowDraft;
  predicate: Predicate;
  thenCardId: string;
  elseCardId?: string;
}

const isAction = (cardId: string) => CARDS[cardId]?.type === "action" || CARDS[cardId]?.type === "hero_action";

/** Validates one row against the hand. Returns the parsed row or a kid-readable error. */
export function parseRow(hand: readonly CardInstance[], draft: RowDraft): ParsedRow | { error: string } {
  const byId = new Map(hand.map((c) => [c.instanceId, c.cardId]));
  const cardOf = (id: string | undefined) => (id ? byId.get(id) : undefined);
  if (draft.ifTokens.length === 0) return { error: "Add a sensor after IF." };
  const tokens: Token[] = [];
  for (const id of draft.ifTokens) {
    const cardId = cardOf(id);
    const card = cardId ? CARDS[cardId] : undefined;
    if (!card) return { error: "A card in this row is not in your hand." };
    if (card.type === "sensor") tokens.push({ kind: "sensor", id: card.id });
    else if (card.id === "OP_NOT" || card.id === "OP_AND" || card.id === "OP_OR") {
      tokens.push({ kind: "op", op: card.id.slice(3) as "NOT" | "AND" | "OR" });
    } else return { error: `${card.name} can't go after IF.` };
  }
  let predicate: Predicate;
  try {
    predicate = parsePredicate(tokens);
  } catch {
    return { error: "The IF part needs sensors joined by AND / OR (NOT goes before a sensor)." };
  }
  const thenCardId = cardOf(draft.thenAction);
  if (!thenCardId || !isAction(thenCardId)) return { error: "Add an action after THEN." };
  let elseCardId: string | undefined;
  if (draft.elseCard || draft.elseAction) {
    if (cardOf(draft.elseCard) !== "OP_ELSE") return { error: "An ELSE branch needs an ELSE card." };
    elseCardId = cardOf(draft.elseAction);
    if (!elseCardId || !isAction(elseCardId)) return { error: "Add an action after ELSE." };
  }
  return { draft, predicate, thenCardId, elseCardId };
}

/** Validates all rows together: at least one row, each valid, and no card used twice. */
export function validateRows(hand: readonly CardInstance[], drafts: readonly RowDraft[]): { rows: ParsedRow[]; errors: string[] } {
  const errors: string[] = [];
  const rows: ParsedRow[] = [];
  if (drafts.length === 0) errors.push("Build at least one row.");
  const used = new Set<string>();
  drafts.forEach((d, i) => {
    for (const id of rowCardIds(d)) {
      if (used.has(id)) errors.push(`Row ${i + 1}: a card is used twice.`);
      used.add(id);
    }
    const r = parseRow(hand, d);
    if ("error" in r) errors.push(`Row ${i + 1}: ${r.error}`);
    else rows.push(r);
  });
  return { rows, errors };
}

export const rowCardIds = (d: RowDraft) =>
  [...d.ifTokens, d.thenAction, d.elseCard, d.elseAction].filter((x): x is string => !!x);

export function evalPredicate(state: GameState, p: Predicate): boolean {
  switch (p.kind) {
    case "sensor": return senseCard(state, p.id);
    case "not": return !evalPredicate(state, p.operand);
    case "and": return evalPredicate(state, p.left) && evalPredicate(state, p.right);
    case "or": return evalPredicate(state, p.left) || evalPredicate(state, p.right);
  }
}

export function describeRow(row: ParsedRow): string {
  const name = (id: string) => CARDS[id]?.name ?? id;
  const pred = (p: Predicate): string =>
    p.kind === "sensor" ? name(p.id) : p.kind === "not" ? `NOT ${pred(p.operand)}` : `${pred(p.left)} ${p.kind.toUpperCase()} ${pred(p.right)}`;
  return `IF ${pred(row.predicate)} THEN ${name(row.thenCardId)}${row.elseCardId ? ` ELSE ${name(row.elseCardId)}` : ""}`;
}
