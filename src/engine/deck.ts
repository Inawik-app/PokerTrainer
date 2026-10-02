import { fullDeck, type Card } from "./cards";
import type { Rng } from "@/lib/rng";

export type Deck = Card[];

export function createDeck(rng: Rng): Deck {
  return rng.shuffle(fullDeck());
}

/** Immutable draw: returns remaining deck and drawn cards. */
export function draw(deck: Deck, n: number): { deck: Deck; cards: Card[] } {
  if (n < 0 || n > deck.length) {
    throw new Error(`Cannot draw ${n} cards from deck of ${deck.length}`);
  }
  return {
    cards: deck.slice(0, n),
    deck: deck.slice(n),
  };
}
