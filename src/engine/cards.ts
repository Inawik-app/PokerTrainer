export const SUITS = ["c", "d", "h", "s"] as const;
export type Suit = (typeof SUITS)[number];

export const RANKS = [
  "2",
  "3",
  "4",
  "5",
  "6",
  "7",
  "8",
  "9",
  "T",
  "J",
  "Q",
  "K",
  "A",
] as const;
export type Rank = (typeof RANKS)[number];

export type Card = {
  rank: Rank;
  suit: Suit;
};

const RANK_CHARS = "23456789TJQKA";
const SUIT_CHARS = "cdhs";

export const RANK_VALUES: Record<Rank, number> = {
  "2": 2,
  "3": 3,
  "4": 4,
  "5": 5,
  "6": 6,
  "7": 7,
  "8": 8,
  "9": 9,
  T: 10,
  J: 11,
  Q: 12,
  K: 13,
  A: 14,
};

export function parseCard(text: string): Card {
  if (text.length !== 2) {
    throw new Error(`Invalid card: ${text}`);
  }
  const rankChar = text[0]!.toUpperCase();
  const suitChar = text[1]!.toLowerCase();
  if (!RANK_CHARS.includes(rankChar) || !SUIT_CHARS.includes(suitChar)) {
    throw new Error(`Invalid card: ${text}`);
  }
  return { rank: rankChar as Rank, suit: suitChar as Suit };
}

export function cardToString(card: Card): string {
  return `${card.rank}${card.suit}`;
}

export function fullDeck(): Card[] {
  const cards: Card[] = [];
  for (const suit of SUITS) {
    for (const rank of RANKS) {
      cards.push({ rank, suit });
    }
  }
  return cards;
}

export function cardsEqual(a: Card, b: Card): boolean {
  return a.rank === b.rank && a.suit === b.suit;
}
