import type { Card } from "@/engine/cards";
import { fullDeck } from "@/engine/cards";
import { evaluateHand } from "@/engine/evaluator";
import type { Rng } from "@/lib/rng";
import type { WeightedHand } from "./rangeEstimator";

function key(c: Card): string {
  return `${c.rank}${c.suit}`;
}

function pickWeighted(range: WeightedHand[], rng: Rng): [Card, Card] | null {
  const total = range.reduce((s, h) => s + h.weight, 0);
  if (total <= 0 || range.length === 0) return null;
  let r = rng.next() * total;
  for (const h of range) {
    r -= h.weight;
    if (r <= 0) return h.cards;
  }
  return range[range.length - 1]!.cards;
}

export type RangeEquityResult = {
  equity: number;
  win: number;
  tie: number;
  lose: number;
  iterations: number;
};

/**
 * Monte Carlo equity vs weighted opponent hole-card ranges (one range per opp).
 * Falls back to random holes when a range is empty.
 */
export function computeEquityVsRanges(input: {
  hero: Card[];
  board: Card[];
  ranges: WeightedHand[][];
  iterations: number;
  rng: Rng;
}): RangeEquityResult {
  const { hero, board, ranges, iterations, rng } = input;
  const opponents = ranges.length;
  if (opponents < 1) {
    return { equity: 1, win: 1, tie: 0, lose: 0, iterations: 0 };
  }

  let wins = 0;
  let ties = 0;
  let losses = 0;
  let equitySum = 0;
  const boardNeed = 5 - board.length;

  for (let i = 0; i < iterations; i += 1) {
    const used = new Set([...hero, ...board].map(key));
    const oppCards: Card[][] = [];
    let failed = false;

    for (let o = 0; o < opponents; o += 1) {
      const available = (ranges[o] ?? []).filter(
        (h) => !used.has(key(h.cards[0])) && !used.has(key(h.cards[1])),
      );
      let hole = pickWeighted(available, rng);
      if (!hole) {
        const deck = fullDeck().filter((c) => !used.has(key(c)));
        const shuffled = rng.shuffle(deck);
        if (shuffled.length < 2) {
          failed = true;
          break;
        }
        hole = [shuffled[0]!, shuffled[1]!];
      }
      used.add(key(hole[0]));
      used.add(key(hole[1]));
      oppCards.push(hole);
    }
    if (failed) continue;

    let runBoard = [...board];
    if (boardNeed > 0) {
      const deck = fullDeck().filter((c) => !used.has(key(c)));
      const shuffled = rng.shuffle(deck);
      runBoard = [...board, ...shuffled.slice(0, boardNeed)];
    }

    const heroScore = evaluateHand([...hero, ...runBoard]).score;
    const scores = oppCards.map((h) => evaluateHand([...h, ...runBoard]).score);
    const bestOpp = Math.max(...scores);
    if (heroScore > bestOpp) {
      wins += 1;
      equitySum += 1;
    } else if (heroScore < bestOpp) {
      losses += 1;
    } else {
      const winners = 1 + scores.filter((s) => s === heroScore).length;
      ties += 1;
      equitySum += 1 / winners;
    }
  }

  const n = Math.max(1, iterations);
  return {
    equity: equitySum / n,
    win: wins / n,
    tie: ties / n,
    lose: losses / n,
    iterations,
  };
}
