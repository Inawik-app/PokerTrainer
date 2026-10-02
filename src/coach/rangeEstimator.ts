import type { ProfileId } from "@/content/playerProfiles";
import type { Card } from "@/engine/cards";
import { RANKS, SUITS } from "@/engine/cards";
import type { Street } from "@/engine";
import { evaluateHand } from "@/engine/evaluator";
import {
  effectiveProfile,
  type OpponentModel,
} from "./opponentModel";

export type WeightedHand = {
  cards: [Card, Card];
  weight: number;
};

export type PositionBucket = "early" | "middle" | "late" | "blinds";

/** Typical preflop VPIP width by profile (fraction of starting hands). */
const PROFILE_VPIP: Record<ProfileId, number> = {
  TAG: 0.22,
  LAG: 0.34,
  TIGHT_PASSIVE: 0.12,
  LOOSE_PASSIVE: 0.48,
  FISH: 0.55,
};

const PROFILE_PFR: Record<ProfileId, number> = {
  TAG: 0.17,
  LAG: 0.27,
  TIGHT_PASSIVE: 0.06,
  LOOSE_PASSIVE: 0.07,
  FISH: 0.12,
};

const PROFILE_BLUFF: Record<ProfileId, number> = {
  TAG: 0.22,
  LAG: 0.38,
  TIGHT_PASSIVE: 0.05,
  LOOSE_PASSIVE: 0.08,
  FISH: 0.32,
};

function cardKey(c: Card): string {
  return `${c.rank}${c.suit}`;
}

function allHolePairs(dead: Set<string>): [Card, Card][] {
  const cards: Card[] = [];
  for (const r of RANKS) {
    for (const s of SUITS) {
      const c = { rank: r, suit: s } as Card;
      if (!dead.has(cardKey(c))) cards.push(c);
    }
  }
  const pairs: [Card, Card][] = [];
  for (let i = 0; i < cards.length; i += 1) {
    for (let j = i + 1; j < cards.length; j += 1) {
      pairs.push([cards[i]!, cards[j]!]);
    }
  }
  return pairs;
}

function handStrengthScore(cards: [Card, Card]): number {
  const [a, b] = cards;
  const rankVal = (r: string) => "23456789TJQKA".indexOf(r);
  const ra = rankVal(a.rank);
  const rb = rankVal(b.rank);
  const high = Math.max(ra, rb);
  const low = Math.min(ra, rb);
  const paired = ra === rb;
  const suited = a.suit === b.suit;
  let score = high * 2 + low * 0.5;
  if (paired) score += 8;
  if (suited) score += 2;
  if (high - low <= 2 && high >= 8) score += 1.5;
  return score;
}

function positionWidthFactor(pos: PositionBucket): number {
  switch (pos) {
    case "early":
      return 0.75;
    case "middle":
      return 0.95;
    case "late":
      return 1.2;
    case "blinds":
      return 1.1;
    default:
      return 1;
  }
}

export type PreflopAction = "fold" | "call" | "raise" | "unknown";

/**
 * Starting range from profile + position + observed preflop action.
 * A raise from a rock → premium; a call from calling station → almost anything.
 */
export function estimatePreflopRange(
  model: OpponentModel,
  position: PositionBucket,
  action: PreflopAction,
  deadCards: Card[],
): WeightedHand[] {
  const profile = effectiveProfile(model);
  const dead = new Set(deadCards.map(cardKey));
  const pairs = allHolePairs(dead);
  const scored = pairs
    .map((cards) => ({ cards, score: handStrengthScore(cards) }))
    .sort((a, b) => b.score - a.score);

  let width = PROFILE_VPIP[profile] * positionWidthFactor(position);
  if (action === "raise") {
    width = Math.min(width, PROFILE_PFR[profile] * positionWidthFactor(position));
    width = Math.max(0.04, width);
  } else if (action === "call") {
    if (profile === "LOOSE_PASSIVE" || profile === "FISH") {
      width = Math.min(0.7, width * 1.35);
    } else if (profile === "TIGHT_PASSIVE") {
      width = Math.min(0.2, width * 1.1);
    }
  } else if (action === "fold") {
    return [];
  }

  const keep = Math.max(1, Math.floor(scored.length * width));
  const selected = scored.slice(0, keep);
  const maxScore = selected[0]?.score ?? 1;
  return selected.map(({ cards, score }) => ({
    cards,
    weight: 0.35 + 0.65 * (score / maxScore),
  }));
}

function touchesBoard(hole: [Card, Card], board: Card[]): boolean {
  if (board.length < 3) return true;
  const ranks = new Set(board.map((c) => c.rank));
  const suits = board.map((c) => c.suit);
  const suitCount = (s: string) => suits.filter((x) => x === s).length;
  const paired = hole[0].rank === hole[1].rank;
  const hitRank = ranks.has(hole[0].rank) || ranks.has(hole[1].rank);
  const flushDraw =
    suitCount(hole[0].suit) >= 2 || suitCount(hole[1].suit) >= 2;
  return paired || hitRank || flushDraw;
}

const MADE_OK = new Set([
  "PAIR",
  "TWO_PAIR",
  "THREE_OF_A_KIND",
  "STRAIGHT",
  "FLUSH",
  "FULL_HOUSE",
  "FOUR_OF_A_KIND",
  "STRAIGHT_FLUSH",
  "ROYAL_FLUSH",
]);

function isStrongMade(hole: [Card, Card], board: Card[]): boolean {
  if (board.length < 3) return false;
  return MADE_OK.has(evaluateHand([...hole, ...board]).category);
}

/**
 * Narrow range after the flop from actions.
 * Bet/raise → keep board-connected + draws (bluff share from profile).
 * Check → drop some strong made hands.
 */
export function narrowRangePostflop(
  range: WeightedHand[],
  board: Card[],
  action: "check" | "bet" | "raise" | "call" | "fold",
  profile: ProfileId,
): WeightedHand[] {
  if (range.length === 0 || board.length < 3) return range;
  const bluff = PROFILE_BLUFF[profile];

  if (action === "fold") return [];

  if (action === "bet" || action === "raise") {
    return range
      .map((h) => {
        const strong = isStrongMade(h.cards, board);
        const drawish = touchesBoard(h.cards, board);
        let w = h.weight;
        if (strong) w *= 1.4;
        else if (drawish) w *= 0.7 + bluff;
        else w *= bluff * 0.5;
        return { ...h, weight: w };
      })
      .filter((h) => h.weight > 0.05);
  }

  if (action === "check") {
    return range.map((h) => {
      const strong = isStrongMade(h.cards, board);
      return {
        ...h,
        weight: strong ? h.weight * 0.55 : h.weight * 1.05,
      };
    });
  }

  // call: keep medium+ hands
  return range.map((h) => {
    const strong = isStrongMade(h.cards, board);
    const drawish = touchesBoard(h.cards, board);
    return {
      ...h,
      weight: strong || drawish ? h.weight : h.weight * 0.45,
    };
  });
}

export function estimateRangeForOpponent(input: {
  model: OpponentModel;
  position: PositionBucket;
  preflopAction: PreflopAction;
  street: Street;
  board: Card[];
  deadCards: Card[];
  lastPostflopAction?: "check" | "bet" | "raise" | "call" | "fold";
}): WeightedHand[] {
  let range = estimatePreflopRange(
    input.model,
    input.position,
    input.preflopAction,
    input.deadCards,
  );
  if (input.board.length >= 3 && input.lastPostflopAction) {
    range = narrowRangePostflop(
      range,
      input.board,
      input.lastPostflopAction,
      effectiveProfile(input.model),
    );
  }
  return range;
}
