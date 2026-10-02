import { RANK_VALUES, type Card } from "./cards";

export type HandCategory =
  | "HIGH_CARD"
  | "PAIR"
  | "TWO_PAIR"
  | "THREE_OF_A_KIND"
  | "STRAIGHT"
  | "FLUSH"
  | "FULL_HOUSE"
  | "FOUR_OF_A_KIND"
  | "STRAIGHT_FLUSH"
  | "ROYAL_FLUSH";

export type HandResult = {
  category: HandCategory;
  score: number;
  bestFive: Card[];
  labelFr: string;
};

const CATEGORY_RANK: Record<HandCategory, number> = {
  HIGH_CARD: 0,
  PAIR: 1,
  TWO_PAIR: 2,
  THREE_OF_A_KIND: 3,
  STRAIGHT: 4,
  FLUSH: 5,
  FULL_HOUSE: 6,
  FOUR_OF_A_KIND: 7,
  STRAIGHT_FLUSH: 8,
  ROYAL_FLUSH: 9,
};

const RANK_FR: Record<number, string> = {
  2: "2",
  3: "3",
  4: "4",
  5: "5",
  6: "6",
  7: "7",
  8: "8",
  9: "9",
  10: "10",
  11: "Valet",
  12: "Dame",
  13: "Roi",
  14: "As",
};

const RANK_FR_PLURAL: Record<number, string> = {
  2: "2",
  3: "3",
  4: "4",
  5: "5",
  6: "6",
  7: "7",
  8: "8",
  9: "9",
  10: "10",
  11: "Valets",
  12: "Dames",
  13: "Rois",
  14: "As",
};

function packScore(category: HandCategory, a = 0, b = 0, c = 0, d = 0, e = 0): number {
  return (
    ((((CATEGORY_RANK[category] * 15 + a) * 15 + b) * 15 + c) * 15 + d) * 15 + e
  );
}

/** Highest straight top card from a rank bitset (bit v set if rank v present). Wheel → 5. */
function straightHighFromBits(bits: number): number {
  for (let high = 14; high >= 6; high -= 1) {
    // need high..high-4
    const mask = 0x1f << (high - 4);
    if ((bits & mask) === mask) return high;
  }
  // wheel: A + 2 + 3 + 4 + 5 → bits 14,2,3,4,5
  const wheel = (1 << 14) | (1 << 5) | (1 << 4) | (1 << 3) | (1 << 2);
  if ((bits & wheel) === wheel) return 5;
  return 0;
}

function flushArticle(v: number): string {
  if (v === 14) return "Couleur à l'As";
  if (v === 12) return "Couleur à la Dame";
  if (v === 11 || v === 13 || v === 10) return `Couleur au ${RANK_FR[v]}`;
  return `Couleur au ${RANK_FR[v]}`;
}

function makeLabel(
  category: HandCategory,
  a: number,
  b: number,
): string {
  switch (category) {
    case "ROYAL_FLUSH":
      return "Quinte flush royale";
    case "STRAIGHT_FLUSH":
      return `Quinte flush au ${RANK_FR[a]}`;
    case "FOUR_OF_A_KIND":
      return `Carré de ${RANK_FR_PLURAL[a]}`;
    case "FULL_HOUSE":
      return `Full aux ${RANK_FR_PLURAL[a]} par les ${RANK_FR_PLURAL[b]}`;
    case "FLUSH":
      return flushArticle(a);
    case "STRAIGHT":
      return `Quinte au ${RANK_FR[a]}`;
    case "THREE_OF_A_KIND":
      return `Brelan de ${RANK_FR_PLURAL[a]}`;
    case "TWO_PAIR":
      return `Double paire ${RANK_FR_PLURAL[a]} et ${RANK_FR_PLURAL[b]}`;
    case "PAIR":
      return `Paire de ${RANK_FR_PLURAL[a]}`;
    default:
      return `Carte haute ${RANK_FR[a]}`;
  }
}

function cardsForValues(
  cards: Card[],
  values: number[],
  suitFilter?: Card["suit"],
): Card[] {
  const result: Card[] = [];
  const used = new Uint8Array(cards.length);
  for (const v of values) {
    for (let i = 0; i < cards.length; i += 1) {
      if (used[i]) continue;
      const card = cards[i]!;
      if (suitFilter && card.suit !== suitFilter) continue;
      if (RANK_VALUES[card.rank] === v) {
        result.push(card);
        used[i] = 1;
        break;
      }
    }
  }
  return result;
}

function straightValues(high: number): number[] {
  if (high === 5) return [5, 4, 3, 2, 14];
  return [high, high - 1, high - 2, high - 3, high - 4];
}

export function evaluateHand(cards: Card[]): HandResult {
  const n = cards.length;
  if (n < 5 || n > 7) {
    throw new Error(`evaluateHand expects 5 to 7 cards, got ${n}`);
  }

  // rankCount[2..14], suitCount for c,d,h,s
  const rankCount = new Uint8Array(15);
  const suitCount = new Uint8Array(4);
  const suitBits = [0, 0, 0, 0]; // rank bitsets per suit
  let allBits = 0;

  for (let i = 0; i < n; i += 1) {
    const card = cards[i]!;
    const v = RANK_VALUES[card.rank];
    rankCount[v] += 1;
    allBits |= 1 << v;
    const s =
      card.suit === "c" ? 0 : card.suit === "d" ? 1 : card.suit === "h" ? 2 : 3;
    suitCount[s] += 1;
    suitBits[s]! |= 1 << v;
  }

  // Flush / straight flush
  let flushSuit = -1;
  for (let s = 0; s < 4; s += 1) {
    if (suitCount[s]! >= 5) {
      flushSuit = s;
      break;
    }
  }

  if (flushSuit >= 0) {
    const fBits = suitBits[flushSuit]!;
    const sfHigh = straightHighFromBits(fBits);
    if (sfHigh) {
      const category: HandCategory =
        sfHigh === 14 ? "ROYAL_FLUSH" : "STRAIGHT_FLUSH";
      const suitChar =
        flushSuit === 0 ? "c" : flushSuit === 1 ? "d" : flushSuit === 2 ? "h" : "s";
      return {
        category,
        score: packScore(category, sfHigh),
        bestFive: cardsForValues(cards, straightValues(sfHigh), suitChar),
        labelFr: makeLabel(category, sfHigh, 0),
      };
    }

    // Best flush: top 5 ranks of that suit
    const flushVals: number[] = [];
    for (let v = 14; v >= 2 && flushVals.length < 5; v -= 1) {
      if (fBits & (1 << v)) flushVals.push(v);
    }
    const suitChar =
      flushSuit === 0 ? "c" : flushSuit === 1 ? "d" : flushSuit === 2 ? "h" : "s";
    return {
      category: "FLUSH",
      score: packScore(
        "FLUSH",
        flushVals[0],
        flushVals[1],
        flushVals[2],
        flushVals[3],
        flushVals[4],
      ),
      bestFive: cardsForValues(cards, flushVals, suitChar),
      labelFr: makeLabel("FLUSH", flushVals[0]!, 0),
    };
  }

  // Quads / full house / trips / pairs from counts
  let quad = 0;
  let trip1 = 0;
  let trip2 = 0;
  let pair1 = 0;
  let pair2 = 0;
  const singles: number[] = [];

  for (let v = 14; v >= 2; v -= 1) {
    const c = rankCount[v]!;
    if (c === 4) quad = v;
    else if (c === 3) {
      if (!trip1) trip1 = v;
      else trip2 = v;
    } else if (c === 2) {
      if (!pair1) pair1 = v;
      else if (!pair2) pair2 = v;
    } else if (c === 1) singles.push(v);
  }

  if (quad) {
    const kicker = trip1 || pair1 || singles[0]!;
    return {
      category: "FOUR_OF_A_KIND",
      score: packScore("FOUR_OF_A_KIND", quad, kicker),
      bestFive: cardsForValues(cards, [quad, quad, quad, quad, kicker]),
      labelFr: makeLabel("FOUR_OF_A_KIND", quad, kicker),
    };
  }

  // Full house: trips + pair, or two trips, or trips + another pair
  if (trip1 && (pair1 || trip2)) {
    const pair = pair1 || trip2;
    return {
      category: "FULL_HOUSE",
      score: packScore("FULL_HOUSE", trip1, pair),
      bestFive: cardsForValues(cards, [trip1, trip1, trip1, pair, pair]),
      labelFr: makeLabel("FULL_HOUSE", trip1, pair),
    };
  }

  const sHigh = straightHighFromBits(allBits);
  if (sHigh) {
    return {
      category: "STRAIGHT",
      score: packScore("STRAIGHT", sHigh),
      bestFive: cardsForValues(cards, straightValues(sHigh)),
      labelFr: makeLabel("STRAIGHT", sHigh, 0),
    };
  }

  if (trip1) {
    const k1 = singles[0] ?? pair1;
    const k2 = singles[1] ?? (singles[0] === k1 ? singles[1] : singles[0]);
    // kickers: highest remaining excluding trip
    const kickers: number[] = [];
    if (pair1) kickers.push(pair1); // one from pair as kicker
    for (const s of singles) {
      if (kickers.length >= 2) break;
      kickers.push(s);
    }
    while (kickers.length < 2) kickers.push(0);
    return {
      category: "THREE_OF_A_KIND",
      score: packScore("THREE_OF_A_KIND", trip1, kickers[0], kickers[1]),
      bestFive: cardsForValues(cards, [
        trip1,
        trip1,
        trip1,
        kickers[0]!,
        kickers[1]!,
      ]),
      labelFr: makeLabel("THREE_OF_A_KIND", trip1, 0),
    };
  }

  if (pair1 && pair2) {
    const kicker =
      (trip2 || 0) ||
      singles[0] ||
      // third pair becomes kicker rank (one card)
      0;
    // also check for third pair
    let thirdPair = 0;
    for (let v = 14; v >= 2; v -= 1) {
      if (rankCount[v] === 2 && v !== pair1 && v !== pair2) {
        thirdPair = v;
        break;
      }
    }
    const kick = singles[0] || thirdPair;
    const hp = pair1;
    const lp = pair2;
    return {
      category: "TWO_PAIR",
      score: packScore("TWO_PAIR", hp, lp, kick),
      bestFive: cardsForValues(cards, [hp, hp, lp, lp, kick]),
      labelFr: makeLabel("TWO_PAIR", hp, lp),
    };
  }

  if (pair1) {
    const kickers = singles.slice(0, 3);
    while (kickers.length < 3) kickers.push(0);
    return {
      category: "PAIR",
      score: packScore("PAIR", pair1, kickers[0], kickers[1], kickers[2]),
      bestFive: cardsForValues(cards, [
        pair1,
        pair1,
        kickers[0]!,
        kickers[1]!,
        kickers[2]!,
      ]),
      labelFr: makeLabel("PAIR", pair1, 0),
    };
  }

  const top = singles.slice(0, 5);
  return {
    category: "HIGH_CARD",
    score: packScore("HIGH_CARD", top[0], top[1], top[2], top[3], top[4]),
    bestFive: cardsForValues(cards, top),
    labelFr: makeLabel("HIGH_CARD", top[0]!, 0),
  };
}

export function compareHands(a: HandResult, b: HandResult): number {
  return a.score - b.score;
}

export function findWinners(
  hands: { playerId: string; cards: Card[] }[],
): { winners: string[]; results: Map<string, HandResult> } {
  const results = new Map<string, HandResult>();
  let bestScore = -1;
  const winners: string[] = [];

  for (const hand of hands) {
    const result = evaluateHand(hand.cards);
    results.set(hand.playerId, result);
    if (result.score > bestScore) {
      bestScore = result.score;
      winners.length = 0;
      winners.push(hand.playerId);
    } else if (result.score === bestScore) {
      winners.push(hand.playerId);
    }
  }

  return { winners, results };
}
