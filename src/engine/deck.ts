import { type RngState, shuffle } from "./rng";

export interface CardInstance {
  instanceId: string;
  cardId: string;
}

export interface DeckState {
  drawPile: CardInstance[];
  discardPile: CardInstance[];
}

export function buildDeck(rng: RngState, cards: readonly CardInstance[]): DeckState {
  return { drawPile: shuffle(rng, cards), discardPile: [] };
}

/** Draw up to n cards, reshuffling the discard pile if the draw pile runs out. */
export function draw(rng: RngState, deck: DeckState, n: number): CardInstance[] {
  const out: CardInstance[] = [];
  while (out.length < n) {
    if (deck.drawPile.length === 0) {
      if (deck.discardPile.length === 0) break;
      deck.drawPile = shuffle(rng, deck.discardPile);
      deck.discardPile = [];
    }
    out.push(deck.drawPile.shift()!);
  }
  return out;
}

/**
 * Make sure a hand can always form a row: if it holds fewer than `min` cards of a kind, swap surplus cards
 * for the first matching cards in the draw pile (and then the discard pile). Deterministic.
 */
export function ensureMinimum(hand: CardInstance[], deck: DeckState, matches: (c: CardInstance) => boolean, min: number) {
  let have = hand.filter(matches).length;
  for (const pile of [deck.drawPile, deck.discardPile]) {
    for (let i = 0; i < pile.length && have < min; i++) {
      if (!matches(pile[i]!)) continue;
      const outIdx = hand.findIndex((c) => !matches(c));
      if (outIdx < 0) return;
      const [incoming] = pile.splice(i, 1, hand[outIdx]!);
      hand[outIdx] = incoming!;
      have++;
    }
  }
}
