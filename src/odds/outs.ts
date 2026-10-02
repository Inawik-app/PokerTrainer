import type { Card } from "@/engine/cards";
import { RANK_VALUES } from "@/engine/cards";
import { evaluateHand } from "@/engine/evaluator";

export type DrawType =
  | "flush"
  | "oesd"
  | "gutshot"
  | "overcards"
  | "pair_improve";

export type OutInfo = {
  card: Card;
  improvesTo: string;
  drawTypes: DrawType[];
};

function cardKey(c: Card): string {
  return `${c.rank}${c.suit}`;
}

function isFlushDraw(hero: Card[], board: Card[]): boolean {
  if (board.length < 3) return false;
  const suits = [...hero, ...board].reduce(
    (acc, c) => {
      acc[c.suit] = (acc[c.suit] ?? 0) + 1;
      return acc;
    },
    {} as Record<string, number>,
  );
  return Object.values(suits).some((n) => n === 4);
}

function straightDrawType(hero: Card[], board: Card[]): "oesd" | "gutshot" | null {
  if (board.length < 3) return null;
  const values = [...new Set([...hero, ...board].map((c) => RANK_VALUES[c.rank]))].sort(
    (a, b) => a - b,
  );
  // Simple window check for 4-straight / gutshot patterns among 4-5 unique ranks
  const bits = values.reduce((b, v) => b | (1 << v), 0);
  let oesd = false;
  let gut = false;
  for (let high = 6; high <= 14; high += 1) {
    let missing = 0;
    for (let v = high - 4; v <= high; v += 1) {
      if (!(bits & (1 << v))) missing += 1;
    }
    if (missing === 1) {
      // open-ender if missing is an end; gutshot if middle
      const missEnds =
        !(bits & (1 << (high - 4))) || !(bits & (1 << high));
      if (missEnds) oesd = true;
      else gut = true;
    }
  }
  // wheel windows
  const wheel = [14, 2, 3, 4, 5];
  let wMiss = 0;
  for (const v of wheel) if (!(bits & (1 << v))) wMiss += 1;
  if (wMiss === 1) gut = true;

  if (oesd) return "oesd";
  if (gut) return "gutshot";
  return null;
}

/** Cards that improve hero's hand category vs current best. */
export function getOuts(hero: Card[], board: Card[]): OutInfo[] {
  if (board.length === 0 || board.length >= 5) return [];
  const used = new Set([...hero, ...board].map(cardKey));
  const current = evaluateHand([...hero, ...board]);
  const outs: OutInfo[] = [];

  const flushDraw = isFlushDraw(hero, board);
  const straightDraw = straightDrawType(hero, board);
  const heroHigh = Math.max(...hero.map((c) => RANK_VALUES[c.rank]));

  const suits = ["c", "d", "h", "s"] as const;
  const ranks = ["2", "3", "4", "5", "6", "7", "8", "9", "T", "J", "Q", "K", "A"] as const;

  for (const r of ranks) {
    for (const s of suits) {
      const card: Card = { rank: r, suit: s };
      if (used.has(cardKey(card))) continue;
      const nextBoard = [...board, card];
      const next = evaluateHand([...hero, ...nextBoard]);
      if (next.score > current.score) {
        const drawTypes: DrawType[] = [];
        if (flushDraw && next.category === "FLUSH") drawTypes.push("flush");
        if (
          straightDraw &&
          (next.category === "STRAIGHT" || next.category === "STRAIGHT_FLUSH")
        ) {
          drawTypes.push(straightDraw);
        }
        if (
          RANK_VALUES[r] > heroHigh &&
          (next.category === "PAIR" || next.category === "TWO_PAIR")
        ) {
          drawTypes.push("overcards");
        }
        if (drawTypes.length === 0) drawTypes.push("pair_improve");
        outs.push({
          card,
          improvesTo: next.labelFr,
          drawTypes,
        });
      }
    }
  }
  return outs;
}
