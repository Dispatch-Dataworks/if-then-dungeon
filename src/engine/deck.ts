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

// TODO: exchange (discard 0-5, draw replacements) per 01-core-rules.md.
