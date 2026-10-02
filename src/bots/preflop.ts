import { RANK_VALUES, type Card } from "@/engine/cards";

/** Higher score = stronger starting hand (approx). */
export function preflopStrength(cards: Card[]): number {
  if (cards.length !== 2) return 0;
  const [a, b] = cards;
  const va = RANK_VALUES[a!.rank];
  const vb = RANK_VALUES[b!.rank];
  const high = Math.max(va, vb);
  const low = Math.min(va, vb);
  const paired = va === vb;
  const suited = a!.suit === b!.suit;
  let score = high * 2 + low;
  if (paired) score += 18;
  if (suited) score += 4;
  if (high - low <= 2) score += 2;
  if (high === 14) score += 3;
  return score;
}

export function handPercentile(cards: Card[]): number {
  const s = preflopStrength(cards);
  return Math.min(1, Math.max(0, (s - 10) / 50));
}

export function isInVpip(cards: Card[], vpip: number, positionBonus = 0): boolean {
  return handPercentile(cards) >= 1 - (vpip + positionBonus);
}

export function isInPfr(cards: Card[], pfr: number, positionBonus = 0): boolean {
  return handPercentile(cards) >= 1 - (pfr + positionBonus);
}
