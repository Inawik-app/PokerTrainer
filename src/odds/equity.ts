import type { Rng } from "@/lib/rng";
import { fullDeck, type Card } from "@/engine/cards";
import { evaluateHand } from "@/engine/evaluator";

export type EquityInput = {
  hero: Card[];
  board: Card[];
  opponents: number;
  deadCards?: Card[];
  iterations: number;
  rng: Rng;
};

export type EquityResult = {
  win: number;
  tie: number;
  lose: number;
  equity: number;
  iterations: number;
};

function key(c: Card): string {
  return `${c.rank}${c.suit}`;
}

function remainingDeck(dead: Card[]): Card[] {
  const used = new Set(dead.map(key));
  return fullDeck().filter((c) => !used.has(key(c)));
}

function dealFrom(
  deck: Card[],
  n: number,
  rng: Rng,
): { cards: Card[]; deck: Card[] } {
  const shuffled = rng.shuffle(deck);
  return { cards: shuffled.slice(0, n), deck: shuffled.slice(n) };
}

/**
 * Monte Carlo equity of hero vs N random opponents.
 * equity = win + tie/N_winners approximated as win + tie/2 for multiway simplicity:
 * we use win + tie * (1 / (opponents+1)) average share... Standard: equity = wins + ties/2 in HU;
 * for multiway: equity += 1/numWinners on ties.
 */
export function computeEquity(input: EquityInput): EquityResult {
  const { hero, board, opponents, deadCards = [], iterations, rng } = input;
  if (opponents < 1) {
    return { win: 1, tie: 0, lose: 0, equity: 1, iterations: 0 };
  }

  const dead = [...hero, ...board, ...deadCards];
  let wins = 0;
  let ties = 0;
  let losses = 0;
  let equitySum = 0;

  const boardNeed = 5 - board.length;
  const holeNeed = opponents * 2;

  for (let i = 0; i < iterations; i += 1) {
    let deck = remainingDeck(dead);
    const dealt = dealFrom(deck, holeNeed + boardNeed, rng);
    const oppCards: Card[][] = [];
    let offset = 0;
    for (let o = 0; o < opponents; o += 1) {
      oppCards.push(dealt.cards.slice(offset, offset + 2));
      offset += 2;
    }
    const runBoard = [...board, ...dealt.cards.slice(offset, offset + boardNeed)];

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

  const inv = iterations > 0 ? 1 / iterations : 0;
  return {
    win: wins * inv,
    tie: ties * inv,
    lose: losses * inv,
    equity: equitySum * inv,
    iterations,
  };
}
